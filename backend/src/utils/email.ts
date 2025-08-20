import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

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
 * Send email
 * @param options Email options
 * @returns Promise resolving to send info
 */
export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error}`);
    throw error;
  }
};

/**
 * Generate OTP code
 * @param length OTP length (default: 6)
 * @returns OTP code
 */
export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

/**
 * Send OTP email
 * @param email Recipient email
 * @param otp OTP code
 * @returns Promise resolving to send info
 */
export const sendOTPEmail = async (email: string, otp: string) => {
  const subject = 'House Party - Email Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">House Party Email Verification</h2>
      <p>Your verification code is:</p>
      <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <p>Thanks,<br>The House Party Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
};

