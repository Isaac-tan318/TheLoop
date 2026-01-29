import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }
);

export default mongoose.model('SearchHistory', searchHistorySchema);
