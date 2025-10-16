import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import jwt from 'jsonwebtoken';

const pool = getPool();

// Inline JWT helper
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      return 'development-fallback-secret-min-32-chars-long-for-testing';
    }
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
}

// Verify token
const verifyToken = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  return jwt.verify(token, getJWTSecret());
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = verifyToken(req);

    // GET - List user's conversations
    if (req.method === 'GET') {
      // Return empty conversations for now (tables may not exist yet)
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // POST - Create new conversation
    if (req.method === 'POST') {
      return res.status(400).json({ 
        message: 'Conversations feature not yet available' 
      });
    }

    const client = await pool.connect();

    try {
      // GET - List user's conversations (old code kept for reference)
      if (req.method === 'GET_OLD') {
        const { status = 'active' } = req.query;

        const query = `
          SELECT 
            c.*,
            cp.unread_count,
            cp.last_read_at,
            (
              SELECT json_agg(json_build_object(
                'user_id', u.user_id,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'email', u.email,
                'user_role', u.user_role
              ))
              FROM conversation_participants cp2
              JOIN users u ON cp2.user_id = u.user_id
              WHERE cp2.conversation_id = c.conversation_id
                AND cp2.is_active = TRUE
                AND cp2.user_id != $1
            ) as participants,
            (
              SELECT json_build_object(
                'message_id', m.message_id,
                'message_text', m.message_text,
                'sender_id', m.sender_id,
                'created_at', m.created_at
              )
              FROM messages m
              WHERE m.conversation_id = c.conversation_id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) as last_message
          FROM conversations c
          JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
          WHERE cp.user_id = $1
            AND cp.is_active = TRUE
            AND c.status = $2
          ORDER BY c.last_message_at DESC NULLS LAST
        `;

        const result = await client.query(query, [user.userId, status]);

        return res.status(200).json({
          success: true,
          data: result.rows
        });
      }

      // POST - Create new conversation
      if (req.method === 'POST') {
        const { participant_ids, subject, conversation_type = 'direct', related_order_id, related_lead_id } = req.body;

        if (!participant_ids || participant_ids.length === 0) {
          return res.status(400).json({ message: 'Participant IDs required' });
        }

        // Check if conversation already exists (for direct messages)
        if (conversation_type === 'direct' && participant_ids.length === 1) {
          const existingQuery = `
            SELECT c.conversation_id
            FROM conversations c
            JOIN conversation_participants cp1 ON c.conversation_id = cp1.conversation_id
            JOIN conversation_participants cp2 ON c.conversation_id = cp2.conversation_id
            WHERE cp1.user_id = $1
              AND cp2.user_id = $2
              AND c.conversation_type = 'direct'
              AND c.status = 'active'
            LIMIT 1
          `;
          
          const existing = await client.query(existingQuery, [user.userId, participant_ids[0]]);
          
          if (existing.rows.length > 0) {
            return res.status(200).json({
              success: true,
              data: { conversation_id: existing.rows[0].conversation_id, existing: true }
            });
          }
        }

        // Create new conversation
        const conversationQuery = `
          INSERT INTO conversations (
            subject, conversation_type, related_order_id, related_lead_id, created_by
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const conversation = await client.query(conversationQuery, [
          subject,
          conversation_type,
          related_order_id || null,
          related_lead_id || null,
          user.userId
        ]);

        const conversationId = conversation.rows[0].conversation_id;

        // Add creator as participant
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role)
           VALUES ($1, $2, 'admin')`,
          [conversationId, user.userId]
        );

        // Add other participants
        for (const participantId of participant_ids) {
          await client.query(
            `INSERT INTO conversation_participants (conversation_id, user_id, role)
             VALUES ($1, $2, 'participant')`,
            [conversationId, participantId]
          );
        }

        return res.status(201).json({
          success: true,
          data: conversation.rows[0]
        });
      }

      // PUT - Update conversation (archive, close, etc)
      if (req.method === 'PUT') {
        const { conversation_id } = req.query;
        const { status, notifications_enabled } = req.body;

        if (!conversation_id) {
          return res.status(400).json({ message: 'Conversation ID required' });
        }

        // Verify user is participant
        const participantCheck = await client.query(
          `SELECT * FROM conversation_participants 
           WHERE conversation_id = $1 AND user_id = $2`,
          [conversation_id, user.userId]
        );

        if (participantCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Not a participant' });
        }

        // Update conversation status
        if (status) {
          await client.query(
            `UPDATE conversations SET status = $1, updated_at = NOW()
             WHERE conversation_id = $2`,
            [status, conversation_id]
          );
        }

        // Update participant preferences
        if (notifications_enabled !== undefined) {
          await client.query(
            `UPDATE conversation_participants 
             SET notifications_enabled = $1
             WHERE conversation_id = $2 AND user_id = $3`,
            [notifications_enabled, conversation_id, user.userId]
          );
        }

        return res.status(200).json({
          success: true,
          message: 'Conversation updated'
        });
      }

      return res.status(405).json({ message: 'Method not allowed' });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Conversations API error:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error'
    });
  }
}
