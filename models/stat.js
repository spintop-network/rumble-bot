const mongoose = require('mongoose');

const StatSchema = new mongoose.Schema(
  {
    discord_id: String,
    kills: {
      $type: Number,
      default: 0
    },
    inflicted_damage: {
      $type: Number,
      default: 0
    }
  },
  {
    typeKey: '$type',
    timestamps: { createdAt: 'doc_created_at', updatedAt: 'doc_updated_at' }
  }
);

StatSchema.index({ discord_id: 1 }, { unique: true });
module.exports = mongoose.model('Stat', StatSchema, 'stats');
