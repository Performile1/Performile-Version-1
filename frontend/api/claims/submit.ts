import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'strict'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = (req as any).user;
  const { claim_id } = req.body;

  if (!claim_id) {
    return res.status(400).json({ error: 'claim_id required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get claim details
    const claimResult = await client.query(
      `SELECT c.*, ct.submission_method, ct.submission_email, ct.web_form_url, ct.api_endpoint
       FROM claims c
       LEFT JOIN claim_templates ct ON c.courier = ct.courier_name
       WHERE c.claim_id = $1 AND c.claimant_id = $2`,
      [claim_id, user.user_id]
    );

    if (claimResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = claimResult.rows[0];

    // Check if already submitted
    if (claim.claim_status !== 'draft') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Claim already submitted' });
    }

    // Validate required fields based on courier template
    if (!claim.incident_description || !claim.claimed_amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Missing required fields for submission' 
      });
    }

    // Update claim status
    await client.query(
      `UPDATE claims 
       SET claim_status = 'submitted', 
           submitted_to_courier = TRUE,
           submission_date = NOW(),
           updated_at = NOW()
       WHERE claim_id = $1`,
      [claim_id]
    );

    // Add timeline event
    await client.query(
      `INSERT INTO claim_timeline (claim_id, event_type, event_description, actor_id, actor_type)
       VALUES ($1, 'submitted', 'Claim submitted to courier', $2, 'user')`,
      [claim_id, user.user_id]
    );

    // TODO: Actually submit to courier based on submission_method
    // For now, we'll just mark as submitted and provide instructions

    let submissionInstructions = '';
    
    switch (claim.submission_method) {
      case 'email':
        submissionInstructions = `Email your claim to: ${claim.submission_email}`;
        break;
      case 'web_form':
        submissionInstructions = `Complete the claim form at: ${claim.web_form_url}`;
        break;
      case 'api':
        submissionInstructions = 'Claim will be automatically submitted to courier API';
        break;
      default:
        submissionInstructions = 'Please contact courier directly to complete claim submission';
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Claim submitted successfully',
      instructions: submissionInstructions,
      data: {
        claim_id,
        claim_status: 'submitted',
        submission_date: new Date()
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error submitting claim:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
