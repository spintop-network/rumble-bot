const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    discord_id: String,
    wallet_id: String,
    health_points: Number,
    attack_power: Number,
    energy_points: Number,
    health_potion_cost: Number,
    gold: Number,
    weapon: String,
    armor: String
  },
  {
    typeKey: '$type',
    timestamps: { createdAt: 'doc_created_at', updatedAt: 'doc_updated_at' }
  }
);

UserSchema.index({ discord_id: 1 }, { unique: true });
UserSchema.index({ wallet_id: 'text' }, { unique: true });
module.exports = mongoose.model('User', UserSchema, 'users');
