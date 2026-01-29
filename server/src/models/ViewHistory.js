import mongoose from 'mongoose';

const viewHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventTitle: { type: String },
    timestamp: { type: Date, default: Date.now },
  }
);

export default mongoose.model('ViewHistory', viewHistorySchema);
