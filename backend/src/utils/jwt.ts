import jwt from 'jsonwebtoken';
import config from '../config/config';

interface TokenPayload {
  userId: string;
  [key: string]: any;
}

/**
 * Generate access token
 * @param payload Token payload
 * @returns Access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiration,
  });
};

/**
 * Generate refresh token
 * @param payload Token payload
 * @returns Refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiration,
  });
};

/**
 * Verify access token
 * @param token Access token
 * @returns Decoded token payload or null if invalid
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 * @param token Refresh token
 * @returns Decoded token payload or null if invalid
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Generate tokens (access and refresh)
 * @param userId User ID
 * @returns Object containing access and refresh tokens
 */
export const generateTokens = (userId: string) => {
  const accessToken = generateAccessToken({ userId });
  const refreshToken = generateRefreshToken({ userId });

  return {
    accessToken,
    refreshToken,
  };
};

