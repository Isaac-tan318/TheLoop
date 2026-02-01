import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

reviewSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
