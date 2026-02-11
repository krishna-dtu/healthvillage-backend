import MedicalRecord from '../../models/MedicalRecord.js';
import { User } from '../../models/User.js';

/**
 * Get all medical records for a patient
 */
export const getPatientRecords = async (patientId) => {
  const records = await MedicalRecord.find({ patientId })
    .populate('doctorId', 'name email specialization')
    .sort({ date: -1 })
    .lean();
  
  // Format records for frontend
  return records.map(record => ({
    _id: record._id,
    type: record.type,
    title: record.title,
    description: record.description,
    content: record.content,
    provider: record.provider,
    date: record.date,
    doctorName: record.doctorId?.name,
    metadata: record.metadata,
  }));
};

/**
 * Get medical records for a specific doctor's patients
 */
export const getDoctorPatientRecords = async (doctorId) => {
  const records = await MedicalRecord.find({ doctorId })
    .populate('patientId', 'name email')
    .sort({ date: -1 })
    .lean();
  
  return records.map(record => ({
    _id: record._id,
    type: record.type,
    title: record.title,
    description: record.description,
    content: record.content,
    provider: record.provider,
    date: record.date,
    patientName: record.patientId?.name,
    patientId: record.patientId?._id,
    metadata: record.metadata,
  }));
};

/**
 * Create a new medical record
 */
export const createMedicalRecord = async (data) => {
  const record = await MedicalRecord.create(data);
  return record;
};

/**
 * Get a single medical record by ID
 */
export const getRecordById = async (recordId, userId, userRole) => {
  const record = await MedicalRecord.findById(recordId)
    .populate('doctorId', 'name email specialization')
    .populate('patientId', 'name email')
    .lean();
  
  if (!record) {
    throw new Error('Medical record not found');
  }
  
  // Authorization check
  if (userRole === 'patient' && record.patientId._id.toString() !== userId) {
    throw new Error('Unauthorized access to medical record');
  }
  
  if (userRole === 'doctor' && record.doctorId._id.toString() !== userId) {
    throw new Error('Unauthorized access to medical record');
  }
  
  return record;
};

/**
 * Update a medical record (doctor only)
 */
export const updateMedicalRecord = async (recordId, doctorId, updates) => {
  const record = await MedicalRecord.findOne({ _id: recordId, doctorId });
  
  if (!record) {
    throw new Error('Medical record not found or unauthorized');
  }
  
  Object.assign(record, updates);
  await record.save();
  
  return record;
};

/**
 * Delete a medical record (doctor or admin only)
 */
export const deleteMedicalRecord = async (recordId, userId, userRole) => {
  const query = { _id: recordId };
  
  // If doctor, only allow deleting their own records
  if (userRole === 'doctor') {
    query.doctorId = userId;
  }
  
  const record = await MedicalRecord.findOneAndDelete(query);
  
  if (!record) {
    throw new Error('Medical record not found or unauthorized');
  }
  
  return record;
};
