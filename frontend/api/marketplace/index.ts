import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
const jwt = require('jsonwebtoken');
const { logger, withLogging } = require('../utils/logger');

const pool = getPool();

// JWT verification
const verifyToken = (req: VercelRequest, context: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header', context);
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.logJWTError(error as Error, context);
    throw new Error('Invalid token');
  }
};

// Get all couriers or specific courier by ID
const handleGetCouriers = async (req: VercelRequest, res: VercelResponse, context: any) => {
  const { id } = req.query;

  try {
    let query: string;
    let params: any[] = [];

    if (id) {
      query = 'SELECT * FROM couriers WHERE courier_id = $1';
      params = [id];
      logger.logDatabaseQuery(query, params, context);
    } else {
      query = 'SELECT courier_id, courier_name, company_name, contact_name, email, phone, address, city, postal_code, country, created_at FROM couriers WHERE is_active = true ORDER BY courier_name ASC';
      logger.logDatabaseQuery(query, [], context);
    }

    const result = await pool.query(query, params);

    if (id && result.rows.length === 0) {
      logger.warn('Courier not found', context, { courierId: id });
      return res.status(404).json({
        success: false,
        message: 'Courier not found'
      });
    }

    logger.info(`Retrieved ${result.rows.length} courier(s)`, context);
    
    res.status(200).json({
      success: true,
      couriers: id ? [result.rows[0]] : result.rows
    });

  } catch (error) {
    logger.logDatabaseError(error as Error, 'Courier retrieval query', context);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve couriers'
    });
  }
};

// Create new courier
const handleCreateCourier = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    const { courier_name, company_name, contact_name, email, phone, address, city, postal_code, country } = req.body;

    if (!courier_name || !contact_name || !email) {
      logger.warn('Missing required fields for courier creation', context, req.body);
      return res.status(400).json({
        success: false,
        message: 'Courier name, contact name, and email are required'
      });
    }

    const query = `
      INSERT INTO couriers (courier_name, company_name, contact_name, email, phone, address, city, postal_code, country, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
      RETURNING *
    `;
    
    const params = [courier_name, company_name, contact_name, email, phone, address, city, postal_code, country];
    logger.logDatabaseQuery(query, params, context);

    const result = await pool.query(query, params);
    
    logger.info('Courier created successfully', { ...context, userId: user.user_id }, { 
      courierId: result.rows[0].courier_id,
      courierName: courier_name 
    });

    res.status(201).json({
      success: true,
      message: 'Courier created successfully',
      courier: result.rows[0]
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    logger.logDatabaseError(error as Error, 'Courier creation query', context);
    res.status(500).json({
      success: false,
      message: 'Failed to create courier'
    });
  }
};

// Update courier
const handleUpdateCourier = async (req: VercelRequest, res: VercelResponse, context: any) => {
  const { id } = req.query;

  if (!id) {
    logger.warn('Missing courier ID for update', context);
    return res.status(400).json({
      success: false,
      message: 'Courier ID is required'
    });
  }

  try {
    const user = verifyToken(req, context);
    const { courier_name, company_name, contact_name, email, phone, address, city, postal_code, country } = req.body;

    const query = `
      UPDATE couriers 
      SET courier_name = $1, company_name = $2, contact_name = $3, email = $4, phone = $5, 
          address = $6, city = $7, postal_code = $8, country = $9, updated_at = NOW()
      WHERE courier_id = $10
      RETURNING *
    `;
    
    const params = [courier_name, company_name, contact_name, email, phone, address, city, postal_code, country, id];
    logger.logDatabaseQuery(query, params, context);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      logger.warn('Courier not found for update', context, { courierId: id });
      return res.status(404).json({
        success: false,
        message: 'Courier not found'
      });
    }

    logger.info('Courier updated successfully', { ...context, userId: user.user_id }, { 
      courierId: id 
    });

    res.status(200).json({
      success: true,
      message: 'Courier updated successfully',
      courier: result.rows[0]
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    logger.logDatabaseError(error as Error, 'Courier update query', context);
    res.status(500).json({
      success: false,
      message: 'Failed to update courier'
    });
  }
};

// Delete courier
const handleDeleteCourier = async (req: VercelRequest, res: VercelResponse, context: any) => {
  const { id } = req.query;

  if (!id) {
    logger.warn('Missing courier ID for deletion', context);
    return res.status(400).json({
      success: false,
      message: 'Courier ID is required'
    });
  }

  try {
    const user = verifyToken(req, context);

    const query = 'UPDATE couriers SET is_active = false, updated_at = NOW() WHERE courier_id = $1 RETURNING *';
    logger.logDatabaseQuery(query, [id], context);

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      logger.warn('Courier not found for deletion', context, { courierId: id });
      return res.status(404).json({
        success: false,
        message: 'Courier not found'
      });
    }

    logger.info('Courier deleted successfully', { ...context, userId: user.user_id }, { 
      courierId: id 
    });

    res.status(200).json({
      success: true,
      message: 'Courier deleted successfully'
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    logger.logDatabaseError(error as Error, 'Courier deletion query', context);
    res.status(500).json({
      success: false,
      message: 'Failed to delete courier'
    });
  }
};

// Team management functionality (merged from team/my-entities.ts)
const handleGetTeamEntities = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    
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
    
    const result = await pool.query(query, [user.user_id]);
    
    logger.info(`Retrieved ${result.rows.length} team entities for user`, context, { userId: user.user_id });
    
    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    logger.logDatabaseError(error as Error, 'Team entities retrieval query', context);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team entities'
    });
  }
};

// Courier marketplace functionality (placeholder for future implementation)
const handleGetMarketplace = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    
    // Placeholder implementation - return available couriers for marketplace
    const query = `
      SELECT 
        courier_id, courier_name, company_name, contact_name, 
        email, phone, city, postal_code, country, created_at
      FROM couriers 
      WHERE is_active = true 
      ORDER BY courier_name ASC
    `;
    
    const result = await pool.query(query);
    
    logger.info(`Retrieved ${result.rows.length} couriers for marketplace`, context);
    
    res.status(200).json({
      success: true,
      couriers: result.rows
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    logger.logDatabaseError(error as Error, 'Marketplace retrieval query', context);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve marketplace data'
    });
  }
};

// Service request functionality (placeholder for future implementation)
const handleServiceRequest = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    const { courier_id, service_type, pickup_address, delivery_address, notes } = req.body;

    if (!courier_id || !service_type) {
      return res.status(400).json({
        success: false,
        message: 'Courier ID and service type are required'
      });
    }

    // Placeholder implementation - create service request
    const query = `
      INSERT INTO orders (courier_id, order_status, pickup_address, delivery_address, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    
    const params = [courier_id, 'pending', pickup_address, delivery_address, notes];
    const result = await pool.query(query, params);
    
    logger.info('Service request created', { ...context, userId: user.user_id }, { 
      orderId: result.rows[0].order_id,
      courierId: courier_id 
    });

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      order: result.rows[0]
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    logger.logDatabaseError(error as Error, 'Service request creation', context);
    res.status(500).json({
      success: false,
      message: 'Failed to create service request'
    });
  }
};

// Handle search functionality (merged from search/index.ts)
const handleGlobalSearch = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    const { q: query, limit = '10' } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters long'
      });
    }

    const searchTerm = query.trim();
    const searchPattern = `%${searchTerm}%`;
    const maxResults = Math.min(parseInt(limit as string), 50);
    
    const results: any[] = [];

    // Search Couriers
    try {
      let courierQuery = `
        SELECT 
          c.courier_id as id,
          'courier' as type,
          c.courier_name as title,
          CONCAT(c.city, ', ', c.country) as subtitle,
          c.email as metadata,
          CONCAT('/couriers/', c.courier_id) as url
        FROM couriers c
        WHERE (
          c.courier_name ILIKE $1 OR 
          c.company_name ILIKE $1 OR
          c.city ILIKE $1
        ) AND c.is_active = true
        ORDER BY c.courier_name ASC
        LIMIT $2
      `;
      
      const courierResult = await pool.query(courierQuery, [searchPattern, maxResults]);
      results.push(...courierResult.rows);
    } catch (error) {
      console.error('Courier search error:', error);
    }

    // Search Orders (if user has access)
    if (user.user_role === 'merchant' || user.user_role === 'admin') {
      try {
        let orderQuery = `
          SELECT 
            o.order_id as id,
            'order' as type,
            o.tracking_number as title,
            COALESCE(o.order_number, 'No order number') as subtitle,
            CONCAT(s.store_name, ' → ', c.courier_name) as metadata,
            CONCAT('/orders/', o.order_id) as url
          FROM orders o
          LEFT JOIN stores s ON o.store_id = s.store_id
          LEFT JOIN couriers c ON o.courier_id = c.courier_id
          WHERE (
            o.tracking_number ILIKE $1 OR 
            o.order_number ILIKE $1
          )
        `;
        
        const orderParams = [searchPattern];
        
        if (user.user_role === 'merchant') {
          orderQuery += ' AND s.owner_user_id = $2';
          orderParams.push(user.user_id);
        }
        
        orderQuery += ' ORDER BY o.created_at DESC LIMIT $' + (orderParams.length + 1);
        orderParams.push(Math.min(maxResults - results.length, 20).toString());
        
        const orderResult = await pool.query(orderQuery, orderParams);
        results.push(...orderResult.rows);
      } catch (error) {
        console.error('Order search error:', error);
      }
    }

    res.status(200).json({
      success: true,
      results: results.slice(0, maxResults),
      total: results.length,
      query: searchTerm
    });

  } catch (error: any) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Search failed'
    });
  }
};

module.exports = withLogging(async function handler(req: VercelRequest, res: VercelResponse) {
  const context = { endpoint: '/api/courier', method: req.method };
  
  try {
    // Handle team entities endpoint
    if (req.url?.includes('/team-entities') || req.query.action === 'team-entities') {
      if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed for team entities' });
      }
      return await handleGetTeamEntities(req, res, context);
    }

    // Handle courier marketplace endpoint
    if (req.url?.includes('/marketplace') || req.query.action === 'marketplace') {
      if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed for marketplace' });
      }
      return await handleGetMarketplace(req, res, context);
    }

    // Handle courier service request endpoint
    if (req.url?.includes('/request') || req.query.action === 'request') {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed for service request' });
      }
      return await handleServiceRequest(req, res, context);
    }

    // Handle search endpoint
    if (req.url?.includes('/search') || req.query.action === 'search') {
      if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed for search' });
      }
      return await handleGlobalSearch(req, res, context);
    }

    // Handle individual courier by ID (from query parameter)
    const { id } = req.query;
    
    switch (req.method) {
      case 'GET':
        return await handleGetCouriers(req, res, context);
      case 'POST':
        return await handleCreateCourier(req, res, context);
      case 'PUT':
      case 'PATCH':
        return await handleUpdateCourier(req, res, context);
      case 'DELETE':
        return await handleDeleteCourier(req, res, context);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    logger.error('Unhandled error in courier API', context, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
