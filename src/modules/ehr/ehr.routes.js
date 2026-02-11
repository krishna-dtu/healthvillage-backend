import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import {
  getPatientRecordsHandler,
  getDoctorRecordsHandler,
  createMedicalRecordHandler,
  getRecordByIdHandler,
  updateMedicalRecordHandler,
  deleteMedicalRecordHandler,
} from './ehr.controller.js';

const router = Router();

/**
 * Patient gets their own medical records
 * GET /api/ehr/patient
 */
router.get(
  '/patient',
  authenticate,
  authorize(['patient']),
  getPatientRecordsHandler
);

/**
 * Doctor gets medical records they created
 * GET /api/ehr/doctor
 */
router.get(
  '/doctor',
  authenticate,
  authorize(['doctor']),
  getDoctorRecordsHandler
);

/**
 * Doctor creates a new medical record
 * POST /api/ehr
 */
router.post(
  '/',
  authenticate,
  authorize(['doctor']),
  createMedicalRecordHandler
);

/**
 * Get a specific medical record by ID
 * GET /api/ehr/:id
 */
router.get(
  '/:id',
  authenticate,
  authorize(['patient', 'doctor', 'admin']),
  getRecordByIdHandler
);

/**
 * Update a medical record (doctor only)
 * PUT /api/ehr/:id
 */
router.put(
  '/:id',
  authenticate,
  authorize(['doctor']),
  updateMedicalRecordHandler
);

/**
 * Delete a medical record
 * DELETE /api/ehr/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['doctor', 'admin']),
  deleteMedicalRecordHandler
);

export default router;
