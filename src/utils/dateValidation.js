/**
 * Centralized Date & Time Validation Utility
 * Ensures consistent date handling across the entire application
 */

/**
 * BUSINESS RULE: NO SUNDAYS
 * Doctors are not available on Sundays - this is a global policy
 */
export const BUSINESS_RULES = {
  NO_SUNDAY_BOOKINGS: true,
  CLOSED_DAYS: ['sunday'],
  BOOKING_WINDOW_DAYS: 14,
};

/**
 * Convert time string to minutes for numeric comparison
 * @param {string} time - Time in HH:mm format
 * @returns {number} - Minutes since midnight
 */
export const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Parse day of week from date string in consistent format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Day name in lowercase (e.g., 'monday', 'tuesday')
 */
export const getDayOfWeek = (dateString) => {
  console.log(`🔍 [getDayOfWeek] Raw Input: ${dateString} (type: ${typeof dateString})`);
  
  // Handle if dateString is already a Date object
  let date;
  if (dateString instanceof Date) {
    date = dateString;
  } else {
    // Ensure clean date string (YYYY-MM-DD format)
    const cleanDateStr = String(dateString).split('T')[0]; // Remove time if present
    console.log(`🔍 [getDayOfWeek] Clean date string: ${cleanDateStr}`);
    
    // Create UTC date to avoid timezone issues
    date = new Date(cleanDateStr + 'T00:00:00.000Z');
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error(`❌ [getDayOfWeek] Invalid date created from: ${dateString}`);
    throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD.`);
  }
  
  const day = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
  
  console.log(`🔍 [getDayOfWeek] Input: ${dateString} → Parsed: ${day} (Date object: ${date.toISOString()})`);
  
  return day;
};

/**
 * Check if a date falls on Sunday
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isSunday = (dateString) => {
  return getDayOfWeek(dateString) === 'sunday';
};

/**
 * Check if a date is in the past
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:mm format
 * @returns {boolean}
 */
export const isPastDateTime = (dateString, timeString) => {
  // Clean date string
  const cleanDateStr = String(dateString).split('T')[0];
  const appointmentDateTime = new Date(`${cleanDateStr}T${timeString}:00.000Z`);
  const now = new Date();
  
  console.log(`🔍 [isPastDateTime] Checking: ${cleanDateStr}T${timeString} vs Now: ${now.toISOString()}`);
  
  return appointmentDateTime < now;
};

/**
 * Validate appointment date and time
 * Centralized validation used by slots generation, booking, and rescheduling
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:mm format
 * @returns {Object} - { valid: boolean, errorCode?: string, message?: string }
 */
export const validateAppointmentDateTime = (dateString, timeString) => {
  // Check if Sunday (GLOBAL BUSINESS RULE)
  if (isSunday(dateString)) {
    return {
      valid: false,
      errorCode: 'SUNDAY_CLOSED',
      message: 'Doctors are not available on Sundays. Please select a weekday.',
    };
  }

  // Check if past
  if (isPastDateTime(dateString, timeString)) {
    return {
      valid: false,
      errorCode: 'PAST_DATETIME',
      message: 'Cannot book appointments in the past.',
    };
  }

  return { valid: true };
};

/**
 * Check if a date/time slot is valid for booking
 * This is the SINGLE SOURCE OF TRUTH used everywhere
 * @param {string} doctorId - Doctor's ID
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:mm format
 * @param {Object} availabilityRule - Doctor's availability rule for that day
 * @returns {boolean}
 */
export const isValidAppointmentSlot = (doctorId, dateString, timeString, availabilityRule) => {
  // First, validate date/time constraints
  const validation = validateAppointmentDateTime(dateString, timeString);
  if (!validation.valid) {
    return false;
  }

  // Then check if doctor has availability rule for that day
  if (!availabilityRule) {
    return false;
  }

  // Check if time falls within availability window (NUMERIC COMPARISON)
  const appointmentMinutes = timeToMinutes(timeString);
  const startMinutes = timeToMinutes(availabilityRule.start_time);
  const endMinutes = timeToMinutes(availabilityRule.end_time);
  
  const isValid = appointmentMinutes >= startMinutes && appointmentMinutes < endMinutes;
  
  console.log(`🔍 [isValidAppointmentSlot] Time Check:`, {
    time: timeString,
    timeMinutes: appointmentMinutes,
    rangeStart: availabilityRule.start_time,
    rangeStartMinutes: startMinutes,
    rangeEnd: availabilityRule.end_time,
    rangeEndMinutes: endMinutes,
    isValid,
  });
  
  return isValid;
};

/**
 * 🔴 SINGLE SOURCE OF TRUTH: Validate doctor slot for booking
 * This function is used by:
 * - Slot generation endpoint
 * - Create appointment
 * - Reschedule appointment
 * 
 * @param {string} doctorId - Doctor's ID
 * @param {string} dateString - Date in YYYY-MM-DD format  
 * @param {string} timeString - Time in HH:mm format
 * @param {Object} DoctorAvailability - Mongoose model
 * @returns {Promise<Object>} - { valid: boolean, errorCode?: string, message?: string, availabilityRule?: Object }
 */
export const validateDoctorSlot = async (doctorId, dateString, timeString, DoctorAvailability) => {
  console.log(`\n🔵 ========== SLOT VALIDATION START ==========`);
  console.log(`📅 Input: doctorId=${doctorId}, date=${dateString}, time=${timeString}`);
  
  try {
    // Step 1: Basic date/time validation (Sunday, past, etc.)
    const basicValidation = validateAppointmentDateTime(dateString, timeString);
    console.log(`✅ Basic Validation:`, basicValidation);
    
    if (!basicValidation.valid) {
      console.log(`❌ Validation FAILED:`, basicValidation);
      console.log(`🔵 ========== SLOT VALIDATION END ==========\n`);
      return basicValidation;
    }
    
    // Step 2: Parse day of week (with logging and error handling)
    const dayOfWeek = getDayOfWeek(dateString);
    console.log(`📆 Day of Week: ${dayOfWeek}`);
    
    // Safety check: ensure dayOfWeek is valid
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(dayOfWeek)) {
      console.error(`❌ Invalid day parsed: ${dayOfWeek}`);
      return {
        valid: false,
        errorCode: 'INVALID_DATE',
        message: `Invalid date format received: ${dateString}. Please use YYYY-MM-DD format.`,
      };
    }
    
    // Step 3: Fetch doctor's availability rule for this day
    const availabilityRule = await DoctorAvailability.findOne({
      doctorId,
      day_of_week: dayOfWeek,
    });
    
    console.log(`📖 Availability Rule:`, availabilityRule ? {
      day: availabilityRule.day_of_week,
      start: availabilityRule.start_time,
      end: availabilityRule.end_time,
    } : 'NOT FOUND');
    
    if (!availabilityRule) {
      const result = {
        valid: false,
        errorCode: 'NO_AVAILABILITY',
        message: `Doctor has no availability set for ${dayOfWeek}s.`,
      };
      console.log(`❌ No availability rule found for ${dayOfWeek}`);
      console.log(`🔵 ========== SLOT VALIDATION END ==========\n`);
      return result;
    }
    
    // Step 4: Numeric time comparison
    const appointmentMinutes = timeToMinutes(timeString);
    const startMinutes = timeToMinutes(availabilityRule.start_time);
    const endMinutes = timeToMinutes(availabilityRule.end_time);
    
    console.log(`⏰ Time Comparison (NUMERIC):`);
    console.log(`  - Requested: ${timeString} = ${appointmentMinutes} minutes`);
    console.log(`  - Range: ${availabilityRule.start_time} (${startMinutes}) to ${availabilityRule.end_time} (${endMinutes})`);
    console.log(`  - Valid?: ${appointmentMinutes} >= ${startMinutes} && ${appointmentMinutes} < ${endMinutes}`);
    
    const isInRange = appointmentMinutes >= startMinutes && appointmentMinutes < endMinutes;
    
    if (!isInRange) {
      const result = {
        valid: false,
        errorCode: 'OUTSIDE_HOURS',
        message: `Selected time ${timeString} is outside doctor's available hours (${availabilityRule.start_time} - ${availabilityRule.end_time}).`,
      };
      console.log(`❌ Time OUTSIDE range`);
      console.log(`🔵 ========== SLOT VALIDATION END ==========\n`);
      return result;
    }
    
    const result = { valid: true, availabilityRule };
    console.log(`✅ Validation PASSED`);
    console.log(`🔵 ========== SLOT VALIDATION END ==========\n`);
    return result;
    
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
 * Format date string safely
 * @param {Date} date
 * @returns {string} - YYYY-MM-DD format
 */
export const formatDateString = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  if (isNaN(date.getTime())) {
    console.error(`❌ [formatDateString] Invalid date:`, date);
    throw new Error('Invalid date object');
  }
  
  const formatted = date.toISOString().split('T')[0];
  console.log(`🔍 [formatDateString] ${date} → ${formatted}`);
  return formatted;
};

/**
 * Generate hourly time slots between start and end time
 * @param {string} startTime - HH:mm format
 * @param {string} endTime - HH:mm format
 * @returns {string[]} - Array of time strings in HH:mm format
 */
export const generateTimeSlots = (startTime, endTime) => {
  const slots = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Generate hourly slots
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }

  console.log(`🔍 [generateTimeSlots] ${startTime} → ${endTime} = [${slots.join(', ')}]`);

  return slots;
};
