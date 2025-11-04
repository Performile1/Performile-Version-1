import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/courier-credentials
 * Save or update courier API credentials for a merchant
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      courier_id,
      customer_number,
      api_key,
      api_secret,
      account_name,
      base_url
    } = req.body;

    // Validate required fields
    if (!courier_id || !customer_number || !api_key) {
      return res.status(400).json({ 
        error: 'Missing required fields: courier_id, customer_number, api_key' 
      });
    }

    // Get courier name
    const { data: courier, error: courierError } = await supabase
      .from('couriers')
      .select('courier_name, courier_code')
      .eq('courier_id', courier_id)
      .single();

    if (courierError || !courier) {
      return res.status(404).json({ error: 'Courier not found' });
    }

    // Check if credentials already exist
    const { data: existing } = await supabase
      .from('courier_api_credentials')
      .select('credential_id')
      .eq('merchant_id', user.id)
      .eq('courier_id', courier_id)
      .single();

    if (existing) {
      // Update existing credentials
      const { error: updateError } = await supabase
        .from('courier_api_credentials')
        .update({
          customer_number,
          api_key, // TODO: Encrypt in production
          api_secret: api_secret || null,
          account_name: account_name || null,
          base_url: base_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('credential_id', existing.credential_id);

      if (updateError) {
        console.error('Error updating credentials:', updateError);
        return res.status(500).json({ error: 'Failed to update credentials' });
      }

      return res.status(200).json({
        message: 'Credentials updated successfully',
        credential_id: existing.credential_id
      });
    } else {
      // Insert new credentials
      const { data: newCredential, error: insertError } = await supabase
        .from('courier_api_credentials')
        .insert({
          merchant_id: user.id,
          courier_id,
          courier_name: courier.courier_name,
          customer_number,
          api_key, // TODO: Encrypt in production
          api_secret: api_secret || null,
          account_name: account_name || null,
          base_url: base_url || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('credential_id')
        .single();

      if (insertError) {
        console.error('Error inserting credentials:', insertError);
        return res.status(500).json({ error: 'Failed to save credentials' });
      }

      // Update merchant_courier_selections to mark credentials as configured
      await supabase
        .from('merchant_courier_selections')
        .update({ credentials_configured: true })
        .eq('merchant_id', user.id)
        .eq('courier_id', courier_id);

      return res.status(201).json({
        message: 'Credentials saved successfully',
        credential_id: newCredential.credential_id
      });
    }
  } catch (error: any) {
    console.error('Error in courier-credentials handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
