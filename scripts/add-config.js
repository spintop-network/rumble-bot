const mongoose = require('mongoose');
const dotenv = require('dotenv');
const process = require('process');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const Config = require('../models/config');

(async () => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Config.deleteOne({ id: 0 });
      await Config.create({
        is_game_over: false,
        is_game_started: false,
        is_sudden_death_active: false,
        is_register_closed: false,
        id: 0
      });
    });
  } catch (error) {
    console.error(error);
  } finally {
    await session.endSession();
    process.exit(0);
  }
})();
