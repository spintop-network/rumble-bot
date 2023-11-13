const sudden_death = async (
  usersCol,
  notificationsCol,
  session,
  deathsCol,
  duelsCol,
  date_now
) => {
  const will_die_users = await usersCol
    .find(
      {
        $and: [{ health_points: { $lte: 5 } }, { health_points: { $gt: 0 } }]
      },
      { session }
    )
    .toArray();

  const bulkOperations = will_die_users.map((user) => ({
    type: 'sudden_death',
    discord_id: user.discord_id,
    death_time: date_now,
    doc_created_at: date_now,
    doc_updated_at: date_now
  }));

  if (bulkOperations.length > 0) {
    const deaths = (
      await deathsCol
        .find(
          { discord_id: { $in: will_die_users.map((i) => i.discord_id) } },
          { session }
        )
        .toArray()
    ).map((i) => i.discord_id);
    const will_inserted_deaths = bulkOperations.filter(
      (i) => !deaths.includes(i.discord_id)
    );
    if (will_inserted_deaths.length > 0) {
      await deathsCol.insertMany(will_inserted_deaths, {
        session,
        ordered: false
      });
      await notificationsCol.insertMany(bulkOperations, {
        session,
        ordered: false
      });
    }
    await duelsCol.deleteMany(
      { discord_id: { $in: will_die_users.map((i) => i.discord_id) } },
      { session }
    );
  }

  const will_dec_health = await usersCol
    .find({ health_points: { $gt: 0 } }, { session })
    .toArray();
  if (will_dec_health.length > 0) {
    await usersCol.updateMany(
      { discord_id: { $in: will_dec_health.map((i) => i.discord_id) } },
      { $inc: { health_points: -5 } },
      { session }
    );
    await notificationsCol.insertMany(
      will_dec_health.map((user) => ({
        type: 'sudden_health',
        discord_id: user.discord_id,
        death_time: date_now
      })),
      { session, ordered: false }
    );
  }

  return true;
};

const ep_regen = async (
  usersCol,
  notificationsCol,
  session,
  deathsCol,
  duelsCol,
  date_now
) => {
  const will_die_users = await usersCol
    .find(
      {
        energy_points: 6,
        $and: [{ health_points: { $lte: 5 } }, { health_points: { $gt: 0 } }]
      },
      { session }
    )
    .toArray();

  const bulkOperations = will_die_users.map((user) => ({
    type: 'inactivity_death',
    discord_id: user.discord_id,
    death_time: date_now,
    doc_created_at: date_now,
    doc_updated_at: date_now
  }));

  if (bulkOperations.length > 0) {
    const deaths = (
      await deathsCol
        .find(
          { discord_id: { $in: will_die_users.map((i) => i.discord_id) } },
          { session }
        )
        .toArray()
    ).map((i) => i.discord_id);
    const will_inserted_deaths = bulkOperations.filter(
      (i) => !deaths.includes(i.discord_id)
    );
    if (will_inserted_deaths.length > 0) {
      await deathsCol.insertMany(will_inserted_deaths, {
        session,
        ordered: false
      });
      const players_except_never_played = will_inserted_deaths.filter(
        (i) =>
          will_die_users.find((j) => j.discord_id === i.discord_id)
            ?.latest_play_button_click
      );
      if (players_except_never_played.length > 0) {
        await notificationsCol.insertMany(players_except_never_played, {
          session,
          ordered: false
        });
      }
    }
    await usersCol.updateMany(
      { discord_id: { $in: will_die_users.map((i) => i.discord_id) } },
      { $inc: { health_points: -5 } },
      { session }
    );
    await duelsCol.deleteMany(
      { discord_id: { $in: will_die_users.map((i) => i.discord_id) } },
      { session }
    );
  }

  await usersCol.updateMany(
    { health_points: { $gt: 0 } },
    { $inc: { gold: 10 } },
    { session }
  );
  const will_dec_health = await usersCol
    .find({ energy_points: 6, health_points: { $gt: 0 } }, { session })
    .toArray();
  if (will_dec_health.length > 0) {
    await usersCol.updateMany(
      { discord_id: { $in: will_dec_health.map((i) => i.discord_id) } },
      { $inc: { health_points: -5 } },
      { session }
    );
    await notificationsCol.insertMany(
      will_dec_health.map((user) => ({
        type: 'inactivity_health',
        discord_id: user.discord_id,
        death_time: date_now
      })),
      { session, ordered: false }
    );
  }
  await usersCol.updateMany(
    { energy_points: { $lt: 6 }, health_points: { $gt: 0 } },
    { $inc: { energy_points: 1 } },
    { session }
  );
  return true;
};

exports = async () => {
  const serviceName = 'mongodb-atlas';
  const dbName = 'spinroyale';
  const client = context.services.get(serviceName);
  const db = client.db(dbName);
  const usersCol = db.collection('users');
  const notifications = db.collection('notifications');
  const deaths = db.collection('deaths');
  const duels = db.collection('duels');
  const configs = db.collection('configs');

  const config = await configs.findOne({ id: 0 });

  const isGameStarted = config?.is_game_started ?? false;
  const isGameOver = config?.is_game_over ?? false;
  // is game started 7 days ago? if yes, sudden death is active. config.game_start_date + 7 days
  const isSuddenDeathActive = config.game_start_date
    ? new Date(config.game_start_date).getTime() + 7 * 24 * 60 * 60 * 1000 <=
      new Date().getTime()
    : false;
  if (!isGameStarted || isGameOver) return false;

  const session = client.startSession();

  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };

  try {
    await session.withTransaction(async () => {
      const active_user_count = await usersCol.count(
        { health_points: { $gt: 0 } },
        { session }
      );
      if (active_user_count > 1) {
        const now = new Date();
        await ep_regen(usersCol, notifications, session, deaths, duels, now);
        if (isSuddenDeathActive) {
          await sudden_death(
            usersCol,
            notifications,
            session,
            deaths,
            duels,
            now
          );
        }
      }
    }, transactionOptions);
    return true;
  } catch (e) {
    console.error(e);
    await session.abortTransaction();
    return false;
  } finally {
    await session.endSession();
  }
};
