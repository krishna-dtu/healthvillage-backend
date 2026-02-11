import { register, login, forgotPassword, resetPassword } from './auth.service.js';
import { generateToken } from '../../utils/jwt.js';
import { asyncHandler } from '../../middleware/errorHandler.middleware.js';

/**
 * Controller layer
 * Handles HTTP request/response only
 */

export const registerUser = asyncHandler(async (req, res) => {
  const result = await register(req.body);

  res.status(201).json({
    message: 'User registered successfully',
    data: result,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const user = await login(req.body);

  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  res.status(200).json({
    message: 'User login successful',
    token,
    user,
  });
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body);
  res.status(200).json(result);
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);
  res.status(200).json(result);
});
