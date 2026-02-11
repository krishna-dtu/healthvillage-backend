import {
  getPatientRecords,
  getDoctorPatientRecords,
  createMedicalRecord,
  getRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
} from './ehr.service.js';

/**
 * Get medical records for the authenticated patient
 */
export const getPatientRecordsHandler = async (req, res) => {
  try {
    const records = await getPatientRecords(req.user.id);
    
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get medical records created by the authenticated doctor
 */
export const getDoctorRecordsHandler = async (req, res) => {
  try {
    const records = await getDoctorPatientRecords(req.user.id);
    
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching doctor records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Create a new medical record (doctor only)
 */
export const createMedicalRecordHandler = async (req, res) => {
  try {
    const { patientId, type, title, description, content, provider, appointmentId, metadata } = req.body;
    
    const record = await createMedicalRecord({
      patientId,
      doctorId: req.user.id,
      type,
      title,
      description,
      content,
      provider,
      appointmentId,
      metadata,
    });
    
    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: record,
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medical record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get a specific medical record by ID
 */
export const getRecordByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await getRecordById(id, req.user.id, req.user.role);
    
    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('Unauthorized') ? 403 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update a medical record (doctor only)
 */
export const updateMedicalRecordHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const record = await updateMedicalRecord(id, req.user.id, updates);
    
    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: record,
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    
    const statusCode = error.message.includes('not found') || error.message.includes('unauthorized') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete a medical record
 */
export const deleteMedicalRecordHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteMedicalRecord(id, req.user.id, req.user.role);
    
    res.json({
      success: true,
      message: 'Medical record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    
    const statusCode = error.message.includes('not found') || error.message.includes('unauthorized') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
