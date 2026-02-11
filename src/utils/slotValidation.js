/**
 * 🎯 SLOT VALIDATION UTILITY - Single Source of Truth
 * 
 * Day-based booking system (NO dates, NO times)
 * - Appointments use: day (monday-saturday) + slotIndex (0, 1, 2, ...)
 * - Sunday is ALWAYS holiday
 * - Slots are numbered, not time-based
 */

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const HOLIDAY_DAY = 'sunday';

/**
 * Validate day of week
 */
export const isValidDay = (day) => {
  if (typeof day !== 'string') return false;
  const normalized = day.toLowerCase().trim();
  return VALID_DAYS.includes(normalized);
};

/**
 * Check if day is Sunday (always holiday)
 */
export const isSunday = (day) => {
  if (typeof day !== 'string') return false;
  return day.toLowerCase().trim() === HOLIDAY_DAY;
};

/**
 * 🔐 CORE VALIDATION - Single source of truth for slot booking
 * Used by: create appointment, reschedule appointment, slot generation
 * 
 * @param {string} doctorId - Doctor's ID
 * @param {string} day - Day of week (monday-saturday)
 * @param {number} slotIndex - Slot number (0-based)
 * @param {Object} models - { DoctorAvailability, Appointment }
 * @returns {Object} { valid: boolean, errorCode?: string, message?: string, availabilityRule?: Object }
 */
export const validateSlot = async (doctorId, day, slotIndex, models) => {
  console.log(`\n🔵 ========== SLOT VALIDATION START ==========`);
  console.log(`📋 Input: doctorId=${doctorId}, day=${day}, slotIndex=${slotIndex}`);

  try {
    const { DoctorAvailability, Appointment } = models;

    // Step 1: Validate day format
    const normalizedDay = day?.toLowerCase().trim();
    if (!normalizedDay) {
      return {
        valid: false,
        errorCode: 'INVALID_DAY',
        message: 'Day is required',
      };
    }

    // Step 2: Check for Sunday
    if (isSunday(normalizedDay)) {
      console.log(`❌ Sunday detected - HOLIDAY`);
      return {
        valid: false,
        errorCode: 'SUNDAY_HOLIDAY',
        message: 'Appointments cannot be booked on Sundays (Hospital Holiday)',
      };
    }

    // Step 3: Validate day is in allowed list
    if (!isValidDay(normalizedDay)) {
      console.log(`❌ Invalid day: ${normalizedDay}`);
      return {
        valid: false,
        errorCode: 'INVALID_DAY',
        message: `Invalid day "${day}". Must be Monday-Saturday.`,
      };
    }

    // Step 4: Validate slotIndex format
    if (typeof slotIndex !== 'number' || slotIndex < 0 || !Number.isInteger(slotIndex)) {
      console.log(`❌ Invalid slotIndex: ${slotIndex}`);
      return {
        valid: false,
        errorCode: 'INVALID_SLOT',
        message: 'Slot index must be a non-negative integer',
      };
    }

    // Step 5: Fetch doctor availability for this day
    const availabilityRule = await DoctorAvailability.findOne({
      doctorId,
      day_of_week: normalizedDay,
    });

    console.log(`📚 Availability Rule:`, availabilityRule ? {
      day: availabilityRule.day_of_week,
      totalSlots: availabilityRule.totalSlots,
    } : 'NOT FOUND');

    if (!availabilityRule) {
      return {
        valid: false,
        errorCode: 'NO_AVAILABILITY',
        message: `Doctor has no availability set for ${normalizedDay}s`,
      };
    }

    // Step 6: Check if slotIndex is within totalSlots
    if (slotIndex >= availabilityRule.totalSlots) {
      console.log(`❌ Slot ${slotIndex} exceeds total slots (${availabilityRule.totalSlots})`);
      return {
        valid: false,
        errorCode: 'INVALID_SLOT',
        message: `Slot ${slotIndex} is invalid. Doctor has ${availabilityRule.totalSlots} slots on ${normalizedDay}s (0-${availabilityRule.totalSlots - 1})`,
      };
    }

    // Step 7: Check if slot is already booked
    const existingBooking = await Appointment.findOne({
      doctorId,
      day: normalizedDay,
      slotIndex,
      status: { $in: ['scheduled', 'confirmed'] },
    });

    if (existingBooking) {
      console.log(`❌ Slot already booked:`, existingBooking._id);
      return {
        valid: false,
        errorCode: 'SLOT_TAKEN',
        message: `Slot ${slotIndex} on ${normalizedDay} is already booked`,
      };
    }

    console.log(`✅ Validation PASSED`);
    console.log(`🔵 ========== SLOT VALIDATION END ==========\n`);

    return {
      valid: true,
      availabilityRule,
    };

  } catch (error) {
    console.error(`❌ VALIDATION ERROR:`, error);
    console.log(`🔵 ========== SLOT VALIDATION END (ERROR) ==========\n`);
    return {
      valid: false,
      errorCode: 'VALIDATION_ERROR',
      message: `Validation failed: ${error.message}`,
    };
  }
};

/**
 * Get slot availability summary for a doctor across all days
 * @param {string} doctorId 
 * @param {Object} models - { DoctorAvailability, Appointment }
 * @returns {Object} { monday: { status, slotsAvailable, totalSlots }, ... }
 */
export const getDoctorSlotStatus = async (doctorId, models) => {
  console.log(`\n🔍 ========== FETCHING SLOT STATUS ==========`);
  console.log(`👨‍⚕️ Doctor ID: ${doctorId}`);

  try {
    const { DoctorAvailability, Appointment } = models;

    // Fetch all availability rules for this doctor
    const availabilityRules = await DoctorAvailability.find({ doctorId });
    console.log(`📚 Found ${availabilityRules.length} availability rules`);

    // Count booked slots per day
    const bookedSlots = await Appointment.aggregate([
      {
        $match: {
          doctorId,
          status: { $in: ['scheduled', 'confirmed'] },
        },
      },
      {
        $group: {
          _id: '$day',
          count: { $sum: 1 },
        },
      },
    ]);

    const bookedMap = {};
    bookedSlots.forEach(({ _id, count }) => {
      bookedMap[_id] = count;
    });

    console.log(`🗓️ Booked slots per day:`, bookedMap);

    // Build response
    const response = {};

    // Add Sunday as always holiday
    response.sunday = {
      status: 'holiday',
      message: 'Hospital Closed',
    };

    // Process each availability rule
    for (const rule of availabilityRules) {
      const day = rule.day_of_week;
      const totalSlots = rule.totalSlots;
      const booked = bookedMap[day] || 0;
      const available = totalSlots - booked;

      if (available <= 0) {
        response[day] = {
          status: 'full',
          slotsAvailable: 0,
          totalSlots,
          message: 'All slots booked',
        };
      } else {
        response[day] = {
          status: 'available',
          slotsAvailable: available,
          totalSlots,
        };
      }
    }

    // Mark days without availability as "not opened"
    VALID_DAYS.forEach(day => {
      if (!response[day]) {
        response[day] = {
          status: 'not_opened',
          message: 'Doctor not available',
        };
      }
    });

    console.log(`✅ Slot status calculated:`, response);
    console.log(`🔍 ========== SLOT STATUS END ==========\n`);

    return response;

  } catch (error) {
    console.error(`❌ Error fetching slot status:`, error);
    throw error;
  }
};

/**
 * Get available slot indices for a specific day
 * @param {string} doctorId 
 * @param {string} day 
 * @param {Object} models 
 * @returns {Array<number>} Array of available slot indices
 */
export const getAvailableSlots = async (doctorId, day, models) => {
  const { DoctorAvailability, Appointment } = models;
  
  const normalizedDay = day?.toLowerCase().trim();
  
  // Check availability rule
  const rule = await DoctorAvailability.findOne({
    doctorId,
    day_of_week: normalizedDay,
  });
  
  if (!rule) return [];
  
  // Get all booked slot indices for this day
  const bookedAppointments = await Appointment.find({
    doctorId,
    day: normalizedDay,
    status: { $in: ['scheduled', 'confirmed'] },
  }).select('slotIndex');
  
  const bookedIndices = new Set(bookedAppointments.map(a => a.slotIndex));
  
  // Generate array of available indices
  const available = [];
  for (let i = 0; i < rule.totalSlots; i++) {
    if (!bookedIndices.has(i)) {
      available.push(i);
    }
  }
  
  return available;
};
