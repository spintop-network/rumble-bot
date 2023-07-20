exports = async () => {
  // TODO: Take isSuddenDeathActive into environment config files.
  const isSuddenDeathActive = false;
  if (!isSuddenDeathActive) return false;
  const serviceName = 'mongodb-atlas';
  const dbName = 'spinroyale';
  const client = context.services.get(serviceName);
  const db = client.db(dbName);
  const usersCollection = db.collection('users');
  const notifications = db.collection('notifications');
  const deaths = db.collection('deaths');

  const session = client.startSession();

  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };

  try {
    await session.withTransaction(async () => {
      const will_die_users = await usersCollection
        .find(
          {
            $and: [
              { health_points: { $lte: 10 } },
              { health_points: { $gt: 0 } }
            ]
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
        await notifications.insertMany(bulkOperations, { session });
        await deaths.insertMany(bulkOperations, { session });
      }

      usersCollection.updateMany(
        { health_points: { $gt: 0 } },
        { $inc: { health_points: -10 } },
        { session }
      );
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
