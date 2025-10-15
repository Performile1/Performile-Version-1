import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import database from '../config/database';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/claims
 * Get claims for the logged-in user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const userRole = (req as any).user?.user_role;

    logger.info('[Claims] Get claims', { userId, userRole });

    let query = '';
    let params: any[] = [];

    if (userRole === 'admin') {
      // Admin sees all claims
      query = `
        SELECT 
          c.*,
          u.email as claimant_email_user,
          u.first_name,
          u.last_name,
          o.tracking_number as order_tracking
        FROM claims c
        LEFT JOIN users u ON c.claimant_id = u.user_id
        LEFT JOIN orders o ON c.order_id = o.order_id
        ORDER BY c.created_at DESC
      `;
    } else if (userRole === 'merchant') {
      // Merchant sees claims for their orders
      const merchantResult = await database.query(
        'SELECT merchant_id FROM merchants WHERE user_id = $1',
        [userId]
      );
      
      if (merchantResult.rows.length === 0) {
        return res.json({ success: true, data: [] });
      }

      query = `
        SELECT 
          c.*,
          o.tracking_number as order_tracking
        FROM claims c
        LEFT JOIN orders o ON c.order_id = o.order_id
        WHERE o.merchant_id = $1 OR c.claimant_id = $2
        ORDER BY c.created_at DESC
      `;
      params = [merchantResult.rows[0].merchant_id, userId];
    } else {
      // Consumer/Courier sees only their claims
      query = `
        SELECT 
          c.*,
          o.tracking_number as order_tracking
        FROM claims c
        LEFT JOIN orders o ON c.order_id = o.order_id
        WHERE c.claimant_id = $1
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    }

    const result = await database.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('[Claims] Get claims error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch claims'
    });
  }
});

/**
 * POST /api/claims
 * Create a new claim
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const {
      order_id,
      tracking_number,
      courier,
      claim_type,
      incident_date,
      incident_description,
      incident_location,
      declared_value,
      claimed_amount,
      photos,
      documents,
      proof_of_value
    } = req.body;

    logger.info('[Claims] Create claim', { userId, order_id, claim_type });

    // Validate required fields
    if (!courier || !claim_type || !incident_description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: courier, claim_type, incident_description'
      });
    }

    // Get claimant info
    const userResult = await database.query(
      'SELECT email, first_name, last_name, phone FROM users WHERE user_id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    const result = await database.query(
      `INSERT INTO claims (
        order_id,
        tracking_number,
        courier,
        claim_type,
        claim_status,
        claimant_id,
        claimant_name,
        claimant_email,
        claimant_phone,
        incident_date,
        incident_description,
        incident_location,
        declared_value,
        claimed_amount,
        photos,
        documents,
        proof_of_value,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        order_id || null,
        tracking_number || null,
        courier,
        claim_type,
        'draft',
        userId,
        `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
        user.email,
        user.phone || null,
        incident_date || null,
        incident_description,
        incident_location || null,
        declared_value || null,
        claimed_amount || null,
        photos ? JSON.stringify(photos) : null,
        documents ? JSON.stringify(documents) : null,
        proof_of_value || null,
        userId
      ]
    );

    // Create timeline entry
    await database.query(
      `INSERT INTO claim_timeline (
        claim_id,
        event_type,
        event_description,
        actor_id,
        actor_name,
        actor_type
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        result.rows[0].claim_id,
        'created',
        'Claim created',
        userId,
        `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
        'user'
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Claim created successfully'
    });
  } catch (error) {
    logger.error('[Claims] Create claim error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create claim'
    });
  }
});

/**
 * POST /api/claims/submit
 * Submit a claim to the courier
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { claim_id } = req.body;

    logger.info('[Claims] Submit claim', { userId, claim_id });

    if (!claim_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing claim_id'
      });
    }

    // Verify claim ownership
    const claimResult = await database.query(
      'SELECT * FROM claims WHERE claim_id = $1',
      [claim_id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    const claim = claimResult.rows[0];
    const userRole = (req as any).user?.user_role;

    // Check permissions
    if (userRole !== 'admin' && claim.claimant_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to submit this claim'
      });
    }

    // Update claim status
    const result = await database.query(
      `UPDATE claims 
       SET claim_status = 'submitted',
           submitted_to_courier = true,
           submission_date = NOW(),
           updated_at = NOW()
       WHERE claim_id = $1
       RETURNING *`,
      [claim_id]
    );

    // Create timeline entry
    const userResult = await database.query(
      'SELECT first_name, last_name FROM users WHERE user_id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    await database.query(
      `INSERT INTO claim_timeline (
        claim_id,
        event_type,
        event_description,
        actor_id,
        actor_name,
        actor_type
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        claim_id,
        'submitted',
        'Claim submitted to courier',
        userId,
        `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
        'user'
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Claim submitted successfully'
    });
  } catch (error) {
    logger.error('[Claims] Submit claim error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit claim'
    });
  }
});

/**
 * GET /api/claims/:id
 * Get a specific claim by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const userRole = (req as any).user?.user_role;
    const { id } = req.params;

    logger.info('[Claims] Get claim by ID', { userId, claimId: id });

    const result = await database.query(
      `SELECT 
        c.*,
        u.email as claimant_email_user,
        u.first_name,
        u.last_name,
        o.tracking_number as order_tracking
      FROM claims c
      LEFT JOIN users u ON c.claimant_id = u.user_id
      LEFT JOIN orders o ON c.order_id = o.order_id
      WHERE c.claim_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    const claim = result.rows[0];

    // Check permissions
    if (userRole !== 'admin' && claim.claimant_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this claim'
      });
    }

    // Get timeline
    const timelineResult = await database.query(
      `SELECT * FROM claim_timeline 
       WHERE claim_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...claim,
        timeline: timelineResult.rows
      }
    });
  } catch (error) {
    logger.error('[Claims] Get claim by ID error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch claim'
    });
  }
});

/**
 * PUT /api/claims/:id
 * Update a claim
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const userRole = (req as any).user?.user_role;
    const { id } = req.params;
    const updates = req.body;

    logger.info('[Claims] Update claim', { userId, claimId: id });

    // Verify claim exists and check permissions
    const claimResult = await database.query(
      'SELECT * FROM claims WHERE claim_id = $1',
      [id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    const claim = claimResult.rows[0];

    if (userRole !== 'admin' && claim.claimant_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this claim'
      });
    }

    // Build update query dynamically
    const allowedFields = [
      'incident_description',
      'incident_location',
      'declared_value',
      'claimed_amount',
      'photos',
      'documents',
      'proof_of_value',
      'claim_status',
      'resolution_notes'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await database.query(
      `UPDATE claims SET ${updateFields.join(', ')} WHERE claim_id = $${paramIndex} RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Claim updated successfully'
    });
  } catch (error) {
    logger.error('[Claims] Update claim error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update claim'
    });
  }
});

export default router;
