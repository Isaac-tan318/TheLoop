import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    role: { type: String, enum: ['student', 'organiser'], required: true },
    interests: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
