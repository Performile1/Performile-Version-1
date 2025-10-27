/**
 * Express Request Type Extensions
 * 
 * Extends the Express Request interface to include custom properties
 * used by authentication middleware and API key validation.
 * 
 * These properties are added by middleware in:
 * - api/week3-integrations/api-keys.ts (authenticateApiKey middleware)
 * - Other authentication middleware
 */

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * User information attached by authentication middleware
       */
      user?: {
        id: string;
        email?: string;
        role?: string;
      };

      /**
       * API Key information attached by authenticateApiKey middleware
       */
      apiKey?: {
        api_key_id: string;
        user_id: string;
        store_id?: string;
        permissions: Record<string, any>;
        rate_limit_per_hour: number;
        total_requests: number;
        is_active: boolean;
      };
    }
  }
}

export {};
