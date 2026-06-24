import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Generates a random 6-digit numeric string.
 */
export const generateOtp = (): string => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

/**
 * Hashes the given OTP using bcrypt.
 * @param otp The plain text OTP
 */
export const hashOtp = async (otp: string): Promise<string> => {
  return await bcrypt.hash(otp, SALT_ROUNDS);
};

/**
 * Verifies the plain OTP against the hashed OTP.
 * @param plainOtp The plain text OTP from user
 * @param hashedOtp The hashed OTP from Redis
 */
export const verifyOtp = async (plainOtp: string, hashedOtp: string): Promise<boolean> => {
  return await bcrypt.compare(plainOtp, hashedOtp);
};
