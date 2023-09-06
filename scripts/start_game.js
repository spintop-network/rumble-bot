const mongoose = require('mongoose');
const dotenv = require('dotenv');
const process = require('process');
dotenv.config();
mongoose.connect(process.env.MONGODB_URI);

const Config = require('../models/config');

const startGame = async () => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Config.updateOne(
        { id: 0 },
        {
          is_game_started: true,
          is_register_closed: true,
          game_start_date: new Date()
        },
        { session }
      );
    });
  } catch (error) {
    console.error(error);
  } finally {
    await session.endSession();
  }
};

if (require.main === module) {
  startGame().then(() => process.exit(0));
}

module.exports = { startGame };
