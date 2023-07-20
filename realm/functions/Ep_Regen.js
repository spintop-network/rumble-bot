exports = async () => {
  const serviceName = 'mongodb-atlas';
  const dbName = 'spinroyale';
  const db = context.services.get(serviceName).db(dbName);
  const usersCollection = db.collection('users');
  const notifications = db.collection('notifications');

  const will_die_users = await usersCollection
    .find({
      energy_points: 3,
      $and: [{ health_points: { $lte: 10 } }, { health_points: { $gt: 0 } }]
    })
    .toArray();

  const bulkOperations = Array.from(will_die_users).map((user) => ({
    insertOne: {
      document: {
        type: 'inactivity_death',
        discord_id: user.discord_id
      }
    }
  }));

  if (bulkOperations.length > 0) {
    await notifications.bulkWrite(bulkOperations);
  }

  usersCollection.updateMany(
    { energy_points: 3, health_points: { $gt: 0 } },
    { $inc: { health_points: -10 } }
  );
  usersCollection.updateMany(
    { energy_points: { $lt: 3 } },
    { $inc: { energy_points: 1 } }
  );

  return true;
};
