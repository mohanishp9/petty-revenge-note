import nodemailer from 'nodemailer';
import dns from 'node:dns';

// Force Node.js to resolve IPv4 addresses first. 
// Fixes ENETUNREACH errors on Render/Alpine Linux where IPv6 is not properly routed.
dns.setDefaultResultOrder('ipv4first');

// Types
export type OtpEmailType = 'REGISTER' | 'PASSWORD_RESET' | 'EMAIL_CHANGE';

interface EmailTemplate {
  subject: string;
  html: string;
}

// Template Builder

const buildEmailTemplate = (otp: string, type: OtpEmailType): EmailTemplate => {
  const templates: Record<OtpEmailType, EmailTemplate> = {
    REGISTER: {
      subject: 'Verify your email – Petty Revenge Notes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827;">Confirm your registration</h2>
          <p style="color: #374151;">Use the OTP below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; padding: 16px 0;">${otp}</div>
          <p style="color: #6b7280; font-size: 13px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    },
    PASSWORD_RESET: {
      subject: 'Reset your password – Petty Revenge Notes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827;">Reset your password</h2>
          <p style="color: #374151;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; padding: 16px 0;">${otp}</div>
          <p style="color: #6b7280; font-size: 13px;">If you didn't request this, secure your account immediately.</p>
        </div>
      `,
    },
    EMAIL_CHANGE: {
      subject: 'Confirm email change – Petty Revenge Notes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827;">Confirm your new email</h2>
          <p style="color: #374151;">Use the OTP below to confirm your email change. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; padding: 16px 0;">${otp}</div>
          <p style="color: #6b7280; font-size: 13px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    },
  };

  return templates[type];
};

// Transporter Factory
// Create a fresh transporter each call — OAuth2 access tokens expire,
// so re-creating forces nodemailer to fetch a fresh token every time.

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4, // forces IPv4, bypassing all OS/Render IPv6 bugs
    auth: {
      type: 'OAuth2',
      user: process.env.GOOGLE_EMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  } as any);
};

// Core Send Function (single attempt)

const trySendEmail = async (toEmail: string, template: EmailTemplate): Promise<void> => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Petty Revenge Notes" <${process.env.GOOGLE_EMAIL_USER}>`,
    to: toEmail,
    subject: template.subject,
    html: template.html,
  });
};

// Public API

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends an OTP email to the given address.
 * Retries up to MAX_RETRIES times on failure before throwing.
 *
 * @param toEmail   Recipient email address
 * @param otp       Plain text 6-digit OTP (hashed version lives in Redis)
 * @param type      OTP flow type — determines email subject and body
 */
export const sendOtpEmail = async (
  toEmail: string,
  otp: string,
  type: OtpEmailType
): Promise<void> => {
  const template = buildEmailTemplate(otp, type);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      await trySendEmail(toEmail, template);
      console.log(`[EmailService] OTP email sent | to=${toEmail} | type=${type} | attempt=${attempt}`);
      return; // success — exit
    } catch (err) {
      lastError = err;
      console.error(
        `[EmailService] Send failed | to=${toEmail} | type=${type} | attempt=${attempt}/${MAX_RETRIES + 1}`,
        err
      );

      if (attempt <= MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt); // exponential-ish back-off
      }
    }
  }

  // All retries exhausted — bubble error up to controller
  throw new Error(
    `[EmailService] Failed to send OTP email after ${MAX_RETRIES + 1} attempts to ${toEmail}. Last error: ${lastError}`
  );
};
