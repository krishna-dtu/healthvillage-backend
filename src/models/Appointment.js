import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      required: true,
      index: true,
    },
    slotIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
appointmentSchema.index({ patientId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, day: 1 });
appointmentSchema.index({ status: 1, day: 1 });

// CRITICAL: Unique compound index to prevent double booking
// Only one active appointment per doctor per day per slot
appointmentSchema.index(
  { 
    doctorId: 1, 
    day: 1, 
    slotIndex: 1,
    status: 1 
  },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['scheduled', 'confirmed'] } 
    },
    name: 'unique_active_day_slot'
  }
);

export const Appointment = mongoose.model('Appointment', appointmentSchema);
