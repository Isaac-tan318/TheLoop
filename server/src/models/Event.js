import mongoose from 'mongoose';

// Schema for custom signup form fields (additionalFields from frontend)
const additionalFieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'textarea', 'select',], default: 'text' },
    required: { type: Boolean, default: false },
    options: { type: String }, // Comma-separated options for select
  }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    startDate: {
      type: Date,
      index: true,
      required: true,
      validate: {
        validator: function (value) {
          // Only validate if endDate is set
          if (this.endDate) {
            return value < this.endDate;
          }
          return true;
        },
        message: 'Start date must be before end date',
      },
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          // Only validate if  startDate is set
          if (this.startDate) {
            return value > this.startDate;
          }
          return true;
        },
        message: 'End date must be after start date',
      },
    },
    organiserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    interests: [{ type: String }],
    capacity: { type: Number },
    signupCount: { type: Number, default: 0 },
    signupsOpen: { type: Boolean, default: true },
    imageUrl: { type: String },
    additionalFields: [additionalFieldSchema],
    embedding: { type: [Number], select: false }, // stored embedded vector for ai suggestions
  },
  { timestamps: true }
);

// Pre-save hook to validate date ordering on updates
eventSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    if (this.startDate >= this.endDate) {
      const error = new Error('Start date must be before end date');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Pre-hook for findOneAndUpdate operations
eventSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const startDate = update.startDate || update.$set?.startDate;
  const endDate = update.endDate || update.$set?.endDate;

  // If both dates are being updated, validate them
  if (startDate && endDate) {
    if (new Date(startDate) >= new Date(endDate)) {
      const error = new Error('Start date must be before end date');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Event', eventSchema);
