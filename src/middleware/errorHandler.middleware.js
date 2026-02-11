/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handling middleware
 * Prevents stack traces from leaking to clients
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    const field = Object.keys(err.keyPattern)[0];
    details = [{ field, message: `${field} already exists` }];
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error for debugging (server-side only)
  if (statusCode >= 500) {
    console.error('ERROR:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Send error response (never include stack trace)
  const response = {
    error: message,
  };

  if (details) {
    response.details = details;
  }

  // Only include stack trace in development mode
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
