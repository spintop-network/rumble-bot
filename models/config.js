const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema(
  {
    is_game_over: Boolean,
    game_start_date: Date,
    id: {
      $type: Number,
      default: 0
    }
  },
  {
    typeKey: '$type',
    timestamps: { createdAt: 'doc_created_at', updatedAt: 'doc_updated_at' }
  }
);

ConfigSchema.index({ id: 1 }, { unique: true });
module.exports = mongoose.model('Config', ConfigSchema, 'configs');
