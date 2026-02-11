import { User } from '../../models/User.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';

/**
 * Get all users (admin only) with pagination
 */
export const getAllUsers = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({}, '-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({}),
  ]);

  return {
    users: users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId, '-password -resetPasswordToken -resetPasswordExpires').lean();
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Get all doctors
 */
export const getAllDoctors = async () => {
  const doctors = await User.find(
    { role: 'doctor' },
    '-password -resetPasswordToken -resetPasswordExpires'
  )
    .sort({ name: 1 })
    .lean();
  
  return doctors.map(doctor => ({
    _id: doctor._id,
    name: doctor.name,
    email: doctor.email,
    role: doctor.role,
  }));
};
