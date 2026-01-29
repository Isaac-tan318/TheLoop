import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['student', 'organiser'], required: true },
    interests: [{ type: String }],
    eventsSignedUp: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    createdAt: { type: Date },
  }
);
export default mongoose.model('User', userSchema);
