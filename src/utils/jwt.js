import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required in environment variables');
}
if (!JWT_EXPIRES_IN) {
  throw new Error('JWT_EXPIRES_IN is required in environment variables');
}

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
