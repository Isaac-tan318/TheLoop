import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String },
    userEmail: { type: String },
    signedUpAt: { type: Date, default: Date.now },
    additionalInfo: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

signupSchema.index({ eventId: 1, userId: 1 }, { unique: true });
export default mongoose.model('Signup', signupSchema);
