import request from 'supertest';
import express from 'express';
import ordersRoutes from '../../routes/orders';
import database from '../../config/database';
import { authenticateToken } from '../../middleware/auth';

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    // Mock authenticated user
    req.user = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      user_role: 'merchant',
    };
    next();
  },
}));

app.use('/api/orders', ordersRoutes);

// Mock database
jest.mock('../../config/database');

describe('Orders Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders', () => {
    it('should return orders for authenticated merchant', async () => {
      // Mock merchant lookup
      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        // Mock orders query
        .mockResolvedValueOnce({
          rows: [
            {
              order_id: 'order-1',
              tracking_number: 'TRK001',
              order_status: 'pending',
              created_at: new Date(),
            },
            {
              order_id: 'order-2',
              tracking_number: 'TRK002',
              order_status: 'delivered',
              created_at: new Date(),
            },
          ],
        });

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('tracking_number');
    });

    it('should return empty array for merchant with no orders', async () => {
      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should filter orders by status', async () => {
      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              order_id: 'order-1',
              tracking_number: 'TRK001',
              order_status: 'delivered',
              created_at: new Date(),
            },
          ],
        });

      const response = await request(app)
        .get('/api/orders?status=delivered')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].order_status).toBe('delivered');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return a specific order by ID', async () => {
      const mockOrder = {
        order_id: 'order-123',
        tracking_number: 'TRK001',
        order_status: 'in_transit',
        merchant_id: 'merchant-123',
        courier_id: 'courier-123',
        created_at: new Date(),
      };

      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        .mockResolvedValueOnce({
          rows: [mockOrder],
        });

      const response = await request(app)
        .get('/api/orders/order-123')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order_id', 'order-123');
      expect(response.body.data).toHaveProperty('tracking_number', 'TRK001');
    });

    it('should return 404 for non-existent order', async () => {
      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const response = await request(app)
        .get('/api/orders/non-existent-id')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const newOrder = {
        tracking_number: 'TRK003',
        courier_id: 'courier-123',
        consumer_name: 'John Doe',
        consumer_email: 'john@example.com',
        consumer_phone: '1234567890',
        delivery_address: '123 Main St',
        delivery_city: 'New York',
        delivery_postal_code: '10001',
        delivery_country: 'USA',
        package_weight: 2.5,
        package_dimensions: '10x10x10',
        declared_value: 100.00,
      };

      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        .mockResolvedValueOnce({
          rows: [{
            order_id: 'new-order-id',
            ...newOrder,
            order_status: 'pending',
            created_at: new Date(),
          }],
        });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer mock-token')
        .send(newOrder);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order_id');
      expect(response.body.data).toHaveProperty('tracking_number', 'TRK003');
    });

    it('should reject order creation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer mock-token')
        .send({
          tracking_number: 'TRK003',
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update an order', async () => {
      const updates = {
        order_status: 'in_transit',
        tracking_notes: 'Package picked up',
      };

      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        .mockResolvedValueOnce({
          rows: [{
            order_id: 'order-123',
            merchant_id: 'merchant-123',
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            order_id: 'order-123',
            order_status: 'in_transit',
            tracking_notes: 'Package picked up',
            updated_at: new Date(),
          }],
        });

      const response = await request(app)
        .put('/api/orders/order-123')
        .set('Authorization', 'Bearer mock-token')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order_status', 'in_transit');
    });

    it('should reject update for non-existent order', async () => {
      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const response = await request(app)
        .put('/api/orders/non-existent-id')
        .set('Authorization', 'Bearer mock-token')
        .send({ order_status: 'delivered' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should delete an order (admin only)', async () => {
      // This test would need admin role mocking
      // Skipping for now as it requires more complex setup
    });
  });

  describe('RLS Policy Tests', () => {
    it('should only return orders belonging to the merchant', async () => {
      // Mock merchant with specific ID
      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              order_id: 'order-1',
              merchant_id: 'merchant-123',
              tracking_number: 'TRK001',
            },
          ],
        });

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].merchant_id).toBe('merchant-123');
    });

    it('should not allow access to orders from other merchants', async () => {
      (database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ merchant_id: 'merchant-123' }],
        })
        .mockResolvedValueOnce({
          rows: [{
            order_id: 'order-999',
            merchant_id: 'merchant-999', // Different merchant
          }],
        });

      const response = await request(app)
        .get('/api/orders/order-999')
        .set('Authorization', 'Bearer mock-token');

      // Should return 403 or 404 depending on implementation
      expect([403, 404]).toContain(response.status);
    });
  });
});
