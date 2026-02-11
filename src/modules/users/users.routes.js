import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validateObjectId, validateQuery, paginationSchema } from '../../middleware/validation.middleware.js';
import {
  getAllUsersHandler,
  getUserByIdHandler,
  getAllDoctorsHandler,
} from './users.controller.js';

const router = Router();

/**
 * Get all doctors (authenticated users - for appointment booking)
 * Must come before /:id to avoid treating "doctors" as an ID
 */
router.get(
  '/doctors/list',
  authenticate,
  getAllDoctorsHandler
);

/**
 * Get all users (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  validateQuery(paginationSchema),
  getAllUsersHandler
);

/**
 * Get user by ID (authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  getUserByIdHandler
);

export default router;
