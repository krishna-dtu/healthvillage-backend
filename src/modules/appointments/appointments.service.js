/**
 * 🎯 APPOINTMENT SERVICE - Day-Based Booking System
 * 
 * NO DATES - Only days of week (Monday-Saturday) + slot indices
 * Sunday is ALWAYS holiday
 * 
 * Single source of truth: slotValidation.js
 */

import { Appointment } from '../../models/Appointment.js';
import { DoctorAvailability } from '../../models/DoctorAvailability.js';
import { User } from '../../models/User.js';
import {
  validateSlot,
  getDoctorSlotStatus,
  getAvailableSlots as getAvailableSlotsUtil,
} from '../../utils/slotValidation.js';

/**
 * Custom error class for doctor unavailability
 */
export class DoctorUnavailableError extends Error {
  constructor(message, errorCode = 'INVALID_SLOT', details = {}) {
    super(message);
    this.name = 'DoctorUnavailableError';
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * Get doctor slot status (weekly availability summary)
 * @param {string} doctorId 
 * @returns {Object} { monday: { status, slotsAvailable, totalSlots }, ... }
 */
export const getAvailableSlots = async (doctorId) => {
  console.log(`\n📊 Fetching slot status for doctor ${doctorId}`);
  
  const models = { DoctorAvailability, Appointment };
  const slotStatus = await getDoctorSlotStatus(doctorId, models);
  
  return slotStatus;
};

/**
 * Get available slot indices for a specific day
 * @param {string} doctorId 
 * @param {string} day 
 * @returns {Array<number>} Available slot indices
 */
export const getAvailableSlotsForDay = async (doctorId, day) => {
  console.log(`\n🔍 Fetching available slots for ${doctorId} on ${day}`);
  
  const models = { DoctorAvailability, Appointment };
  const slots = await getAvailableSlotsUtil(doctorId, day, models);
  
  console.log(`✅ Found ${slots.length} available slots`);
  return slots;
};

/**
 * Alias for getAvailableSlots (backward compatibility)
 */
export const getAvailableSlotsGrouped = async (doctorId) => {
  return getAvailableSlots(doctorId);
};

/**
 * Create new appointment (day-based)
 * @param {Object} appointmentData 
 * @returns {Promise<Object>} Created appointment with doctor details
 */
export const createAppointment = async (appointmentData) => {
  console.log(`\n🆕 ========== CREATE APPOINTMENT ==========`);
  console.log(`📝 Input:`, appointmentData);

  const { patientId, doctorId, day, slotIndex, reason } = appointmentData;

  // Validate slot using single source of truth
  const models = { DoctorAvailability, Appointment };
  const validation = await validateSlot(doctorId, day, slotIndex, models);

  if (!validation.valid) {
    console.log(`❌ Validation FAILED:`, validation);
    throw new DoctorUnavailableError(
      validation.message,
      validation.errorCode,
      { day, slotIndex }
    );
  }

  console.log(`✅ Validation PASSED - Creating appointment`);

  // Create appointment (let MongoDB generate _id)
  const appointment = new Appointment({
    patientId,
    doctorId,
    day: day.toLowerCase().trim(),
    slotIndex,
    reason,
    status: 'scheduled',
  });

  await appointment.save();
  console.log(`💾 Appointment created:`, appointment._id);

  // Fetch doctor details for response
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' })
    .select('name');

  const response = {
    ...appointment.toObject(),
    doctorName: doctor ? doctor.name : 'Unknown',
    specialization: 'General', // User model doesn't have specialization
  };

  console.log(`🎯 Created appointment:`, response);
  console.log(`🆕 ========== CREATE END ==========\n`);

  return response;
};

/**
 * Get all appointments for a patient
 * @param {string} patientId 
 * @returns {Promise<Array>} Appointments with doctor details
 */
export const getAppointmentsForPatient = async (patientId) => {
  console.log(`\n📋 Fetching appointments for patient ${patientId}`);

  const appointments = await Appointment.find({ patientId })
    .sort({ createdAt: -1 });

  // Enrich with doctor details
  const enriched = await Promise.all(
    appointments.map(async (apt) => {
      const doctor = await User.findOne({ _id: apt.doctorId, role: 'doctor' })
        .select('name');

      return {
        ...apt.toObject(),
        doctorName: doctor ? doctor.name : 'Unknown',
        specialization: 'General',
      };
    })
  );

  console.log(`✅ Found ${enriched.length} appointments`);
  return enriched;
};

/**
 * Get all appointments for a doctor
 * @param {string} doctorId 
 * @returns {Promise<Array>} Appointments with patient details
 */
export const getAppointmentsForDoctor = async (doctorId) => {
  console.log(`\n📋 Fetching appointments for doctor ${doctorId}`);

  const appointments = await Appointment.find({ doctorId })
    .sort({ day: 1, slotIndex: 1 });

  // Enrich with patient details
  const enriched = await Promise.all(
    appointments.map(async (apt) => {
      const patient = await User.findOne({ _id: apt.patientId, role: 'patient' })
        .select('name');

      return {
        ...apt.toObject(),
        patientName: patient ? patient.name : 'Unknown',
        patientContact: 'N/A', // User model doesn't have contact_number
      };
    })
  );

  console.log(`✅ Found ${enriched.length} appointments`);
  return enriched;
};

/**
 * Get all appointments (admin)
 * @returns {Promise<Array>} All appointments with details
 */
export const getAllAppointments = async () => {
  console.log(`\n📋 Fetching all appointments (admin)`);

  const appointments = await Appointment.find()
    .sort({ createdAt: -1 });

  // Enrich with doctor and patient details
  const enriched = await Promise.all(
    appointments.map(async (apt) => {
      const [doctor, patient] = await Promise.all([
        User.findOne({ _id: apt.doctorId, role: 'doctor' })
          .select('name'),
        User.findOne({ _id: apt.patientId, role: 'patient' })
          .select('name'),
      ]);

      return {
        ...apt.toObject(),
        doctorName: doctor ? doctor.name : 'Unknown',
        specialization: 'General',
        patientName: patient ? patient.name : 'Unknown',
      };
    })
  );

  console.log(`✅ Found ${enriched.length} appointments`);
  return enriched;
};

/**
 * Reschedule appointment to new day/slot
 * @param {string} appointmentId 
 * @param {string} newDay 
 * @param {number} newSlotIndex 
 * @returns {Promise<Object>} Updated appointment
 */
export const rescheduleAppointment = async (appointmentId, newDay, newSlotIndex) => {
  console.log(`\n🔄 ========== RESCHEDULE APPOINTMENT ==========`);
  console.log(`📝 ID: ${appointmentId}, New: ${newDay} slot ${newSlotIndex}`);

  // Find existing appointment
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Cannot reschedule cancelled appointments
  if (appointment.status === 'cancelled') {
    throw new Error('Cannot reschedule cancelled appointment');
  }

  console.log(`📋 Current: ${appointment.day} slot ${appointment.slotIndex}`);

  // If same slot, no change needed
  if (appointment.day === newDay.toLowerCase().trim() && appointment.slotIndex === newSlotIndex) {
    console.log(`ℹ️ Same slot - no change needed`);
    
    // Still return enriched appointment
    const doctor = await User.findOne({ _id: appointment.doctorId, role: 'doctor' })
      .select('name');
    
    return {
      ...appointment.toObject(),
      doctorName: doctor ? doctor.name : 'Unknown',
      specialization: 'General',
    };
  }

  // Validate new slot using single source of truth
  const models = { DoctorAvailability, Appointment };
  const validation = await validateSlot(
    appointment.doctorId,
    newDay,
    newSlotIndex,
    models
  );

  if (!validation.valid) {
    console.log(`❌ Validation FAILED:`, validation);
    throw new DoctorUnavailableError(
      validation.message,
      validation.errorCode,
      { day: newDay, slotIndex: newSlotIndex }
    );
  }

  console.log(`✅ New slot is valid - Rescheduling`);

  // Update appointment
  appointment.day = newDay.toLowerCase().trim();
  appointment.slotIndex = newSlotIndex;
  appointment.status = 'scheduled'; // Reset to scheduled
  await appointment.save();

  console.log(`💾 Appointment rescheduled`);
  console.log(`🔄 ========== RESCHEDULE END ==========\n`);

  // Return enriched appointment
  const doctor = await User.findOne({ _id: appointment.doctorId, role: 'doctor' })
    .select('name');
  
  return {
    ...appointment.toObject(),
    doctorName: doctor ? doctor.name : 'Unknown',
    specialization: 'General',
  };
};

/**
 * Update appointment status
 * @param {string} appointmentId 
 * @param {string} status 
 * @returns {Promise<Object>} Updated appointment
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  console.log(`\n🔄 Updating appointment ${appointmentId} status to ${status}`);

  const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  appointment.status = status;
  await appointment.save();

  console.log(`✅ Status updated to ${status}`);
  
  // Return enriched appointment
  const [doctor, patient] = await Promise.all([
    User.findOne({ _id: appointment.doctorId, role: 'doctor' })
      .select('name'),
    User.findOne({ _id: appointment.patientId, role: 'patient' })
      .select('name'),
  ]);
  
  return {
    ...appointment.toObject(),
    doctorName: doctor ? doctor.name : 'Unknown',
    specialization: 'General',
    patientName: patient ? patient.name : 'Unknown',
  };
};
