const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
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

NotificationSchema.index({ type: 'text' });

module.exports = mongoose.model(
  'Notification',
  NotificationSchema,
  'notifications'
);
