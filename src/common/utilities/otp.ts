export const OTP_EXPIRY = 120; // OTP validity in seconds
export const COOLDOWN = 90; // Cooldown period in seconds
export const MAX_ATTEMPTS = 3;
export const OTP_HASH_EXPIRY = 3600; // OTP hash validity in seconds

export type OrderOtpHash = {
  otp: string;
  lastGeneratedAt: string;
  attempts: number;
  expiryTime: string;
};
export function parseOtpHash(data: Record<string, string>): OrderOtpHash {
  return {
    otp: data.otp,
    lastGeneratedAt: data.lastGeneratedAt,
    attempts: parseInt(data.attempts),
    expiryTime: data.expiryTime,
  };
}
