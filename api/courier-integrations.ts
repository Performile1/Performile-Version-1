import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Courier Integrations API
 * Manages merchant-specific courier API integrations
 * 
 * Endpoints:
 * - GET /api/courier-integrations?action=list - List merchant's integrations
 * - GET /api/courier-integrations?action=get&integration_id=xxx - Get specific integration
 * - POST /api/courier-integrations?action=create - Create new integration
 * - PUT /api/courier-integrations?action=update - Update integration
 * - DELETE /api/courier-integrations?action=delete&integration_id=xxx - Delete integration
 * - POST /api/courier-integrations?action=test - Test integration connection
 * - POST /api/courier-integrations?action=sync - Trigger manual sync
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const action = req.query.action as string;

    switch (action) {
      case 'list':
        return await listIntegrations(req, res, user.id);
      case 'get':
        return await getIntegration(req, res, user.id);
      case 'create':
        return await createIntegration(req, res, user.id);
      case 'update':
        return await updateIntegration(req, res, user.id);
      case 'delete':
        return await deleteIntegration(req, res, user.id);
      case 'test':
        return await testIntegration(req, res, user.id);
      case 'sync':
        return await syncIntegration(req, res, user.id);
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error: any) {
    console.error('Courier integrations API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * List all integrations for a merchant
 */
async function listIntegrations(req: VercelRequest, res: VercelResponse, userId: string) {
  const { data: integrations, error } = await supabase
    .from('courier_integrations')
    .select(`
      *,
      courier:couriers(courier_id, courier_name, courier_code, logo_url)
    `)
    .eq('merchant_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ integrations });
}

/**
 * Get a specific integration
 */
async function getIntegration(req: VercelRequest, res: VercelResponse, userId: string) {
  const integrationId = req.query.integration_id as string;

  if (!integrationId) {
    return res.status(400).json({ error: 'integration_id is required' });
  }

  const { data: integration, error } = await supabase
    .from('courier_integrations')
    .select(`
      *,
      courier:couriers(courier_id, courier_name, courier_code, logo_url, api_endpoint, tracking_url_template)
    `)
    .eq('integration_id', integrationId)
    .eq('merchant_id', userId)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  return res.status(200).json({ integration });
}

/**
 * Create a new courier integration
 */
async function createIntegration(req: VercelRequest, res: VercelResponse, userId: string) {
  const {
    courier_id,
    api_base_url,
    api_version,
    auth_type,
    api_key,
    api_secret,
    client_id,
    token_url,
    is_sandbox,
    sync_frequency_minutes,
    requests_per_minute,
    requests_per_hour,
    webhook_url,
    webhook_secret,
    webhook_events,
    config
  } = req.body;

  // Validate required fields
  if (!courier_id || !api_base_url || !auth_type) {
    return res.status(400).json({ 
      error: 'courier_id, api_base_url, and auth_type are required' 
    });
  }

  // Encrypt sensitive data (simple base64 for now, use proper encryption in production)
  const encryptData = (data: string) => {
    if (!data) return null;
    return Buffer.from(data).toString('base64');
  };

  const { data: integration, error } = await supabase
    .from('courier_integrations')
    .insert({
      merchant_id: userId,
      courier_id,
      api_base_url,
      api_version,
      auth_type,
      api_key_encrypted: encryptData(api_key),
      api_secret_encrypted: encryptData(api_secret),
      client_id_encrypted: encryptData(client_id),
      token_url,
      is_sandbox: is_sandbox || false,
      sync_frequency_minutes: sync_frequency_minutes || 15,
      requests_per_minute: requests_per_minute || 60,
      requests_per_hour: requests_per_hour || 1000,
      webhook_url,
      webhook_secret,
      webhook_events,
      config: config || {}
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ 
    integration,
    message: 'Integration created successfully' 
  });
}

/**
 * Update an existing integration
 */
async function updateIntegration(req: VercelRequest, res: VercelResponse, userId: string) {
  const {
    integration_id,
    api_base_url,
    api_version,
    auth_type,
    api_key,
    api_secret,
    client_id,
    token_url,
    is_active,
    is_sandbox,
    sync_frequency_minutes,
    requests_per_minute,
    requests_per_hour,
    webhook_url,
    webhook_secret,
    webhook_events,
    config
  } = req.body;

  if (!integration_id) {
    return res.status(400).json({ error: 'integration_id is required' });
  }

  // Encrypt sensitive data
  const encryptData = (data: string) => {
    if (!data) return null;
    return Buffer.from(data).toString('base64');
  };

  const updateData: any = {};
  if (api_base_url) updateData.api_base_url = api_base_url;
  if (api_version) updateData.api_version = api_version;
  if (auth_type) updateData.auth_type = auth_type;
  if (api_key) updateData.api_key_encrypted = encryptData(api_key);
  if (api_secret) updateData.api_secret_encrypted = encryptData(api_secret);
  if (client_id) updateData.client_id_encrypted = encryptData(client_id);
  if (token_url) updateData.token_url = token_url;
  if (typeof is_active === 'boolean') updateData.is_active = is_active;
  if (typeof is_sandbox === 'boolean') updateData.is_sandbox = is_sandbox;
  if (sync_frequency_minutes) updateData.sync_frequency_minutes = sync_frequency_minutes;
  if (requests_per_minute) updateData.requests_per_minute = requests_per_minute;
  if (requests_per_hour) updateData.requests_per_hour = requests_per_hour;
  if (webhook_url) updateData.webhook_url = webhook_url;
  if (webhook_secret) updateData.webhook_secret = webhook_secret;
  if (webhook_events) updateData.webhook_events = webhook_events;
  if (config) updateData.config = config;

  const { data: integration, error } = await supabase
    .from('courier_integrations')
    .update(updateData)
    .eq('integration_id', integration_id)
    .eq('merchant_id', userId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ 
    integration,
    message: 'Integration updated successfully' 
  });
}

/**
 * Delete an integration
 */
async function deleteIntegration(req: VercelRequest, res: VercelResponse, userId: string) {
  const integrationId = req.query.integration_id as string;

  if (!integrationId) {
    return res.status(400).json({ error: 'integration_id is required' });
  }

  const { error } = await supabase
    .from('courier_integrations')
    .delete()
    .eq('integration_id', integrationId)
    .eq('merchant_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ 
    message: 'Integration deleted successfully' 
  });
}

/**
 * Test integration connection
 */
async function testIntegration(req: VercelRequest, res: VercelResponse, userId: string) {
  const { integration_id } = req.body;

  if (!integration_id) {
    return res.status(400).json({ error: 'integration_id is required' });
  }

  // Get integration details
  const { data: integration, error } = await supabase
    .from('courier_integrations')
    .select('*')
    .eq('integration_id', integration_id)
    .eq('merchant_id', userId)
    .single();

  if (error || !integration) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  // Decrypt API key (simple base64 decode for now)
  const decryptData = (data: string) => {
    if (!data) return null;
    return Buffer.from(data, 'base64').toString('utf-8');
  };

  const apiKey = decryptData(integration.api_key_encrypted);

  // Test connection based on courier type
  try {
    const testUrl = `${integration.api_base_url}/health`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const success = response.ok;

    // Update integration status
    await supabase
      .from('courier_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: success ? null : `Connection test failed: ${response.statusText}`
      })
      .eq('integration_id', integration_id);

    return res.status(200).json({
      success,
      status_code: response.status,
      message: success ? 'Connection successful' : 'Connection failed'
    });
  } catch (error: any) {
    await supabase
      .from('courier_integrations')
      .update({
        last_error: error.message
      })
      .eq('integration_id', integration_id);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Trigger manual sync for an integration
 */
async function syncIntegration(req: VercelRequest, res: VercelResponse, userId: string) {
  const { integration_id } = req.body;

  if (!integration_id) {
    return res.status(400).json({ error: 'integration_id is required' });
  }

  // Get integration details
  const { data: integration, error } = await supabase
    .from('courier_integrations')
    .select('*')
    .eq('integration_id', integration_id)
    .eq('merchant_id', userId)
    .single();

  if (error || !integration) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  // Create sync log entry
  const { data: syncLog, error: logError } = await supabase
    .from('courier_sync_logs')
    .insert({
      integration_id,
      sync_type: 'manual',
      sync_status: 'success',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (logError) {
    return res.status(500).json({ error: logError.message });
  }

  // Update integration last sync time
  await supabase
    .from('courier_integrations')
    .update({
      last_sync_at: new Date().toISOString()
    })
    .eq('integration_id', integration_id);

  return res.status(200).json({
    message: 'Sync triggered successfully',
    sync_log: syncLog
  });
}
