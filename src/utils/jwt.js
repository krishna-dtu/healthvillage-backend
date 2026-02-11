import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const JWT_EXPIRES_IN = '1d';

/**
 * Generate JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
