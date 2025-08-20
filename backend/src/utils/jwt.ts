import jwt from 'jsonwebtoken';
import config from '../config/config';
import logger from './logger';

/**
 * Generate access token
 * @param userId User ID
 * @returns JWT access token
 */
export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );
};

/**
 * Generate refresh token
 * @param userId User ID
 * @returns JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    config.jwt.refreshTokenSecret,
    { expiresIn: config.jwt.refreshTokenExpiry }
  );
};

/**
 * Verify access token
 * @param token JWT access token
 * @returns Decoded token payload or null if invalid
 */
export const verifyAccessToken = (token: string): any | null => {
  try {
    return jwt.verify(token, config.jwt.accessTokenSecret);
  } catch (error) {
    logger.error(`Access token verification error: ${error}`);
    return null;
  }
};

/**
 * Verify refresh token
 * @param token JWT refresh token
 * @returns Decoded token payload or null if invalid
 */
export const verifyRefreshToken = (token: string): any | null => {
  try {
    return jwt.verify(token, config.jwt.refreshTokenSecret);
  } catch (error) {
    logger.error(`Refresh token verification error: ${error}`);
    return null;
  }
};

