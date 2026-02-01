import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    additionalInfo: { type: Map, of: String, default: () => new Map() },
    attendedEvent: { type: Boolean, default: false },
    // Embedded reminder data
    reminder: {
      sent: { type: Boolean, default: false },
      dismissed: { type: Boolean, default: false },
      time: { type: Date }, // Calculated as eventStart - 24 hours
    },
  },
  { timestamps: true }
);

signupSchema.index({ eventId: 1, userId: 1 }, { unique: true });
// Index for efficient reminder queries
signupSchema.index({ userId: 1, 'reminder.time': 1, 'reminder.sent': 1, 'reminder.dismissed': 1 });
export default mongoose.model('Signup', signupSchema);
