import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Check environment variables
    const envCheck = {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      hasJWTRefresh: !!process.env.JWT_REFRESH_SECRET,
      hasSupabase: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV || 'not-set',
    };

    // Check if critical env vars are missing
    const missingCritical = [];
    if (!envCheck.hasDatabase) missingCritical.push('DATABASE_URL');
    if (!envCheck.hasJWT) missingCritical.push('JWT_SECRET');
    if (!envCheck.hasJWTRefresh) missingCritical.push('JWT_REFRESH_SECRET');

    const status = missingCritical.length === 0 ? 'healthy' : 'degraded';
    const statusCode = missingCritical.length === 0 ? 200 : 503;

    return res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      missingCritical: missingCritical.length > 0 ? missingCritical : undefined,
      message: missingCritical.length > 0 
        ? `Missing critical environment variables: ${missingCritical.join(', ')}` 
        : 'All systems operational',
      version: '1.0.0',
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message || 'Health check failed',
    });
  }
}
