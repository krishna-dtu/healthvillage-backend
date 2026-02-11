import crypto from 'crypto';

/**
 * Generate a secure random token for password reset
 * @returns {string} A random hex token
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for secure storage
 * @param {string} token - The token to hash
 * @returns {string} Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
