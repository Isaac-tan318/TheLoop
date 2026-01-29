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
    startDate: { type: Date },
    endDate: { type: Date },
    organiserId: { type: String },
    organiserName: { type: String },
    interests: [{ type: String }],
    capacity: { type: Number },
    signupCount: { type: Number, default: 0 },
    imageUrl: { type: String },
    additionalFields: [additionalFieldSchema],
    createdAt: { type: Date },
    updatedAt: { type: Date },
  }
);
export default mongoose.model('Event', eventSchema);
