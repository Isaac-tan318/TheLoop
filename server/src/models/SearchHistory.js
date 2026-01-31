import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true },
  },
  { timestamps: true }
);

// TTL index to auto delete 30 days after createdAt
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('SearchHistory', searchHistorySchema);
