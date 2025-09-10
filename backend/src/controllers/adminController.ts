import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import db from '../config/database';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

// Get all carriers
export const getCarriers = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        c.*,
        COALESCE(cts.trust_score, 0) as trust_score,
        COUNT(DISTINCT o.order_id) as total_orders
      FROM couriers c
      LEFT JOIN courier_trust_scores cts ON c.courier_id = cts.courier_id
      LEFT JOIN orders o ON c.courier_id = o.courier_id
      GROUP BY c.courier_id, cts.trust_score
      ORDER BY c.created_at DESC
    `;
    
    const result = await db.query(query);
    
    const response: ApiResponse = {
      success: true,
      data: result.rows,
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Error fetching carriers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch carriers',
    });
  }
};

// Create new carrier
export const createCarrier = async (req: Request, res: Response) => {
  try {
    const {
      courier_name,
      contact_email,
      contact_phone,
      service_areas,
      is_active = true,
    } = req.body;

    const courier_id = uuidv4();
    
    const query = `
      INSERT INTO couriers (
        courier_id, courier_name, contact_email, contact_phone, 
        service_areas, is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      courier_id,
      courier_name,
      contact_email,
      contact_phone,
      JSON.stringify(service_areas),
      is_active,
    ];
    
    const result = await db.query(query, values);
    
    // Initialize trust score cache
    await db.query(
      'INSERT INTO courier_trust_scores (courier_id, trust_score, last_updated) VALUES ($1, 0, NOW())',
      [courier_id]
    );
    
    logger.info(`Carrier created: ${courier_name} (${courier_id})`);
    
    const response: ApiResponse = {
      success: true,
      data: result.rows[0],
      message: 'Carrier created successfully',
    };
    
    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating carrier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create carrier',
    });
  }
};

// Update carrier
export const updateCarrier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      courier_name,
      contact_email,
      contact_phone,
      service_areas,
      is_active,
    } = req.body;

    const query = `
      UPDATE couriers 
      SET courier_name = $1, contact_email = $2, contact_phone = $3,
          service_areas = $4, is_active = $5, updated_at = NOW()
      WHERE courier_id = $6
      RETURNING *
    `;
    
    const values = [
      courier_name,
      contact_email,
      contact_phone,
      JSON.stringify(service_areas),
      is_active,
      id,
    ];
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Carrier not found',
      });
    }
    
    logger.info(`Carrier updated: ${courier_name} (${id})`);
    
    const response: ApiResponse = {
      success: true,
      data: result.rows[0],
      message: 'Carrier updated successfully',
    };
    
    return res.json(response);
  } catch (error) {
    logger.error('Error updating carrier:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update carrier',
    });
  }
};

// Delete carrier
export const deleteCarrier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if carrier has orders
    const orderCheck = await db.query(
      'SELECT COUNT(*) as order_count FROM orders WHERE courier_id = $1',
      [id]
    );
    
    if (parseInt(orderCheck.rows[0].order_count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete carrier with existing orders. Deactivate instead.',
      });
    }

    // Delete trust score cache first
    await db.query('DELETE FROM courier_trust_scores WHERE courier_id = $1', [id]);
    
    // Delete carrier
    const result = await db.query(
      'DELETE FROM couriers WHERE courier_id = $1 RETURNING courier_name',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Carrier not found',
      });
    }
    
    logger.info(`Carrier deleted: ${result.rows[0].courier_name} (${id})`);
    
    const response: ApiResponse = {
      success: true,
      message: 'Carrier deleted successfully',
    };
    
    return res.json(response);
  } catch (error) {
    logger.error('Error deleting carrier:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete carrier',
    });
  }
};

// Get all stores
export const getStores = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        s.*,
        u.first_name || ' ' || u.last_name as owner_name,
        COUNT(DISTINCT o.order_id) as total_orders
      FROM stores s
      LEFT JOIN users u ON s.user_id = u.user_id
      LEFT JOIN orders o ON s.store_id = o.store_id
      GROUP BY s.store_id, u.first_name, u.last_name
      ORDER BY s.created_at DESC
    `;
    
    const result = await db.query(query);
    
    const response: ApiResponse = {
      success: true,
      data: result.rows,
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Error fetching stores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stores',
    });
  }
};

// Create new store
export const createStore = async (req: Request, res: Response) => {
  try {
    const {
      store_name,
      store_description,
      contact_email,
      contact_phone,
      address,
      website_url,
      business_type,
      is_active = true,
      owner_name,
    } = req.body;

    // Create user account for store owner
    const user_id = uuidv4();
    const store_id = uuidv4();
    const defaultPassword = 'TempPass123!'; // Should be changed on first login
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const [firstName, ...lastNameParts] = owner_name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    await db.query('BEGIN');

    try {
      // Create user account
      await db.query(`
        INSERT INTO users (
          user_id, email, password_hash, first_name, last_name, 
          user_role, is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, 'merchant', $6, NOW(), NOW())
      `, [user_id, contact_email, hashedPassword, firstName, lastName, is_active]);

      // Assign default subscription
      const defaultPlan = await db.query(
        'SELECT plan_id FROM subscription_plans WHERE plan_name = $1',
        ['Basic']
      );
      
      if (defaultPlan.rows.length > 0) {
        await db.query(`
          INSERT INTO user_subscriptions (user_id, plan_id, status, start_date)
          VALUES ($1, $2, 'active', NOW())
        `, [user_id, defaultPlan.rows[0].plan_id]);
      }

      // Create store
      const storeResult = await db.query(`
        INSERT INTO stores (
          store_id, user_id, store_name, store_description, contact_email,
          contact_phone, address, website_url, business_type, is_active,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `, [
        store_id, user_id, store_name, store_description, contact_email,
        contact_phone, address, website_url, business_type, is_active
      ]);

      await db.query('COMMIT');
      
      logger.info(`Store created: ${store_name} (${store_id}) with owner: ${owner_name}`);
      
      const response: ApiResponse = {
        success: true,
        data: { ...storeResult.rows[0], owner_name, default_password: defaultPassword },
        message: 'Store and owner account created successfully',
      };
      
      res.status(201).json(response);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Error creating store:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create store',
    });
  }
};

// Update store
export const updateStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      store_name,
      store_description,
      contact_email,
      contact_phone,
      address,
      website_url,
      business_type,
      is_active,
      owner_name,
    } = req.body;

    await db.query('BEGIN');

    try {
      // Update store
      const storeResult = await db.query(`
        UPDATE stores 
        SET store_name = $1, store_description = $2, contact_email = $3,
            contact_phone = $4, address = $5, website_url = $6,
            business_type = $7, is_active = $8, updated_at = NOW()
        WHERE store_id = $9
        RETURNING *
      `, [
        store_name, store_description, contact_email, contact_phone,
        address, website_url, business_type, is_active, id
      ]);

      if (storeResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Store not found',
        });
      }

      // Update owner name
      const [firstName, ...lastNameParts] = owner_name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      await db.query(`
        UPDATE users 
        SET first_name = $1, last_name = $2, email = $3, updated_at = NOW()
        WHERE user_id = (SELECT user_id FROM stores WHERE store_id = $4)
      `, [firstName, lastName, contact_email, id]);

      await db.query('COMMIT');
      
      logger.info(`Store updated: ${store_name} (${id})`);
      
      const response: ApiResponse = {
        success: true,
        data: { ...storeResult.rows[0], owner_name },
        message: 'Store updated successfully',
      };
      
      return res.json(response);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Error updating store:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update store',
    });
  }
};

// Delete store
export const deleteStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if store has orders
    const orderCheck = await db.query(
      'SELECT COUNT(*) as order_count FROM orders WHERE store_id = $1',
      [id]
    );
    
    if (parseInt(orderCheck.rows[0].order_count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete store with existing orders. Deactivate instead.',
      });
    }

    await db.query('BEGIN');

    try {
      // Get user_id before deleting store
      const storeResult = await db.query(
        'SELECT user_id, store_name FROM stores WHERE store_id = $1',
        [id]
      );
      
      if (storeResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Store not found',
        });
      }

      const { user_id, store_name } = storeResult.rows[0];

      // Delete user subscriptions
      await db.query('DELETE FROM user_subscriptions WHERE user_id = $1', [user_id]);
      
      // Delete store
      await db.query('DELETE FROM stores WHERE store_id = $1', [id]);
      
      // Delete user account
      await db.query('DELETE FROM users WHERE user_id = $1', [user_id]);

      await db.query('COMMIT');
      
      logger.info(`Store and owner deleted: ${store_name} (${id})`);
      
      const response: ApiResponse = {
        success: true,
        message: 'Store and owner account deleted successfully',
      };
      
      return res.json(response);
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Error deleting store:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete store',
    });
  }
};

