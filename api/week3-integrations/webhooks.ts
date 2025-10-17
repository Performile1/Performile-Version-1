/**
 * WEEK 3: WEBHOOK MANAGEMENT API
 * Purpose: Manage webhook subscriptions and receive webhook events
 * Endpoints: POST, GET, PUT, DELETE webhooks
 */

import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generate webhook secret
 */
function generateWebhookSecret(): string {
  return 'whsec_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * POST /api/week3-integrations/webhooks
 * Create new webhook subscription
 */
export async function createWebhook(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      store_id,
      integration_type,
      platform_name,
      platform_url,
      webhook_url,
      event_types,
      api_key,
      api_secret
    } = req.body;

    // Validate required fields
    if (!platform_name || !webhook_url) {
      return res.status(400).json({ 
        error: 'platform_name and webhook_url are required' 
      });
    }

    // Generate webhook secret
    const webhook_secret = generateWebhookSecret();

    // Insert webhook
    const { data, error } = await supabase
      .from('week3_webhooks')
      .insert({
        user_id: userId,
        store_id,
        integration_type: integration_type || 'ecommerce',
        platform_name,
        platform_url,
        webhook_url,
        webhook_secret,
        event_types: event_types || [],
        api_key,
        api_secret,
        is_active: true,
        total_deliveries: 0,
        failed_deliveries: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      return res.status(500).json({ error: 'Failed to create webhook' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'webhook.created',
      entity_type: 'webhook',
      entity_id: data.webhook_id,
      user_id: userId,
      store_id,
      event_data: { platform_name, webhook_url },
      status: 'success'
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('Error in createWebhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/week3-integrations/webhooks
 * List all webhooks for user
 */
export async function getWebhooks(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { store_id, integration_type } = req.query;

    let query = supabase
      .from('week3_webhooks')
      .select('*')
      .eq('user_id', userId);

    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    if (integration_type) {
      query = query.eq('integration_type', integration_type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return res.status(500).json({ error: 'Failed to fetch webhooks' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in getWebhooks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/week3-integrations/webhooks/:id
 * Update webhook
 */
export async function updateWebhook(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const {
      webhook_url,
      event_types,
      is_active,
      platform_url,
      api_key,
      api_secret
    } = req.body;

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() };
    if (webhook_url) updates.webhook_url = webhook_url;
    if (event_types) updates.event_types = event_types;
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (platform_url) updates.platform_url = platform_url;
    if (api_key) updates.api_key = api_key;
    if (api_secret) updates.api_secret = api_secret;

    const { data, error } = await supabase
      .from('week3_webhooks')
      .update(updates)
      .eq('webhook_id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating webhook:', error);
      return res.status(500).json({ error: 'Failed to update webhook' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'webhook.updated',
      entity_type: 'webhook',
      entity_id: id,
      user_id: userId,
      event_data: { webhook_id: id, updates },
      status: 'success'
    });

    res.json(data);
  } catch (error) {
    console.error('Error in updateWebhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/week3-integrations/webhooks/:id
 * Delete webhook
 */
export async function deleteWebhook(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('week3_webhooks')
      .delete()
      .eq('webhook_id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting webhook:', error);
      return res.status(500).json({ error: 'Failed to delete webhook' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'webhook.deleted',
      entity_type: 'webhook',
      entity_id: id,
      user_id: userId,
      event_data: { webhook_id: id },
      status: 'success'
    });

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error in deleteWebhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/week3-integrations/webhooks/receive/:courier_name
 * Receive webhook from courier
 */
export async function receiveWebhook(req: Request, res: Response) {
  try {
    const { courier_name } = req.params;
    const signature = req.headers['x-webhook-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Find webhook configuration for this courier
    const { data: webhook } = await supabase
      .from('week3_webhooks')
      .select('*')
      .eq('platform_name', courier_name)
      .eq('is_active', true)
      .single();

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not configured' });
    }

    // Verify signature
    if (signature && webhook.webhook_secret) {
      const isValid = verifyWebhookSignature(payload, signature, webhook.webhook_secret);
      if (!isValid) {
        // Log failed verification
        await supabase.from('week3_integration_events').insert({
          event_type: 'webhook.received',
          entity_type: 'webhook',
          entity_id: webhook.webhook_id,
          courier_name,
          event_data: { error: 'Invalid signature' },
          status: 'failed',
          error_message: 'Webhook signature verification failed'
        });

        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Process webhook event
    const event = req.body;
    const eventType = event.type || event.event || 'unknown';

    // Update webhook stats
    await supabase
      .from('week3_webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        total_deliveries: webhook.total_deliveries + 1
      })
      .eq('webhook_id', webhook.webhook_id);

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'webhook.received',
      entity_type: 'webhook',
      entity_id: webhook.webhook_id,
      courier_name,
      user_id: webhook.user_id,
      store_id: webhook.store_id,
      event_data: event,
      status: 'success'
    });

    // TODO: Process specific event types (tracking updates, delivery confirmations, etc.)
    // This will be implemented in Phase 4 with actual courier integrations

    res.json({ 
      message: 'Webhook received successfully',
      event_type: eventType
    });
  } catch (error) {
    console.error('Error in receiveWebhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
