import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventTitle: { type: String },
    eventStart: { type: Date },
    reminderTime: { type: Date },
    sent: { type: Boolean, default: false },
    dismissed: { type: Boolean, default: false },
    createdAt: { type: Date },
  }
);
export default mongoose.model('Reminder', reminderSchema);
