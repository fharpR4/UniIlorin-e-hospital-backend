const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'both'],
    required: true
  },
  subject: String,
  message: {
    type: String,
    required: true
  },
  status: {
    sent: { type: Boolean, default: false },
    sentAt: Date
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;