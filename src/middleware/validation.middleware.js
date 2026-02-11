import Joi from 'joi';

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Joi schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Validation Schemas
 */

// Auth Schemas
export const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 100 characters',
    }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be valid',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  role: Joi.string()
    .valid('patient', 'doctor', 'admin')
    .default('patient')
    .messages({
      'any.only': 'Role must be patient, doctor, or admin',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be valid',
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
    }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be valid',
    }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Reset token is required',
    }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

// Appointment Schemas
export const createAppointmentSchema = Joi.object({
  doctor_id: Joi.string()
    .trim()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .messages({
      'string.empty': 'Doctor ID is required',
      'string.pattern.base': 'Invalid doctor ID format',
    }),
  day: Joi.string()
    .lowercase()
    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')
    .required()
    .messages({
      'any.only': 'Day must be Monday-Saturday (Sunday is a holiday)',
      'any.required': 'Day is required',
    }),
  slotIndex: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Slot index must be a number',
      'number.min': 'Slot index must be 0 or greater',
      'any.required': 'Slot index is required',
    }),
  reason: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Reason for appointment is required',
      'string.min': 'Reason must be at least 5 characters',
      'string.max': 'Reason must not exceed 500 characters',
    }),
});

export const rescheduleAppointmentSchema = Joi.object({
  day: Joi.string()
    .lowercase()
    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')
    .required()
    .messages({
      'any.only': 'Day must be Monday-Saturday (Sunday is a holiday)',
      'any.required': 'Day is required',
    }),
  slotIndex: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Slot index must be a number',
      'number.min': 'Slot index must be 0 or greater',
      'any.required': 'Slot index is required',
    }),
});

// Availability Schemas
export const addAvailabilitySchema = Joi.object({
  day_of_week: Joi.string()
    .lowercase()
    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
    .required()
    .messages({
      'string.empty': 'Day of week is required',
      'any.only': 'Day must be a valid weekday (monday-sunday)',
    }),
  start_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.empty': 'Start time is required',
      'string.pattern.base': 'Invalid time format. Use HH:MM format (e.g., 09:00)',
    }),
  end_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.empty': 'End time is required',
      'string.pattern.base': 'Invalid time format. Use HH:MM format (e.g., 09:00)',
    }),
}).custom((value, helpers) => {
  // Validate start_time < end_time
  if (value.start_time >= value.end_time) {
    return helpers.error('any.invalid', {
      message: 'Start time must be before end time',
    });
  }
  return value;
});

export const updateAvailabilitySchema = Joi.object({
  day_of_week: Joi.string()
    .lowercase()
    .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
    .messages({
      'any.only': 'Day must be a valid weekday (monday-sunday)',
    }),
  start_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      'string.pattern.base': 'Invalid time format. Use HH:MM format (e.g., 09:00)',
    }),
  end_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      'string.pattern.base': 'Invalid time format. Use HH:MM format (e.g., 09:00)',
    }),
})
  .min(1)
  .custom((value, helpers) => {
    // Validate start_time < end_time if both provided
    if (value.start_time && value.end_time && value.start_time >= value.end_time) {
      return helpers.error('any.invalid', {
        message: 'Start time must be before end time',
      });
    }
    return value;
  });

// Query Validation
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100',
    }),
});

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Invalid query parameters',
        details: errors,
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Validate MongoDB ObjectId in params
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ field: paramName, message: `${paramName} is required` }],
      });
    }

    // MongoDB ObjectId validation (24 hex characters)
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ field: paramName, message: `Invalid ${paramName} format` }],
      });
    }

    next();
  };
};
