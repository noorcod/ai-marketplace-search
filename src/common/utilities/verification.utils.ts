import * as crypto from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Verifies the payload using HMAC and SHA256.
 *
 * @param signature
 * @param payloadString
 * @param hmacSecret
 */
export function verifyPayload(signature: string, payloadString: string, hmacSecret: string): boolean {
  try {
    const digest = crypto.createHmac('sha256', hmacSecret).update(payloadString).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(digest, 'hex'));
  } catch (error) {
    console.error('Signature verification error:', error);
    throw new HttpException('Signature verification failed', HttpStatus.UNAUTHORIZED);
  }
}
