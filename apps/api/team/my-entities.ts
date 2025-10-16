import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';

const pool = getPool();

module.exports = async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const client = await pool.connect();
    try {
      // Check if team tables exist
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'team_members'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        // Tables don't exist yet, return empty array
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Team management feature coming soon'
        });
      }
      
      // Get user's team entities
      const query = `
        SELECT 
          tm.team_id,
          tm.team_name,
          tm.description,
          tm.created_at,
          COUNT(tmu.user_id) as member_count
        FROM team_members tmu
        JOIN teams tm ON tmu.team_id = tm.team_id
        WHERE tmu.user_id = $1
        GROUP BY tm.team_id, tm.team_name, tm.description, tm.created_at
        ORDER BY tm.created_at DESC
      `;
      
      const userId = req.query.userId || req.headers['x-user-id'];
      const result = await client.query(query, [userId]);
      
      res.status(200).json({
        success: true,
        data: result.rows
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Team entities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
