import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import database from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));
router.use(apiRateLimit);

// Get users by role (merchants, couriers, etc.)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { role, status } = req.query;
    
    let query = 'SELECT user_id, email, user_role, first_name, last_name, phone, is_verified, is_active, created_at FROM users WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND user_role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (status === 'active') {
      query += ` AND is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND is_active = false`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await database.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('[Admin] Get users error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Get carriers
router.get('/carriers', async (req: Request, res: Response) => {
  try {
    const result = await database.query(
      'SELECT * FROM carriers ORDER BY carrier_name ASC'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('[Admin] Get carriers error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch carriers'
    });
  }
});

// Create carrier
router.post('/carriers', async (req: Request, res: Response) => {
  try {
    const { carrier_name, contact_email, contact_phone, service_areas, is_active } = req.body;

    const result = await database.query(
      `INSERT INTO carriers (carrier_name, contact_email, contact_phone, service_areas, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [carrier_name, contact_email, contact_phone, service_areas, is_active !== false]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('[Admin] Create carrier error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create carrier'
    });
  }
});

// Update carrier
router.put('/carriers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { carrier_name, contact_email, contact_phone, service_areas, is_active } = req.body;

    const result = await database.query(
      `UPDATE carriers 
       SET carrier_name = $1, contact_email = $2, contact_phone = $3, 
           service_areas = $4, is_active = $5, updated_at = NOW()
       WHERE carrier_id = $6
       RETURNING *`,
      [carrier_name, contact_email, contact_phone, service_areas, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Carrier not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('[Admin] Update carrier error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update carrier'
    });
  }
});

// Delete carrier
router.delete('/carriers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await database.query(
      'DELETE FROM carriers WHERE carrier_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Carrier not found'
      });
    }

    res.json({
      success: true,
      message: 'Carrier deleted successfully'
    });
  } catch (error) {
    logger.error('[Admin] Delete carrier error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete carrier'
    });
  }
});

// Get stores
router.get('/stores', async (req: Request, res: Response) => {
  try {
    const result = await database.query(
      `SELECT m.*, u.email, u.first_name, u.last_name
       FROM merchants m
       LEFT JOIN users u ON m.user_id = u.user_id
       ORDER BY m.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('[Admin] Get stores error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stores'
    });
  }
});

export default router;

