const mongoose = require('mongoose');

const DeathSchema = new mongoose.Schema(
  {
    type: String,
    discord_id: String,
    death_time: Date
  },
  {
    typeKey: '$type',
    timestamps: { createdAt: 'doc_created_at', updatedAt: 'doc_updated_at' }
  }
);

module.exports = mongoose.model('Death', DeathSchema, 'deaths');
