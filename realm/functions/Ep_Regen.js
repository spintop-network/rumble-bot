const sudden_death = async (
  usersCol,
  notificationsCol,
  session,
  deathsCol,
  duelsCol
) => {
  const will_die_users = await usersCol
    .find(
      {
        $and: [{ health_points: { $lte: 10 } }, { health_points: { $gt: 0 } }]
      },
      { session }
    )
    .toArray();

  const bulkOperations = will_die_users.map((user) => ({
    type: 'sudden_death',
    discord_id: user.discord_id,
    death_time: new Date()
  }));

  if (bulkOperations.length > 0) {
    await notificationsCol.insertMany(bulkOperations, {
      session,
      ordered: false
    });
    await deathsCol.insertMany(bulkOperations, { session, ordered: false });
    await duelsCol.deleteMany(
      { discord_id: { $in: will_die_users.map((i) => i.discord_id) } },
      { session }
    );
  }

  await usersCol.updateMany(
    { health_points: { $gt: 0 } },
    { $inc: { health_points: -10 } },
    { session }
  );
  return true;
};

const ep_regen = async (
  usersCol,
  notificationsCol,
  session,
  deathsCol,
  duelsCol
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
    death_time: new Date()
  }));

  if (bulkOperations.length > 0) {
    await notificationsCol.insertMany(bulkOperations, {
      session,
      ordered: false
    });
    await deathsCol.insertMany(bulkOperations, { session, ordered: false });
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
  await usersCol.updateMany(
    { energy_points: 6, health_points: { $gt: 0 } },
    { $inc: { health_points: -5 } },
    { session }
  );
  await usersCol.updateMany(
    { energy_points: { $lt: 6 }, health_points: { $gt: 0 } },
    { $inc: { energy_points: 1 } },
    { session }
  );
  return true;
};

exports = async () => {
  // TODO: Change this to environment variable.
  const isGameStarted = false;
  const isSuddenDeathActive = false;
  if (!isGameStarted) return false;
  const serviceName = 'mongodb-atlas';
  const dbName = 'spinroyale';
  const client = context.services.get(serviceName);
  const db = client.db(dbName);
  const usersCol = db.collection('users');
  const notifications = db.collection('notifications');
  const deaths = db.collection('deaths');
  const duels = db.collection('duels');

  const session = client.startSession();

  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };

  try {
    await session.withTransaction(async () => {
      await ep_regen(usersCol, notifications, session, deaths, duels);
      if (isSuddenDeathActive) {
        await sudden_death(usersCol, notifications, session, deaths, duels);
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
