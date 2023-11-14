const mongoose = require('mongoose');
const dotenv = require('dotenv');
const process = require('process');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const Config = require('../models/config');

const game_start_date_cmd = process.argv[2];

(async () => {
  if (!game_start_date_cmd) {
    console.error('Please provide game start date!');
    process.exit(1);
  }
  const session = await mongoose.startSession();
  try {
    const game_start_date = new Date(game_start_date_cmd);
    await session.withTransaction(async () => {
      await Config.deleteOne({ id: 0 });
      await Config.create({
        is_game_over: false,
        ...(game_start_date_cmd && {
          game_start_date
        }),
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
