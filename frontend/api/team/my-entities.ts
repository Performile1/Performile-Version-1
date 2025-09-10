import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await pool.connect();
    try {
      // Get user's team entities
      const query = `
        SELECT 
          tm.team_id,
          tm.team_name,
          tm.description,
          tm.created_at,
          COUNT(tmu.user_id) as member_count
        FROM TeamMembers tmu
        JOIN Teams tm ON tmu.team_id = tm.team_id
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
