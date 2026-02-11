import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    type: {
      type: String,
      required: true,
      enum: ['Lab Results', 'Prescription', 'Visit Summary', 'Imaging'],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String,
    },
    provider: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    metadata: {
      fileUrl: String,
      fileType: String,
      fileSize: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
medicalRecordSchema.index({ patientId: 1, type: 1 });
medicalRecordSchema.index({ patientId: 1, date: -1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
