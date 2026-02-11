import { User } from '../../models/User.js';
import bcrypt from 'bcrypt';
import { generateResetToken, hashToken } from '../../utils/encryption.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';

export const register = async ({ name, email, password, role = 'patient' }) => {
  // Check if user already exists
  const existing = await User.findOne({ email });

  if (existing) {
    throw new AppError('User already exists', 409);
  }

  // Hash password with higher cost factor for better security
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create new user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return { id: user._id, name: user.name, email: user.email, role: user.role };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    // Use generic error message to prevent user enumeration
    throw new AppError('Invalid credentials', 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    // Use same generic error message
    throw new AppError('Invalid credentials', 401);
  }

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
};

export const forgotPassword = async ({ email }) => {
  // Find user by email
  const user = await User.findOne({ email });

  // Always return success message to prevent user enumeration
  const successMessage = 'If an account exists with this email, a password reset link has been sent.';

  if (!user) {
    return { message: successMessage };
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const hashedToken = hashToken(resetToken);

  // Set token and expiration (1 hour from now)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  // TODO: Send email with reset link in production
  // const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  // await sendEmail(user.email, 'Password Reset', resetLink);

  // SECURITY: Never expose the token in the response in production
  // For development/testing only, you can log it server-side
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV ONLY] Password reset token for ${email}: ${resetToken}`);
  }

  return { message: successMessage };
};

export const resetPassword = async ({ token, newPassword }) => {
  // Hash the token to compare with stored hash
  const hashedToken = hashToken(token);

  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Hash new password with higher cost factor
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password and clear reset token
  user.password = hashedPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return {
    message: 'Password has been reset successfully',
  };
};
