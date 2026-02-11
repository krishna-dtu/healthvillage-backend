import { DoctorAvailability } from '../../models/DoctorAvailability.js';
import { User } from '../../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { BUSINESS_RULES } from '../../utils/dateValidation.js';

export const addAvailability = async ({
  doctorId,
  day_of_week,
  start_time,
  end_time,
}) => {
  // 🔴 CRITICAL: Prevent Sunday availability (BUSINESS RULE)
  if (day_of_week === 'sunday') {
    throw new AppError('Doctors cannot set availability for Sundays. This is a business policy.', 400);
  }

  // Validate doctor exists
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    throw new AppError('Invalid doctor ID', 400);
  }

  const id = uuidv4();

  await DoctorAvailability.create({
    _id: id,
    doctorId,
    day_of_week,
    start_time,
    end_time,
  });

  return { id };
};

export const getAvailabilityByDoctor = async (doctorId) => {
  const availabilities = await DoctorAvailability.find({ doctorId }).sort({ day_of_week: 1, start_time: 1 });

  // Return with IDs for update/delete operations
  return availabilities.map((doc) => ({
    _id: doc._id,
    day_of_week: doc.day_of_week,
    start_time: doc.start_time,
    end_time: doc.end_time,
  }));
};

/**
 * Update availability slot
 */
export const updateAvailability = async (
  availabilityId,
  doctorId,
  updates
) => {
  const availability = await DoctorAvailability.findById(availabilityId);

  if (!availability) {
    throw new AppError('Availability slot not found', 404);
  }

  // Verify ownership
  if (availability.doctorId !== doctorId) {
    throw new AppError('You can only update your own availability', 403);
  }

  // 🔴 CRITICAL: Prevent Sunday availability (BUSINESS RULE)
  if (updates.day_of_week && updates.day_of_week === 'sunday') {
    throw new AppError('Doctors cannot set availability for Sundays. This is a business policy.', 400);
  }

  // Update fields
  if (updates.day_of_week) availability.day_of_week = updates.day_of_week;
  if (updates.start_time) availability.start_time = updates.start_time;
  if (updates.end_time) availability.end_time = updates.end_time;

  await availability.save();

  return true;
};

/**
 * Delete availability slot
 */
export const deleteAvailability = async (availabilityId, doctorId) => {
  const availability = await DoctorAvailability.findById(availabilityId);

  if (!availability) {
    throw new AppError('Availability slot not found', 404);
  }

  // Verify ownership
  if (availability.doctorId !== doctorId) {
    throw new AppError('You can only delete your own availability', 403);
  }

  await DoctorAvailability.deleteOne({ _id: availabilityId });

  return true;
};

/**
 * Get availability for current doctor (from token)
 */
export const getMyAvailability = async (doctorId) => {
  return getAvailabilityByDoctor(doctorId);
};
