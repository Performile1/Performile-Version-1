import crypto from 'crypto';
import { Request } from 'express';

/**
 * Webhook Signature Verifier
 * Verifies webhook signatures from different couriers
 * Prevents webhook spoofing and ensures data integrity
 */

export class SignatureVerifier {
  /**
   * Verify PostNord webhook signature
   * PostNord uses HMAC-SHA256
   */
  static verifyPostNord(req: Request): boolean {
    try {
      const signature = req.headers['x-postnord-signature'] as string;
      const secret = process.env.POSTNORD_WEBHOOK_SECRET;

      if (!signature || !secret) {
        return false;
      }

      const payload = JSON.stringify(req.body);
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('PostNord signature verification error:', error);
      return false;
    }
  }

  /**
   * Verify Bring webhook signature
   * Bring uses HMAC-SHA256 with timestamp
   */
  static verifyBring(req: Request): boolean {
    try {
      const signature = req.headers['x-bring-signature'] as string;
      const timestamp = req.headers['x-bring-timestamp'] as string;
      const secret = process.env.BRING_WEBHOOK_SECRET;

      if (!signature || !timestamp || !secret) {
        return false;
      }

      // Check timestamp (prevent replay attacks)
      const now = Math.floor(Date.now() / 1000);
      const requestTime = parseInt(timestamp);
      if (Math.abs(now - requestTime) > 300) { // 5 minutes tolerance
        console.warn('Bring webhook timestamp too old');
        return false;
      }

      const payload = timestamp + '.' + JSON.stringify(req.body);
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Bring signature verification error:', error);
      return false;
    }
  }

  /**
   * Verify Budbee webhook signature
   * Budbee uses custom signature format
   */
  static verifyBudbee(req: Request): boolean {
    try {
      const signature = req.headers['x-budbee-signature'] as string;
      const secret = process.env.BUDBEE_WEBHOOK_SECRET;

      if (!signature || !secret) {
        return false;
      }

      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHash('sha256')
        .update(payload + secret)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Budbee signature verification error:', error);
      return false;
    }
  }

  /**
   * Verify DHL webhook signature
   * DHL uses Basic Auth
   */
  static verifyDHL(req: Request): boolean {
    try {
      const authHeader = req.headers.authorization;
      const expectedAuth = process.env.DHL_WEBHOOK_AUTH;

      if (!authHeader || !expectedAuth) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(authHeader),
        Buffer.from(`Basic ${expectedAuth}`)
      );
    } catch (error) {
      console.error('DHL signature verification error:', error);
      return false;
    }
  }

  /**
   * Verify signature based on courier
   */
  static verify(courier: string, req: Request): boolean {
    switch (courier.toLowerCase()) {
      case 'postnord':
        return this.verifyPostNord(req);
      case 'bring':
        return this.verifyBring(req);
      case 'budbee':
        return this.verifyBudbee(req);
      case 'dhl':
        return this.verifyDHL(req);
      default:
        console.warn(`Unknown courier for signature verification: ${courier}`);
        return false;
    }
  }
}
