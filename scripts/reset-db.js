const mongoose = require('mongoose');
const dotenv = require('dotenv');
const process = require('process');
dotenv.config();
mongoose.connect(process.env.MONGODB_URI);
const User = require('../models/user');
const Stat = require('../models/stat');
const Death = require('../models/death');
const Notification = require('../models/notification');
const Config = require('../models/config');
const Duel = require('../models/duel');

(async () => {
  await Promise.all([
    User.deleteMany({}),
    Stat.deleteMany({}),
    Death.deleteMany({}),
    Notification.deleteMany({}),
    Config.deleteMany({}),
    Duel.deleteMany({})
  ]);
  process.exit(0);
  console.log('Database reset.');
})();
