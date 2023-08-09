const mongoose = require('mongoose');
const dotenv = require('dotenv');
const process = require('process');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const Stat = require('../models/stat');
const User = require('../models/user');

(async () => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const users = await User.find({}).lean();
      const stats = users.map((user) => ({
        discord_id: user.discord_id
      }));
      await Stat.insertMany(stats, { session, ordered: false });
    });
  } catch (error) {
    console.error(error);
  } finally {
    await session.endSession();
    process.exit(0);
  }
})();
