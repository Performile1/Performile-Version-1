import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// Initialize Resend client
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// JWT verification helper
const verifyToken = (req: VercelRequest, context: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  return decoded;
};

// Email templates
const emailTemplates = {
  orderConfirmation: {
    subject: 'Order Confirmation - Performile',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Order Confirmation</h2>
        <p>Dear ${data.customerName},</p>
        <p>Thank you for your order! Your delivery request has been confirmed.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Courier:</strong> ${data.courierName}</p>
          <p><strong>Service Type:</strong> ${data.serviceType}</p>
          <p><strong>Pickup Address:</strong> ${data.pickupAddress}</p>
          <p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
          <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
        </div>
        
        <p>You will receive updates as your order progresses.</p>
        <p>Best regards,<br>The Performile Team</p>
      </div>
    `
  },
  
  orderStatusUpdate: {
    subject: 'Order Status Update - Performile',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Order Status Update</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your order status has been updated.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order #${data.orderId}</h3>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${data.status}</span></p>
          <p><strong>Update:</strong> ${data.statusMessage}</p>
          ${data.trackingUrl ? `<p><strong>Track Your Order:</strong> <a href="${data.trackingUrl}">Click here</a></p>` : ''}
        </div>
        
        <p>Best regards,<br>The Performile Team</p>
      </div>
    `
  },
  
  leadPurchaseNotification: {
    subject: 'New Lead Purchase - Performile',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">New Lead Purchase</h2>
        <p>Dear ${data.courierName},</p>
        <p>Great news! You have a new lead purchase.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Lead Details</h3>
          <p><strong>Company:</strong> ${data.companyName}</p>
          <p><strong>Contact:</strong> ${data.contactName}</p>
          <p><strong>Email:</strong> ${data.contactEmail}</p>
          <p><strong>Phone:</strong> ${data.contactPhone}</p>
          <p><strong>Service Type:</strong> ${data.serviceType}</p>
          <p><strong>Location:</strong> ${data.location}</p>
          <p><strong>Estimated Value:</strong> $${data.estimatedValue}</p>
        </div>
        
        <p>Please contact this lead within 24 hours for the best conversion rate.</p>
        <p>Best regards,<br>The Performile Team</p>
      </div>
    `
  },
  
  courierWelcome: {
    subject: 'Welcome to Performile - Complete Your Profile',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Welcome to Performile!</h2>
        <p>Dear ${data.courierName},</p>
        <p>Welcome to the Performile platform! We're excited to have you join our network of professional couriers.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Next Steps</h3>
          <ol>
            <li>Complete your courier profile</li>
            <li>Upload required documents (license, insurance, certifications)</li>
            <li>Set your service areas and pricing</li>
            <li>Start receiving orders and leads</li>
          </ol>
        </div>
        
        <p><a href="${data.dashboardUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Complete Your Profile</a></p>
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Performile Team</p>
      </div>
    `
  }
};

// Send email helper
const sendEmail = async (to: string, templateKey: keyof typeof emailTemplates, data: any) => {
  const template = emailTemplates[templateKey];
  
  try {
    const result = await resend.emails.send({
      from: 'Performile <noreply@performile.com>',
      to: [to],
      subject: template.subject,
      html: template.template(data),
    });
    
    return result;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Handle order confirmation emails
const handleOrderConfirmation = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    const { orderId, customerEmail, customerName, courierName, serviceType, pickupAddress, deliveryAddress, estimatedDelivery } = req.body;

    if (!orderId || !customerEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID and customer email are required' 
      });
    }

    // Send confirmation email to customer
    await sendEmail(customerEmail, 'orderConfirmation', {
      customerName: customerName || 'Valued Customer',
      orderId,
      courierName,
      serviceType,
      pickupAddress,
      deliveryAddress,
      estimatedDelivery
    });

    // Log email in database
    await pool.query(
      'INSERT INTO email_logs (recipient, email_type, order_id, sent_at) VALUES ($1, $2, $3, NOW())',
      [customerEmail, 'order_confirmation', orderId]
    );

    res.status(200).json({
      success: true,
      message: 'Order confirmation email sent successfully'
    });

  } catch (error: any) {
    console.error('Order confirmation email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send order confirmation email'
    });
  }
};

// Handle order status update emails
const handleOrderStatusUpdate = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    const { orderId, customerEmail, customerName, status, statusMessage, trackingUrl } = req.body;

    if (!orderId || !customerEmail || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID, customer email, and status are required' 
      });
    }

    // Send status update email
    await sendEmail(customerEmail, 'orderStatusUpdate', {
      customerName: customerName || 'Valued Customer',
      orderId,
      status,
      statusMessage,
      trackingUrl
    });

    // Log email in database
    await pool.query(
      'INSERT INTO email_logs (recipient, email_type, order_id, sent_at) VALUES ($1, $2, $3, NOW())',
      [customerEmail, 'order_status_update', orderId]
    );

    res.status(200).json({
      success: true,
      message: 'Status update email sent successfully'
    });

  } catch (error: any) {
    console.error('Status update email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send status update email'
    });
  }
};

// Handle lead purchase notification emails
const handleLeadPurchaseNotification = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    const { 
      courierEmail, 
      courierName, 
      companyName, 
      contactName, 
      contactEmail, 
      contactPhone, 
      serviceType, 
      location, 
      estimatedValue 
    } = req.body;

    if (!courierEmail || !companyName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Courier email and company name are required' 
      });
    }

    // Send lead notification email to courier
    await sendEmail(courierEmail, 'leadPurchaseNotification', {
      courierName: courierName || 'Valued Partner',
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      serviceType,
      location,
      estimatedValue
    });

    // Log email in database
    await pool.query(
      'INSERT INTO email_logs (recipient, email_type, sent_at) VALUES ($1, $2, NOW())',
      [courierEmail, 'lead_purchase_notification']
    );

    res.status(200).json({
      success: true,
      message: 'Lead purchase notification sent successfully'
    });

  } catch (error: any) {
    console.error('Lead notification email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send lead notification email'
    });
  }
};

// Handle courier welcome emails
const handleCourierWelcome = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    const { courierEmail, courierName, dashboardUrl } = req.body;

    if (!courierEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Courier email is required' 
      });
    }

    // Send welcome email
    await sendEmail(courierEmail, 'courierWelcome', {
      courierName: courierName || 'New Partner',
      dashboardUrl: dashboardUrl || 'https://performile.com/dashboard'
    });

    // Log email in database
    await pool.query(
      'INSERT INTO email_logs (recipient, email_type, sent_at) VALUES ($1, $2, NOW())',
      [courierEmail, 'courier_welcome']
    );

    res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully'
    });

  } catch (error: any) {
    console.error('Welcome email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send welcome email'
    });
  }
};

// Get email logs
const handleGetEmailLogs = async (req: VercelRequest, res: VercelResponse, context: any) => {
  try {
    const user = verifyToken(req, context);
    const { orderId, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM email_logs';
    let params: any[] = [];

    if (orderId) {
      query += ' WHERE order_id = $1';
      params.push(orderId);
    }

    query += ' ORDER BY sent_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      logs: result.rows,
      total: result.rowCount
    });

  } catch (error: any) {
    console.error('Get email logs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve email logs'
    });
  }
};

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const context = { req, res };

  try {
    switch (req.method) {
      case 'POST':
        const { type } = req.body;
        
        switch (type) {
          case 'order_confirmation':
            return await handleOrderConfirmation(req, res, context);
          case 'order_status_update':
            return await handleOrderStatusUpdate(req, res, context);
          case 'lead_purchase_notification':
            return await handleLeadPurchaseNotification(req, res, context);
          case 'courier_welcome':
            return await handleCourierWelcome(req, res, context);
          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid email type'
            });
        }

      case 'GET':
        return await handleGetEmailLogs(req, res, context);

      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error: any) {
    console.error('Notifications API error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
