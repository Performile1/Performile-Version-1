import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

interface PaymentMethod {
  id: string;
  name: string;
  type: 'mobile' | 'card';
  fee: string;
  feePercentage: number;
  recommended: boolean;
  available: boolean;
  icon: string;
  description: string;
}

/**
 * Get Available Payment Methods for C2C
 * GET /api/c2c/get-payment-methods
 * 
 * Query params:
 * - country: User's country code (NO, SE, DK, FI, etc.)
 * - amount: Payment amount in EUR
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = (req as any).user;
  const { country, amount = 100 } = req.query;

  const userCountry = (country as string)?.toUpperCase() || user.country?.toUpperCase() || 'NO';
  const paymentAmount = parseFloat(amount as string);

  try {
    const paymentMethods: PaymentMethod[] = [];

    // Add country-specific mobile payment methods
    switch (userCountry) {
      case 'NO': // Norway
        paymentMethods.push({
          id: 'vipps',
          name: 'Vipps',
          type: 'mobile',
          fee: '1.5%',
          feePercentage: 1.5,
          recommended: true,
          available: true,
          icon: '🇳🇴',
          description: 'Pay instantly with Vipps (Recommended for Norway)',
        });
        break;

      case 'SE': // Sweden
        paymentMethods.push({
          id: 'swish',
          name: 'Swish',
          type: 'mobile',
          fee: '1.0%',
          feePercentage: 1.0,
          recommended: true,
          available: true,
          icon: '🇸🇪',
          description: 'Pay instantly with Swish (Recommended for Sweden)',
        });
        break;

      case 'DK': // Denmark
        paymentMethods.push({
          id: 'mobilepay',
          name: 'MobilePay',
          type: 'mobile',
          fee: '1.2%',
          feePercentage: 1.2,
          recommended: true,
          available: false, // Coming Q1 2026
          icon: '🇩🇰',
          description: 'Pay instantly with MobilePay (Coming Q1 2026)',
        });
        break;

      case 'FI': // Finland
        paymentMethods.push({
          id: 'pivo',
          name: 'Pivo',
          type: 'mobile',
          fee: '1.5%',
          feePercentage: 1.5,
          recommended: true,
          available: false, // Coming Q2 2026
          icon: '🇫🇮',
          description: 'Pay instantly with Pivo (Coming Q2 2026)',
        });
        break;
    }

    // Always add Stripe as universal fallback
    const stripeFee = 2.9;
    const stripeFixed = 0.25;
    const totalStripeFee = (paymentAmount * stripeFee / 100) + stripeFixed;
    const stripeFeeDisplay = `${stripeFee}% + €${stripeFixed}`;

    paymentMethods.push({
      id: 'stripe',
      name: 'Credit/Debit Card',
      type: 'card',
      fee: stripeFeeDisplay,
      feePercentage: stripeFee,
      recommended: paymentMethods.length === 0, // Recommended if no local option
      available: true,
      icon: '💳',
      description: 'Pay with any credit or debit card (Works everywhere)',
    });

    // Calculate total cost for each method
    const methodsWithCost = paymentMethods.map(method => {
      let totalCost = paymentAmount;
      
      if (method.id === 'stripe') {
        totalCost = paymentAmount + (paymentAmount * stripeFee / 100) + stripeFixed;
      } else {
        totalCost = paymentAmount + (paymentAmount * method.feePercentage / 100);
      }

      return {
        ...method,
        baseAmount: paymentAmount,
        feeAmount: totalCost - paymentAmount,
        totalAmount: totalCost,
      };
    });

    // Sort: recommended first, then by fee
    methodsWithCost.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return a.feeAmount - b.feeAmount;
    });

    return res.status(200).json({
      success: true,
      data: {
        country: userCountry,
        paymentMethods: methodsWithCost,
        defaultMethod: methodsWithCost.find(m => m.recommended && m.available)?.id || 'stripe',
      },
    });

  } catch (error: any) {
    console.error('[C2C Payment Methods] Error:', error);
    
    return res.status(500).json({
      error: 'Failed to get payment methods',
      message: error.message,
    });
  }
}
