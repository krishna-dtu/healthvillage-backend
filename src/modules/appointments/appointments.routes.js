import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import {
  validate,
  validateQuery,
  validateObjectId,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  paginationSchema,
} from '../../middleware/validation.middleware.js';
import { appointmentLimiter } from '../../middleware/rateLimiter.middleware.js';

import {
  createAppointmentHandler,
  getPatientAppointmentsHandler,
  getDoctorAppointmentsHandler,
  confirmAppointmentHandler,
  completeAppointmentHandler,
  cancelAppointmentHandler,
  rescheduleAppointmentHandler,
  getAllAppointmentsHandler,
  getDoctorAvailableSlotsHandler,
  getDoctorDaySlotsHandler,
} from './appointments.controller.js';

const router = Router();

/**
 * Patient creates appointment
 */
router.post(
  '/',
  authenticate,
  authorize(['patient']),
  appointmentLimiter,
  validate(createAppointmentSchema),
  createAppointmentHandler
);

/**
 * Get available slots for a specific doctor (weekly status)
 */
router.get(
  '/slots/:doctorId',
  authenticate,
  validateObjectId('doctorId'),
  getDoctorAvailableSlotsHandler
);

/**
 * Get available slot indices for a specific doctor and day
 */
router.get(
  '/slots/:doctorId/:day',
  authenticate,
  getDoctorDaySlotsHandler
);

/**
 * Patient views own appointments (must come before GET /)
 */
router.get(
  '/patient',
  authenticate,
  authorize(['patient']),
  validateQuery(paginationSchema),
  getPatientAppointmentsHandler
);

/**
 * Doctor views assigned appointments (must come before GET /)
 */
router.get(
  '/doctor',
  authenticate,
  authorize(['doctor']),
  validateQuery(paginationSchema),
  getDoctorAppointmentsHandler
);

/**
 * Get all appointments (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  validateQuery(paginationSchema),
  getAllAppointmentsHandler
);

/**
 * Doctor confirms appointment
 */
router.patch(
  '/:id/confirm',
  authenticate,
  authorize(['doctor']),
  validateObjectId('id'),
  confirmAppointmentHandler
);

/**
 * Doctor completes appointment
 */
router.patch(
  '/:id/complete',
  authenticate,
  authorize(['doctor']),
  validateObjectId('id'),
  completeAppointmentHandler
);

/**
 * Patient or Doctor cancels appointment
 */
router.patch(
  '/:id/cancel',
  authenticate,
  authorize(['patient', 'doctor']),
  validateObjectId('id'),
  cancelAppointmentHandler
);

/**
 * Patient reschedules appointment (supports both PUT and PATCH for frontend compatibility)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['patient']),
  validateObjectId('id'),
  validate(rescheduleAppointmentSchema),
  rescheduleAppointmentHandler
);

router.patch(
  '/:id',
  authenticate,
  authorize(['patient']),
  validateObjectId('id'),
  validate(rescheduleAppointmentSchema),
  rescheduleAppointmentHandler
);

export default router;
