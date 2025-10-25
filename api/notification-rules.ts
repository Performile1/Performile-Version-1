import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Notification Rules API
 * Manages IF/THEN/ELSE notification automation rules
 * 
 * Endpoints:
 * - GET /api/notification-rules?action=list - List merchant's rules
 * - GET /api/notification-rules?action=get&rule_id=xxx - Get specific rule
 * - POST /api/notification-rules?action=create - Create new rule
 * - PUT /api/notification-rules?action=update - Update rule
 * - DELETE /api/notification-rules?action=delete&rule_id=xxx - Delete rule
 * - POST /api/notification-rules?action=toggle - Toggle rule active status
 * - GET /api/notification-rules?action=executions&rule_id=xxx - Get rule execution history
 * - GET /api/notification-rules?action=templates - Get rule templates
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
        return await listRules(req, res, user.id);
      case 'get':
        return await getRule(req, res, user.id);
      case 'create':
        return await createRule(req, res, user.id);
      case 'update':
        return await updateRule(req, res, user.id);
      case 'delete':
        return await deleteRule(req, res, user.id);
      case 'toggle':
        return await toggleRule(req, res, user.id);
      case 'executions':
        return await getRuleExecutions(req, res, user.id);
      case 'templates':
        return await getRuleTemplates(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error: any) {
    console.error('Notification rules API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * List all rules for a merchant
 */
async function listRules(req: VercelRequest, res: VercelResponse, userId: string) {
  const { data: rules, error } = await supabase
    .from('notification_rules')
    .select('*')
    .eq('merchant_id', userId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ rules });
}

/**
 * Get a specific rule
 */
async function getRule(req: VercelRequest, res: VercelResponse, userId: string) {
  const ruleId = req.query.rule_id as string;

  if (!ruleId) {
    return res.status(400).json({ error: 'rule_id is required' });
  }

  const { data: rule, error } = await supabase
    .from('notification_rules')
    .select('*')
    .eq('rule_id', ruleId)
    .eq('merchant_id', userId)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  return res.status(200).json({ rule });
}

/**
 * Create a new notification rule
 */
async function createRule(req: VercelRequest, res: VercelResponse, userId: string) {
  const {
    rule_name,
    rule_description,
    rule_type,
    priority,
    conditions,
    actions,
    else_actions,
    cooldown_hours,
    max_executions,
    execution_window_start,
    execution_window_end,
    applies_to_couriers,
    applies_to_order_statuses,
    min_order_value
  } = req.body;

  // Validate required fields
  if (!rule_name || !conditions || !actions) {
    return res.status(400).json({ 
      error: 'rule_name, conditions, and actions are required' 
    });
  }

  // Validate conditions structure
  if (!conditions.operator || !conditions.conditions) {
    return res.status(400).json({ 
      error: 'conditions must have operator and conditions array' 
    });
  }

  // Validate actions structure
  if (!Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ 
      error: 'actions must be a non-empty array' 
    });
  }

  const { data: rule, error } = await supabase
    .from('notification_rules')
    .insert({
      merchant_id: userId,
      rule_name,
      rule_description,
      rule_type: rule_type || 'custom',
      priority: priority || 0,
      conditions,
      actions,
      else_actions,
      cooldown_hours: cooldown_hours || 24,
      max_executions,
      execution_window_start,
      execution_window_end,
      applies_to_couriers,
      applies_to_order_statuses,
      min_order_value
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ 
    rule,
    message: 'Rule created successfully' 
  });
}

/**
 * Update an existing rule
 */
async function updateRule(req: VercelRequest, res: VercelResponse, userId: string) {
  const {
    rule_id,
    rule_name,
    rule_description,
    priority,
    conditions,
    actions,
    else_actions,
    cooldown_hours,
    max_executions,
    execution_window_start,
    execution_window_end,
    applies_to_couriers,
    applies_to_order_statuses,
    min_order_value
  } = req.body;

  if (!rule_id) {
    return res.status(400).json({ error: 'rule_id is required' });
  }

  const updateData: any = {};
  if (rule_name) updateData.rule_name = rule_name;
  if (rule_description !== undefined) updateData.rule_description = rule_description;
  if (priority !== undefined) updateData.priority = priority;
  if (conditions) updateData.conditions = conditions;
  if (actions) updateData.actions = actions;
  if (else_actions !== undefined) updateData.else_actions = else_actions;
  if (cooldown_hours !== undefined) updateData.cooldown_hours = cooldown_hours;
  if (max_executions !== undefined) updateData.max_executions = max_executions;
  if (execution_window_start !== undefined) updateData.execution_window_start = execution_window_start;
  if (execution_window_end !== undefined) updateData.execution_window_end = execution_window_end;
  if (applies_to_couriers !== undefined) updateData.applies_to_couriers = applies_to_couriers;
  if (applies_to_order_statuses !== undefined) updateData.applies_to_order_statuses = applies_to_order_statuses;
  if (min_order_value !== undefined) updateData.min_order_value = min_order_value;

  const { data: rule, error } = await supabase
    .from('notification_rules')
    .update(updateData)
    .eq('rule_id', rule_id)
    .eq('merchant_id', userId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ 
    rule,
    message: 'Rule updated successfully' 
  });
}

/**
 * Delete a rule
 */
async function deleteRule(req: VercelRequest, res: VercelResponse, userId: string) {
  const ruleId = req.query.rule_id as string;

  if (!ruleId) {
    return res.status(400).json({ error: 'rule_id is required' });
  }

  const { error } = await supabase
    .from('notification_rules')
    .delete()
    .eq('rule_id', ruleId)
    .eq('merchant_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ 
    message: 'Rule deleted successfully' 
  });
}

/**
 * Toggle rule active status
 */
async function toggleRule(req: VercelRequest, res: VercelResponse, userId: string) {
  const { rule_id, is_active } = req.body;

  if (!rule_id || typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'rule_id and is_active (boolean) are required' });
  }

  const { data: rule, error } = await supabase
    .from('notification_rules')
    .update({ is_active })
    .eq('rule_id', rule_id)
    .eq('merchant_id', userId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ 
    rule,
    message: `Rule ${is_active ? 'activated' : 'deactivated'} successfully` 
  });
}

/**
 * Get rule execution history
 */
async function getRuleExecutions(req: VercelRequest, res: VercelResponse, userId: string) {
  const ruleId = req.query.rule_id as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  if (!ruleId) {
    return res.status(400).json({ error: 'rule_id is required' });
  }

  // Verify rule belongs to merchant
  const { data: rule, error: ruleError } = await supabase
    .from('notification_rules')
    .select('rule_id')
    .eq('rule_id', ruleId)
    .eq('merchant_id', userId)
    .single();

  if (ruleError || !rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  const { data: executions, error } = await supabase
    .from('rule_executions')
    .select(`
      *,
      order:orders(order_id, order_number, tracking_number)
    `)
    .eq('rule_id', ruleId)
    .order('executed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ executions });
}

/**
 * Get rule templates
 */
async function getRuleTemplates(req: VercelRequest, res: VercelResponse) {
  const templates = [
    {
      id: 'delayed_shipment',
      name: 'Delayed Shipment Alert',
      description: 'Notify customer when shipment has no updates for 3+ days',
      rule_type: 'template',
      priority: 5,
      conditions: {
        operator: 'AND',
        conditions: [
          {
            field: 'days_since_last_scan',
            operator: 'greater_than',
            value: 3
          },
          {
            field: 'order_status',
            operator: 'equals',
            value: 'in_transit'
          }
        ]
      },
      actions: [
        {
          type: 'send_notification',
          target: 'customer',
          channel: 'email',
          template: 'delayed_shipment',
          subject: 'Update on your order {{order_number}}',
          message: 'We noticed your order hasn\'t had an update in a few days. We\'re checking with the courier.'
        }
      ]
    },
    {
      id: 'delivery_failed',
      name: 'Failed Delivery Alert',
      description: 'Notify customer and merchant when delivery fails',
      rule_type: 'template',
      priority: 10,
      conditions: {
        operator: 'OR',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'delivery_failed'
          },
          {
            field: 'event_type',
            operator: 'equals',
            value: 'undeliverable'
          }
        ]
      },
      actions: [
        {
          type: 'send_notification',
          target: 'customer',
          channel: 'email',
          template: 'delivery_failed',
          subject: 'Delivery attempt failed for order {{order_number}}'
        },
        {
          type: 'send_notification',
          target: 'merchant',
          channel: 'email',
          template: 'merchant_delivery_failed',
          subject: 'Action required: Delivery failed for order {{order_number}}'
        }
      ]
    },
    {
      id: 'out_for_delivery',
      name: 'Out for Delivery Notification',
      description: 'Notify customer when package is out for delivery',
      rule_type: 'template',
      priority: 3,
      conditions: {
        operator: 'AND',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'out_for_delivery'
          }
        ]
      },
      actions: [
        {
          type: 'send_notification',
          target: 'customer',
          channel: 'email',
          template: 'out_for_delivery',
          subject: 'Your order {{order_number}} is out for delivery today!'
        },
        {
          type: 'send_notification',
          target: 'customer',
          channel: 'sms',
          message: 'Your package is out for delivery! Track: {{tracking_url}}'
        }
      ]
    },
    {
      id: 'delivered',
      name: 'Delivery Confirmation',
      description: 'Notify customer when package is delivered',
      rule_type: 'template',
      priority: 2,
      conditions: {
        operator: 'AND',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'delivered'
          }
        ]
      },
      actions: [
        {
          type: 'send_notification',
          target: 'customer',
          channel: 'email',
          template: 'delivered',
          subject: 'Your order {{order_number}} has been delivered!'
        }
      ]
    },
    {
      id: 'stuck_in_customs',
      name: 'Customs Delay Alert',
      description: 'Notify when package is stuck in customs for 5+ days',
      rule_type: 'template',
      priority: 7,
      conditions: {
        operator: 'AND',
        conditions: [
          {
            field: 'event_type',
            operator: 'contains',
            value: 'customs'
          },
          {
            field: 'days_since_last_scan',
            operator: 'greater_than',
            value: 5
          }
        ]
      },
      actions: [
        {
          type: 'send_notification',
          target: 'customer',
          channel: 'email',
          template: 'customs_delay',
          subject: 'Your order {{order_number}} is being processed by customs'
        },
        {
          type: 'send_notification',
          target: 'merchant',
          channel: 'in_app',
          message: 'Order {{order_number}} stuck in customs - may need documentation'
        }
      ]
    },
    {
      id: 'high_value_delivered',
      name: 'High Value Order Delivered',
      description: 'Special notification for high-value orders',
      rule_type: 'template',
      priority: 8,
      conditions: {
        operator: 'AND',
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: 'delivered'
          },
          {
            field: 'order_value',
            operator: 'greater_than',
            value: 1000
          }
        ]
      },
      actions: [
        {
          type: 'send_notification',
          target: 'customer',
          channel: 'email',
          template: 'high_value_delivered',
          subject: 'Your premium order {{order_number}} has been delivered'
        },
        {
          type: 'send_notification',
          target: 'merchant',
          channel: 'in_app',
          message: 'High-value order {{order_number}} delivered successfully'
        }
      ]
    }
  ];

  return res.status(200).json({ templates });
}
