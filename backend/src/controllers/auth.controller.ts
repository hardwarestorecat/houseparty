import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import OTP from '../models/OTP';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { generateOTP, sendOTPEmail } from '../utils/email';
import logger from '../utils/logger';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use',
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken',
        });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({
          success: false,
          error: 'Phone number already in use',
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      phone,
      password: hashedPassword,
    });

    // Generate OTP for email verification
    const otpCode = generateOTP();
    
    // Save OTP to database
    await OTP.create({
      email,
      otp: otpCode,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP email
    await sendOTPEmail(email, otpCode);

    // Return user data (without password)
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      user: userData,
    });
  } catch (error: any) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during registration',
    });
  }
};

/**
 * Verify email with OTP
 * @route POST /api/auth/verify-email
 * @access Public
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'email_verification',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
      });
    }

    // Update user's email verification status
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Return user data and tokens
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error(`Email verification error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during email verification',
    });
  }
};

/**
 * Resend verification OTP
 * @route POST /api/auth/resend-otp
 * @access Public
 */
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email, type = 'email_verification' } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // For email verification, check if already verified
    if (type === 'email_verification' && user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified',
      });
    }

    // Delete any existing OTPs for this email and type
    await OTP.deleteMany({ email, type });

    // Generate new OTP
    const otpCode = generateOTP();
    
    // Save OTP to database
    await OTP.create({
      email,
      otp: otpCode,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP email
    await sendOTPEmail(email, otpCode);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error: any) {
    logger.error(`Resend OTP error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while sending OTP',
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Return user data and tokens
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Return user data
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    logger.error(`Get current user error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user data',
    });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Verify refresh token and get user ID
    const userId = await verifyRefreshToken(token);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }

    // Generate new tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error(`Refresh token error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while refreshing token',
    });
  }
};

/**
 * Verify refresh token and return user ID
 * @param token Refresh token
 * @returns User ID or null if invalid
 */
const verifyRefreshToken = async (token: string): Promise<string | null> => {
  try {
    // This function should be implemented in jwt.ts
    // For now, we'll just return null
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Delete any existing password reset OTPs
    await OTP.deleteMany({ email, type: 'password_reset' });

    // Generate OTP
    const otpCode = generateOTP();
    
    // Save OTP to database
    await OTP.create({
      email,
      otp: otpCode,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP email
    // TODO: Create a separate email template for password reset
    await sendOTPEmail(email, otpCode);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent successfully',
    });
  } catch (error: any) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during password reset request',
    });
  }
};

/**
 * Reset password with OTP
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: 'password_reset',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    logger.error(`Reset password error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during password reset',
    });
  }
};

/**
 * Change password (when logged in)
 * @route POST /api/auth/change-password
 * @access Private
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    logger.error(`Change password error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during password change',
    });
  }
};

