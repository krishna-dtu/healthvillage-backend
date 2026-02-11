import mongoose from 'mongoose';

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    day_of_week: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      required: true,
    },
    start_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
    totalSlots: {
      type: Number,
      required: true,
      min: 1,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one availability rule per doctor per day
doctorAvailabilitySchema.index(
  { doctorId: 1, day_of_week: 1 },
  { unique: true }
);

export const DoctorAvailability = mongoose.model(
  'DoctorAvailability',
  doctorAvailabilitySchema
);
