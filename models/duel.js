const mongoose = require('mongoose');

const DuelSchema = new mongoose.Schema(
  {
    discord_id: String,
    is_duel_in_progress: {
      $type: Boolean,
      default: false
    }
  },
  {
    typeKey: '$type',
    timestamps: { createdAt: 'doc_created_at', updatedAt: 'doc_updated_at' }
  }
);

DuelSchema.index({ discord_id: 1 }, { unique: true });
DuelSchema.index({ doc_created_at: 1 });
module.exports = mongoose.model('Duel', DuelSchema, 'duels');
