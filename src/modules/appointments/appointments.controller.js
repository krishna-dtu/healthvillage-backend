import {
  createAppointment,
  getAppointmentsForPatient,
  getAppointmentsForDoctor,
  getAllAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
  getAvailableSlotsGrouped,
  getAvailableSlotsForDay,
  DoctorUnavailableError,
} from './appointments.service.js';

export const createAppointmentHandler = async (req, res) => {
  console.log(`\n📥 ========== API: CREATE APPOINTMENT ==========`);
  console.log(`👤 User: ${req.user.id} (${req.user.role})`);
  console.log(`📝 Request Body:`, req.body);
  
  try {
    const patientId = req.user.id;
    const { doctor_id, day, slotIndex, reason } = req.body;

    const result = await createAppointment({
      patientId,
      doctorId: doctor_id,
      day,
      slotIndex: parseInt(slotIndex),
      reason,
    });

    console.log(`✅ Appointment created: ${result._id}`);
    console.log(`📥 ========== API END (SUCCESS) ==========\n`);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: result,
    });
  } catch (error) {
    console.log(`❌ Error in createAppointmentHandler:`, error.message);
    console.log(`📥 ========== API END (FAILED) ==========\n`);
    
    // Handle doctor unavailability
    if (error instanceof DoctorUnavailableError) {
      return res.status(409).json({
        success: false,
        errorCode: error.errorCode || 'INVALID_SLOT',
        message: error.message,
        details: error.details,
      });
    }

    // Handle other errors
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      errorCode: 'BOOKING_FAILED',
      message: 'Failed to create appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const getPatientAppointmentsHandler = async (req, res) => {
  try {
    const appointments = await getAppointmentsForPatient(req.user.id);
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDoctorAppointmentsHandler = async (req, res) => {
  try {
    const appointments = await getAppointmentsForDoctor(req.user.id);
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* 🔽 STATUS HANDLERS (IMPORTANT) */

export const confirmAppointmentHandler = async (req, res) => {
  try {
    const result = await updateAppointmentStatus(req.params.id, 'confirmed');
    res.json({ 
      success: true,
      message: 'Appointment confirmed',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const completeAppointmentHandler = async (req, res) => {
  try {
    const result = await updateAppointmentStatus(req.params.id, 'completed');
    res.json({ 
      success: true,
      message: 'Appointment marked as completed',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const cancelAppointmentHandler = async (req, res) => {
  try {
    const result = await updateAppointmentStatus(req.params.id, 'cancelled');
    res.json({ 
      success: true,
      message: 'Appointment cancelled',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Get all appointments (ADMIN only)
 */
export const getAllAppointmentsHandler = async (req, res) => {
  try {
    const appointments = await getAllAppointments();
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reschedule appointment (PATIENT)
 */
export const rescheduleAppointmentHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, slotIndex } = req.body;

    const result = await rescheduleAppointment(id, day, parseInt(slotIndex));

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: result,
    });
  } catch (error) {
    // Handle doctor unavailability
    if (error instanceof DoctorUnavailableError) {
      return res.status(409).json({
        success: false,
        errorCode: error.errorCode || 'INVALID_SLOT',
        message: error.message,
        details: error.details,
      });
    }

    // Handle validation errors
    console.error('Reschedule error:', error);
    res.status(400).json({
      success: false,
      errorCode: 'RESCHEDULE_FAILED',
      message: error.message,
    });
  }
};

/**
 * Get available slots for a specific doctor (day-based format)
 */
export const getDoctorAvailableSlotsHandler = async (req, res) => {
  console.log(`\n📊 ========== API: GET AVAILABLE SLOTS ==========`);
  console.log(`👨‍⚕️ Doctor ID: ${req.params.doctorId}`);
  
  try {
    const { doctorId } = req.params;
    
    // Returns { monday: { status, slotsAvailable, totalSlots }, ... }
    const slotStatus = await getAvailableSlotsGrouped(doctorId);
    
    console.log(`✅ Slot status retrieved`);
    console.log(`📊 ========== API END (SUCCESS) ==========\n`);
    
    res.json({
      success: true,
      data: slotStatus,
    });
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    console.log(`📊 ========== API END (FAILED) ==========\n`);
    
    res.status(500).json({
      success: false,
      errorCode: 'AVAILABILITY_FETCH_FAILED',
      message: 'Failed to fetch availability',
      data: {},
    });
  }
};

/**
 * Get available slot indices for a specific day
 */
export const getDoctorDaySlotsHandler = async (req, res) => {
  console.log(`\n🔍 ========== API: GET DAY SLOTS ==========`);
  console.log(`👨‍⚕️ Doctor ID: ${req.params.doctorId}, Day: ${req.params.day}`);
  
  try {
    const { doctorId, day } = req.params;
    
    const availableSlots = await getAvailableSlotsForDay(doctorId, day);
    
    console.log(`✅ Found ${availableSlots.length} available slots`);
    console.log(`🔍 ========== API END (SUCCESS) ==========\n`);
    
    res.json({
      success: true,
      day,
      availableSlots,
      count: availableSlots.length,
    });
  } catch (error) {
    console.error('Error fetching day slots:', error);
    console.log(`🔍 ========== API END (FAILED) ==========\n`);
    
    res.status(500).json({
      success: false,
      errorCode: 'DAY_SLOTS_FETCH_FAILED',
      message: 'Failed to fetch day slots',
      availableSlots: [],
    });
  }
};
