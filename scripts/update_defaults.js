const mongoose = require('mongoose');
const dotenv = require('dotenv');
const process = require('process');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const {
  BASE_ENERGY_POINTS,
  BASE_ATTACK_POWER,
  STARTER_GOLD,
  BASE_HEALTH_POINT
} = require('../constants');

const User = require('../models/user');

(async () => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await User.updateMany(
        {},
        {
          $set: {
            gold: STARTER_GOLD,
            energy_points: BASE_ENERGY_POINTS,
            attack_power: BASE_ATTACK_POWER,
            health_points: BASE_HEALTH_POINT
          }
        }
      );
    });
  } catch (error) {
    console.error(error);
  } finally {
    await session.endSession();
    process.exit(0);
  }
})();
