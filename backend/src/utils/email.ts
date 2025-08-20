import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from './logger';

/**
 * Create email transporter
 * @returns Nodemailer transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

/**
 * Generate a random 6-digit OTP
 * @returns 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email
 * @param email Recipient email
 * @param otp OTP code
 * @returns Promise<boolean> Success status
 */
export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  try {
    // Check if email configuration is available
    if (!config.email.user || !config.email.password) {
      logger.warn('Email service not configured. OTP would have been sent to:', email);
      logger.info(`OTP for ${email}: ${otp}`);
      return true; // Return true for development purposes
    }

    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'House Party - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #6200ee; text-align: center;">House Party</h2>
          <h3 style="text-align: center;">Email Verification Code</h3>
          <p>Hello,</p>
          <p>Thank you for registering with House Party! To complete your registration, please use the following verification code:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>The House Party Team</p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error: any) {
    logger.error(`Send OTP email error: ${error.message}`);
    
    // Log OTP for development purposes
    logger.info(`OTP for ${email}: ${otp}`);
    
    return false;
  }
};

/**
 * Send password reset email
 * @param email Recipient email
 * @param otp OTP code
 * @returns Promise<boolean> Success status
 */
export const sendPasswordResetEmail = async (email: string, otp: string): Promise<boolean> => {
  try {
    // Check if email configuration is available
    if (!config.email.user || !config.email.password) {
      logger.warn('Email service not configured. Password reset OTP would have been sent to:', email);
      logger.info(`Password reset OTP for ${email}: ${otp}`);
      return true; // Return true for development purposes
    }

    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'House Party - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #6200ee; text-align: center;">House Party</h2>
          <h3 style="text-align: center;">Password Reset Code</h3>
          <p>Hello,</p>
          <p>We received a request to reset your password. Please use the following code to reset your password:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>The House Party Team</p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error: any) {
    logger.error(`Send password reset email error: ${error.message}`);
    
    // Log OTP for development purposes
    logger.info(`Password reset OTP for ${email}: ${otp}`);
    
    return false;
  }
};

/**
 * Send invitation email
 * @param email Recipient email
 * @param senderName Sender's name
 * @param partyName Party name
 * @param invitationLink Invitation link
 * @returns Promise<boolean> Success status
 */
export const sendInvitationEmail = async (
  email: string,
  senderName: string,
  partyName: string,
  invitationLink: string
): Promise<boolean> => {
  try {
    // Check if email configuration is available
    if (!config.email.user || !config.email.password) {
      logger.warn('Email service not configured. Invitation would have been sent to:', email);
      return true; // Return true for development purposes
    }

    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `House Party - ${senderName} invited you to a party!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #6200ee; text-align: center;">House Party</h2>
          <h3 style="text-align: center;">You're Invited!</h3>
          <p>Hello,</p>
          <p><strong>${senderName}</strong> has invited you to join <strong>${partyName}</strong> on House Party!</p>
          <p>Click the button below to join the party:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" style="background-color: #6200ee; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Join the Party
            </a>
          </div>
          <p>If you don't have the House Party app yet, you can download it from the App Store or Google Play Store.</p>
          <p>Best regards,<br>The House Party Team</p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error: any) {
    logger.error(`Send invitation email error: ${error.message}`);
    return false;
  }
};

