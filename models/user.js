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
    armor: String,
    latest_play_button_click: Date,
    latest_battle_datetime: Date,
    is_ever_clicked_battle_button: {
      $type: Boolean,
      default: false
    },
    is_ever_clicked_random_button: {
      $type: Boolean,
      default: false
    },
    has_seen_tie_message: {
      $type: Boolean,
      default: false
    }
  },
  {
    typeKey: '$type',
    timestamps: { createdAt: 'doc_created_at', updatedAt: 'doc_updated_at' }
  }
);

UserSchema.index({ discord_id: 1 }, { unique: true });
UserSchema.index({ wallet_id: 'text' }, { unique: true });
UserSchema.index({ health_points: 1, energy_points: 1 });
module.exports = mongoose.model('User', UserSchema, 'users');
