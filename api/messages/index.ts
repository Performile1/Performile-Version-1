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
    const client = await pool.connect();

    try {
      // GET - Get messages for a conversation
      if (req.method === 'GET') {
        const { conversation_id, limit = 50, offset = 0 } = req.query;

        if (!conversation_id) {
          return res.status(400).json({ message: 'Conversation ID required' });
        }

        // Verify user is participant
        const participantCheck = await client.query(
          `SELECT * FROM ConversationParticipants 
           WHERE conversation_id = $1 AND user_id = $2 AND is_active = TRUE`,
          [conversation_id, user.userId]
        );

        if (participantCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Not a participant' });
        }

        // Get messages
        const messagesQuery = `
          SELECT 
            m.*,
            u.first_name as sender_first_name,
            u.last_name as sender_last_name,
            u.email as sender_email,
            u.user_role as sender_role,
            (
              SELECT COUNT(*)
              FROM MessageReadReceipts
              WHERE message_id = m.message_id
            ) as read_count,
            (
              SELECT json_agg(json_build_object(
                'user_id', mrr.user_id,
                'read_at', mrr.read_at
              ))
              FROM MessageReadReceipts mrr
              WHERE mrr.message_id = m.message_id
            ) as read_by,
            (
              SELECT json_agg(json_build_object(
                'user_id', mr.user_id,
                'reaction_type', mr.reaction_type
              ))
              FROM MessageReactions mr
              WHERE mr.message_id = m.message_id
            ) as reactions
          FROM Messages m
          JOIN Users u ON m.sender_id = u.user_id
          WHERE m.conversation_id = $1
          ORDER BY m.created_at DESC
          LIMIT $2 OFFSET $3
        `;

        const messages = await client.query(messagesQuery, [
          conversation_id,
          parseInt(limit as string),
          parseInt(offset as string)
        ]);

        // Mark messages as read
        await client.query(
          `INSERT INTO MessageReadReceipts (message_id, user_id)
           SELECT message_id, $2
           FROM Messages
           WHERE conversation_id = $1
             AND sender_id != $2
             AND message_id NOT IN (
               SELECT message_id FROM MessageReadReceipts WHERE user_id = $2
             )
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [conversation_id, user.userId]
        );

        return res.status(200).json({
          success: true,
          data: messages.rows.reverse() // Oldest first for chat display
        });
      }

      // POST - Send a message
      if (req.method === 'POST') {
        const { conversation_id, message_text, attachments, message_type = 'text' } = req.body;

        if (!conversation_id || !message_text) {
          return res.status(400).json({ message: 'Conversation ID and message text required' });
        }

        // Verify user is participant
        const participantCheck = await client.query(
          `SELECT * FROM ConversationParticipants 
           WHERE conversation_id = $1 AND user_id = $2 AND is_active = TRUE`,
          [conversation_id, user.userId]
        );

        if (participantCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Not a participant' });
        }

        // Insert message
        const messageQuery = `
          INSERT INTO Messages (
            conversation_id, sender_id, message_text, message_type, attachments
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const message = await client.query(messageQuery, [
          conversation_id,
          user.userId,
          message_text,
          message_type,
          attachments ? JSON.stringify(attachments) : null
        ]);

        return res.status(201).json({
          success: true,
          data: message.rows[0]
        });
      }

      // PUT - Edit a message
      if (req.method === 'PUT') {
        const { message_id } = req.query;
        const { message_text } = req.body;

        if (!message_id || !message_text) {
          return res.status(400).json({ message: 'Message ID and text required' });
        }

        // Verify user is sender
        const messageCheck = await client.query(
          `SELECT * FROM Messages WHERE message_id = $1 AND sender_id = $2`,
          [message_id, user.userId]
        );

        if (messageCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Not authorized to edit this message' });
        }

        // Update message
        const updateQuery = `
          UPDATE Messages
          SET message_text = $1, is_edited = TRUE, edited_at = NOW(), updated_at = NOW()
          WHERE message_id = $2
          RETURNING *
        `;

        const updated = await client.query(updateQuery, [message_text, message_id]);

        return res.status(200).json({
          success: true,
          data: updated.rows[0]
        });
      }

      // DELETE - Delete a message
      if (req.method === 'DELETE') {
        const { message_id } = req.query;

        if (!message_id) {
          return res.status(400).json({ message: 'Message ID required' });
        }

        // Verify user is sender or admin
        const messageCheck = await client.query(
          `SELECT m.*, u.user_role
           FROM Messages m
           JOIN Users u ON u.user_id = $2
           WHERE m.message_id = $1 AND (m.sender_id = $2 OR u.user_role = 'admin')`,
          [message_id, user.userId]
        );

        if (messageCheck.rows.length === 0) {
          return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        // Delete message
        await client.query('DELETE FROM Messages WHERE message_id = $1', [message_id]);

        return res.status(200).json({
          success: true,
          message: 'Message deleted'
        });
      }

      return res.status(405).json({ message: 'Method not allowed' });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Messages API error:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error'
    });
  }
}
