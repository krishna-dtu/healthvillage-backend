import {
  addAvailability,
  getAvailabilityByDoctor,
  updateAvailability,
  deleteAvailability,
  getMyAvailability,
} from './availability.service.js';
import { asyncHandler } from '../../middleware/errorHandler.middleware.js';

export const addAvailabilityHandler = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const { day_of_week, start_time, end_time } = req.body;

  const result = await addAvailability({
    doctorId,
    day_of_week,
    start_time,
    end_time,
  });

  res.status(201).json({
    message: 'Availability added successfully',
    availabilityId: result.id,
  });
});

export const getDoctorAvailabilityHandler = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const availability = await getAvailabilityByDoctor(doctorId);
  res.json({ availability });
});

export const getMyAvailabilityHandler = asyncHandler(async (req, res) => {
  const availability = await getMyAvailability(req.user.id);
  res.json({ availability });
});

export const updateAvailabilityHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.id;
  const updates = req.body;

  await updateAvailability(id, doctorId, updates);
  res.json({ message: 'Availability updated successfully' });
});

export const deleteAvailabilityHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.id;

  await deleteAvailability(id, doctorId);
  res.json({ message: 'Availability deleted successfully' });
});

/**
 * Bulk update doctor's weekly schedule
 */
export const bulkUpdateAvailabilityHandler = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const { weeklySchedule } = req.body;

  if (!Array.isArray(weeklySchedule)) {
    return res.status(400).json({ error: 'weeklySchedule must be an array' });
  }

  // Delete all existing availability for this doctor
  const { DoctorAvailability } = await import('../../models/DoctorAvailability.js');
  await DoctorAvailability.deleteMany({ doctorId });

  // Insert new availability slots
  const newSlots = weeklySchedule
    .filter(day => day.enabled && day.slots && day.slots.length > 0)
    .flatMap(day => 
      day.slots.map(slot => ({
        doctorId,
        day_of_week: day.day.toLowerCase(),
        start_time: slot.start,
        end_time: slot.end,
      }))
    );

  if (newSlots.length > 0) {
    await DoctorAvailability.insertMany(newSlots);
  }

  res.json({ 
    message: 'Availability updated successfully',
    slotsCreated: newSlots.length,
  });
});
