import { Request, Response } from 'express';
import Database from '../config/database';
import { validateLogoUpload, deleteOldLogo } from '../middleware/upload';

export class CourierController {
  private db: typeof Database;

  constructor() {
    this.db = Database;
  }

  // Create new courier with optional logo upload
  async createCourier(req: Request, res: Response): Promise<void> {
    try {
      const {
        user_id,
        company_name,
        contact_person,
        phone,
        email,
        address,
        city,
        postal_code,
        country,
        service_areas,
        vehicle_types,
        max_weight_kg,
        max_dimensions_cm,
        operating_hours,
        special_services,
        pricing_model,
        is_active = true
      } = req.body;

      // Logo URL will be set by upload middleware if file was uploaded
      const logo_url = req.body.logo_url || null;

      const query = `
        INSERT INTO couriers (
          user_id, company_name, contact_person, phone, email, address,
          city, postal_code, country, service_areas, vehicle_types,
          max_weight_kg, max_dimensions_cm, operating_hours, special_services,
          pricing_model, logo_url, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;

      const values = [
        user_id, company_name, contact_person, phone, email, address,
        city, postal_code, country, service_areas, vehicle_types,
        max_weight_kg, max_dimensions_cm, operating_hours, special_services,
        pricing_model, logo_url, is_active
      ];

      const result = await this.db.query(query, values);
      
      res.status(201).json({
        message: 'Courier created successfully',
        courier: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error creating courier:', error);
      res.status(500).json({
        error: 'Failed to create courier',
        details: error.message
      });
    }
  }

  // Update courier with optional logo upload
  async updateCourier(req: Request, res: Response): Promise<void> {
    try {
      const courierId = req.params.id;
      const updateData = { ...req.body };

      // Get current courier data to check for existing logo
      const currentCourier = await this.db.query(
        'SELECT logo_url FROM couriers WHERE courier_id = $1',
        [courierId]
      );

      if (currentCourier.rows.length === 0) {
        res.status(404).json({ error: 'Courier not found' });
        return;
      }

      // If new logo was uploaded, delete old one
      if (req.body.logo_url && currentCourier.rows[0].logo_url) {
        deleteOldLogo(currentCourier.rows[0].logo_url);
      }

      // Build dynamic update query
      const updateFields = Object.keys(updateData)
        .filter(key => updateData[key] !== undefined)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      if (updateFields.length === 0) {
        res.status(400).json({ error: 'No valid fields to update' });
        return;
      }

      const query = `
        UPDATE couriers 
        SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
        WHERE courier_id = $1
        RETURNING *
      `;

      const values = [
        courierId,
        ...Object.keys(updateData)
          .filter(key => updateData[key] !== undefined)
          .map(key => updateData[key])
      ];

      const result = await this.db.query(query, values);

      res.json({
        message: 'Courier updated successfully',
        courier: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error updating courier:', error);
      res.status(500).json({
        error: 'Failed to update courier',
        details: error.message
      });
    }
  }

  // Upload logo for existing courier
  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      const courierId = req.params.id;

      if (!req.file) {
        res.status(400).json({ error: 'No logo file provided' });
        return;
      }

      // Get current courier to check if it exists and has existing logo
      const currentCourier = await this.db.query(
        'SELECT logo_url FROM couriers WHERE courier_id = $1',
        [courierId]
      );

      if (currentCourier.rows.length === 0) {
        res.status(404).json({ error: 'Courier not found' });
        return;
      }

      // Delete old logo if exists
      if (currentCourier.rows[0].logo_url) {
        deleteOldLogo(currentCourier.rows[0].logo_url);
      }

      // Update courier with new logo URL
      const logoUrl = req.body.logo_url;
      const query = `
        UPDATE couriers 
        SET logo_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE courier_id = $2
        RETURNING courier_id, company_name, logo_url
      `;

      const result = await this.db.query(query, [logoUrl, courierId]);

      res.json({
        message: 'Logo uploaded successfully',
        courier: result.rows[0],
        logo_info: {
          recommended_size: '160x160 pixels',
          max_file_size: '5MB',
          supported_formats: ['JPEG', 'PNG', 'GIF', 'WebP']
        }
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      res.status(500).json({
        error: 'Failed to upload logo',
        details: error.message
      });
    }
  }

  // Get all couriers
  async getCouriers(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT c.*, u.email as user_email, u.first_name, u.last_name
        FROM couriers c
        LEFT JOIN users u ON c.user_id = u.user_id
        ORDER BY c.created_at DESC
      `;

      const result = await this.db.query(query);
      
      res.json({
        couriers: result.rows,
        total: result.rows.length
      });
    } catch (error: any) {
      console.error('Error fetching couriers:', error);
      res.status(500).json({
        error: 'Failed to fetch couriers',
        details: error.message
      });
    }
  }

  // Get courier by ID
  async getCourierById(req: Request, res: Response): Promise<void> {
    try {
      const courierId = req.params.id;

      const query = `
        SELECT c.*, u.email as user_email, u.first_name, u.last_name
        FROM couriers c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.courier_id = $1
      `;

      const result = await this.db.query(query, [courierId]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Courier not found' });
        return;
      }

      res.json({
        courier: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error fetching courier:', error);
      res.status(500).json({
        error: 'Failed to fetch courier',
        details: error.message
      });
    }
  }

  // Delete courier
  async deleteCourier(req: Request, res: Response): Promise<void> {
    try {
      const courierId = req.params.id;

      // Get courier data to delete logo file
      const courierResult = await this.db.query(
        'SELECT logo_url FROM couriers WHERE courier_id = $1',
        [courierId]
      );

      if (courierResult.rows.length === 0) {
        res.status(404).json({ error: 'Courier not found' });
        return;
      }

      // Delete logo file if exists
      if (courierResult.rows[0].logo_url) {
        deleteOldLogo(courierResult.rows[0].logo_url);
      }

      // Delete courier record
      await this.db.query('DELETE FROM couriers WHERE courier_id = $1', [courierId]);

      res.json({
        message: 'Courier deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting courier:', error);
      res.status(500).json({
        error: 'Failed to delete courier',
        details: error.message
      });
    }
  }
}
