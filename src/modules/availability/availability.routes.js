import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import {
  validate,
  validateObjectId,
  addAvailabilitySchema,
  updateAvailabilitySchema,
} from '../../middleware/validation.middleware.js';

import {
  addAvailabilityHandler,
  getDoctorAvailabilityHandler,
  getMyAvailabilityHandler,
  updateAvailabilityHandler,
  deleteAvailabilityHandler,
  bulkUpdateAvailabilityHandler,
} from './availability.controller.js';

const router = Router();

/**
 * Doctor adds availability
 */
router.post(
  '/',
  authenticate,
  authorize(['doctor']),
  validate(addAvailabilitySchema),
  addAvailabilityHandler
);

/**
 * Doctor bulk updates weekly schedule
 */
router.put(
  '/doctor',
  authenticate,
  authorize(['doctor']),
  bulkUpdateAvailabilityHandler
);

/**
 * Doctor gets their own availability
 */
router.get(
  '/me',
  authenticate,
  authorize(['doctor']),
  getMyAvailabilityHandler
);

/**
 * Anyone views doctor availability by ID
 */
router.get(
  '/:doctorId',
  authenticate,
  validateObjectId('doctorId'),
  getDoctorAvailabilityHandler
);

/**
 * Doctor updates availability slot
 */
router.patch(
  '/:id',
  authenticate,
  authorize(['doctor']),
  validateObjectId('id'),
  validate(updateAvailabilitySchema),
  updateAvailabilityHandler
);

/**
 * Doctor deletes availability slot
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['doctor']),
  validateObjectId('id'),
  deleteAvailabilityHandler
);

export default router;
