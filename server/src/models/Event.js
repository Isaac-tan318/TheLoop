import mongoose from 'mongoose';

// Schema for custom signup form fields (additionalFields from frontend)
const additionalFieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'textarea', 'select', ], default: 'text' },
    required: { type: Boolean, default: false },
    options: { type: String }, // Comma-separated options for select
  }
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
    embedding: { type: [Number], select: false }, // stored embedded vector for ai suggestions
  },
  { timestamps: true }
);


export default mongoose.model('Event', eventSchema);
