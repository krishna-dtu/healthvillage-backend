import { getAllUsers, getUserById, getAllDoctors } from './users.service.js';
import { asyncHandler } from '../../middleware/errorHandler.middleware.js';

/**
 * Get all users (admin only)
 */
export const getAllUsersHandler = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await getAllUsers(page, limit);
  res.json(result);
});

/**
 * Get user by ID
 */
export const getUserByIdHandler = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  res.json(user);
});

/**
 * Get all doctors
 */
export const getAllDoctorsHandler = asyncHandler(async (req, res) => {
  const doctors = await getAllDoctors();
  res.json(doctors);
});
