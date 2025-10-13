import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import database from '../config/database';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';
import UAParser from 'ua-parser-js';

const router = Router();

/**
 * GET /api/auth/sessions
 * Get all active sessions for the logged-in user
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get all sessions for user
    const result = await database.query(
      `SELECT 
        session_id,
        device_type,
        device_name,
        browser,
        os,
        ip_address,
        location,
        last_active,
        created_at,
        user_agent,
        CASE 
          WHEN session_token = $2 THEN true 
          ELSE false 
        END as is_current
       FROM user_sessions
       WHERE user_id = $1 
         AND expires_at > NOW()
         AND is_revoked = false
       ORDER BY last_active DESC`,
      [userId, req.headers.authorization?.split(' ')[1]]
    );

    return res.json({
      success: true,
      sessions: result.rows
    });
  } catch (error) {
    logger.error('[Sessions] Error fetching sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/:sessionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.user_id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify session belongs to user
    const sessionCheck = await database.query(
      'SELECT session_id FROM user_sessions WHERE session_id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Revoke the session
    await database.query(
      `UPDATE user_sessions 
       SET is_revoked = true, 
           revoked_at = NOW(),
           revoked_reason = 'User revoked'
       WHERE session_id = $1`,
      [sessionId]
    );

    logger.info('[Sessions] Session revoked', { userId, sessionId });

    return res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    logger.error('[Sessions] Error revoking session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to revoke session'
    });
  }
});

/**
 * POST /api/auth/sessions/revoke-all
 * Revoke all sessions except the current one
 */
router.post('/revoke-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.user_id;
    const currentToken = req.headers.authorization?.split(' ')[1];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Revoke all sessions except current
    const result = await database.query(
      `UPDATE user_sessions 
       SET is_revoked = true, 
           revoked_at = NOW(),
           revoked_reason = 'User revoked all other sessions'
       WHERE user_id = $1 
         AND session_token != $2
         AND is_revoked = false`,
      [userId, currentToken]
    );

    logger.info('[Sessions] All other sessions revoked', { 
      userId, 
      count: result.rowCount 
    });

    return res.json({
      success: true,
      message: `${result.rowCount} session(s) revoked successfully`
    });
  } catch (error) {
    logger.error('[Sessions] Error revoking all sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to revoke sessions'
    });
  }
});

/**
 * Helper function to create a new session record
 */
export async function createSession(
  userId: string,
  token: string,
  req: Request
): Promise<string> {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const ua = parser.getResult();

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      (req.headers['x-real-ip'] as string) ||
                      req.connection?.remoteAddress ||
                      'unknown';

    // Determine device type
    let deviceType = 'desktop';
    if (ua.device.type === 'mobile') deviceType = 'mobile';
    else if (ua.device.type === 'tablet') deviceType = 'tablet';

    const deviceName = ua.device.vendor && ua.device.model 
      ? `${ua.device.vendor} ${ua.device.model}`
      : null;

    const browser = ua.browser.name || 'Unknown';
    const os = ua.os.name || 'Unknown';

    // Try to get location from IP (placeholder - integrate with IP geolocation service)
    const location = 'Unknown'; // TODO: Integrate with IP geolocation API

    // Session expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const result = await database.query(
      `INSERT INTO user_sessions 
       (user_id, session_token, device_type, device_name, browser, os, 
        ip_address, location, user_agent, expires_at, last_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING session_id`,
      [userId, token, deviceType, deviceName, browser, os, ipAddress, location, userAgent, expiresAt]
    );

    return result.rows[0].session_id;
  } catch (error) {
    logger.error('[Sessions] Error creating session:', error);
    throw error;
  }
}

/**
 * Helper function to update session activity
 */
export async function updateSessionActivity(token: string): Promise<void> {
  try {
    await database.query(
      `UPDATE user_sessions 
       SET last_active = NOW()
       WHERE session_token = $1 
         AND is_revoked = false
         AND expires_at > NOW()`,
      [token]
    );
  } catch (error) {
    logger.error('[Sessions] Error updating session activity:', error);
  }
}

/**
 * Helper function to cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const result = await database.query(
      `UPDATE user_sessions 
       SET is_revoked = true,
           revoked_at = NOW(),
           revoked_reason = 'Expired'
       WHERE expires_at < NOW()
         AND is_revoked = false`
    );

    if (result.rowCount && result.rowCount > 0) {
      logger.info('[Sessions] Cleaned up expired sessions', { count: result.rowCount });
    }
  } catch (error) {
    logger.error('[Sessions] Error cleaning up expired sessions:', error);
  }
}

export default router;
