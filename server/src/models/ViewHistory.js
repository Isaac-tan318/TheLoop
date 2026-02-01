import mongoose from 'mongoose';

const viewHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  },
  { timestamps: true }
);

// TTL index to auto delete 6 months after createdAt
viewHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 6 * 30 * 24 * 60 * 60 });

export default mongoose.model('ViewHistory', viewHistorySchema);
