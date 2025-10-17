// Supabase Configuration
// Created: October 17, 2025
// Purpose: Configure Supabase client with environment variables

import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

// Validate required environment variables
if (!supabaseUrl) {
  logger.error('SUPABASE_URL is not defined in environment variables');
  throw new Error('SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  logger.error('SUPABASE_ANON_KEY is not defined in environment variables');
  throw new Error('SUPABASE_ANON_KEY is required');
}

// Create Supabase client with anon key (for public operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// Create Supabase client with service role key (for admin operations)
export const supabaseAdmin = supabaseServiceRole 
  ? createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Log configuration status
logger.info('Supabase client initialized', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceRole: !!supabaseServiceRole
});

// Test connection
supabase
  .from('couriers')
  .select('count')
  .limit(1)
  .then(({ error }) => {
    if (error) {
      logger.error('Supabase connection test failed', error);
    } else {
      logger.info('Supabase connection test successful');
    }
  })
  .catch((err) => {
    logger.error('Supabase connection test error', err);
  });

export default supabase;
