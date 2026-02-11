import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again after 15 minutes',
    });
  },
});

/**
 * Rate limiter for password reset endpoints
 * Prevents abuse of password reset functionality
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    error: 'Too many password reset attempts',
    message: 'Please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many password reset attempts',
      message: 'Please try again after 1 hour',
    });
  },
});

/**
 * Rate limiter for appointment creation
 * Prevents spam booking
 */
export const appointmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 appointments per hour
  message: {
    error: 'Too many appointment requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many appointment requests',
      message: 'Please try again later',
    });
  },
});

/**
 * General API rate limiter
 * Prevents API abuse
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
    });
  },
});
