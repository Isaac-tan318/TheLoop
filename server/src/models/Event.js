import mongoose from 'mongoose';

// Schema for custom signup form fields (additionalFields from frontend)
const additionalFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'email', 'tel', 'number', 'textarea', 'select', 'checkbox', 'radio'], default: 'text' },
    required: { type: Boolean, default: false },
    options: { type: String }, // Comma-separated options for select/radio
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    startDate: { type: Date, index: true },
    endDate: { type: Date },
    organiserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    interests: [{ type: String, index: true }],
    capacity: { type: Number },
    signupCount: { type: Number, default: 0 },
    signupsOpen: { type: Boolean, default: true },
    imageUrl: { type: String },
    additionalFields: [additionalFieldSchema],
    embedding: { type: [Number], select: false }, // Pre-computed embedding vector for AI suggestions
  },
  { timestamps: true }
);

// Compound index for optimizing recommendation queries
eventSchema.index({ interests: 1, startDate: 1 });

export default mongoose.model('Event', eventSchema);
