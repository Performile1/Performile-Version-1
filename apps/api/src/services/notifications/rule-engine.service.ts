/**
 * Notification Rule Engine
 * 
 * Evaluates IF/THEN/ELSE logic and executes actions based on courier events
 * Supports complex conditions with AND/OR/NOT operators
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: any;
  conditions?: Condition[]; // For nested AND/OR/NOT
}

export enum ConditionOperator {
  // Comparison
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  
  // String
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  
  // Array
  IN = 'in',
  NOT_IN = 'not_in',
  
  // Boolean
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  
  // Date/Time
  DAYS_SINCE = 'days_since',
  HOURS_SINCE = 'hours_since',
  
  // Logical
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

export interface Action {
  type: ActionType;
  target?: string;
  channel?: string;
  template?: string;
  data?: Record<string, any>;
  delay_hours?: number;
}

export enum ActionType {
  // Notifications
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  SEND_PUSH = 'send_push',
  SEND_IN_APP = 'send_in_app',
  
  // Order Updates
  UPDATE_ORDER_STATUS = 'update_order_status',
  ADD_ORDER_NOTE = 'add_order_note',
  TAG_ORDER = 'tag_order',
  
  // Merchant Actions
  NOTIFY_MERCHANT = 'notify_merchant',
  CREATE_SUPPORT_TICKET = 'create_support_ticket',
  ESCALATE_TO_SUPPORT = 'escalate_to_support',
  
  // Customer Actions
  OFFER_REFUND = 'offer_refund',
  OFFER_DISCOUNT = 'offer_discount',
  
  // Courier Actions
  CONTACT_COURIER = 'contact_courier',
  REQUEST_INVESTIGATION = 'request_investigation',
  
  // AI Actions
  ASK_AI_FOR_RECOMMENDATION = 'ask_ai_for_recommendation',
  UPDATE_AI_CHAT_CONTEXT = 'update_ai_chat_context',
}

export interface RuleContext {
  order: any;
  courier: any;
  latestEvent?: any;
  allEvents: any[];
  daysSinceCreated: number;
  daysSinceLastScan: number;
  hoursSinceLastScan: number;
}

export interface RuleEvaluationResult {
  conditionsMet: boolean;
  conditionsResult: any;
  actionsToExecute: Action[];
}

// =====================================================
// RULE ENGINE SERVICE
// =====================================================

export class RuleEngineService {
  /**
   * Evaluate all active rules for an order
   */
  async evaluateRulesForOrder(orderId: string): Promise<void> {
    try {
      // Get order context
      const context = await this.getOrderContext(orderId);

      // Get active rules for merchant
      const { data: rules, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('merchant_id', context.order.store.owner_user_id)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      // Evaluate each rule
      for (const rule of rules || []) {
        await this.evaluateRule(rule, context);
      }
    } catch (error) {
      console.error('[RuleEngine] Error evaluating rules:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single rule
   */
  async evaluateRule(rule: any, context: RuleContext): Promise<void> {
    try {
      // Check cooldown
      if (await this.isInCooldown(rule.rule_id, context.order.order_id)) {
        console.log(`[RuleEngine] Rule ${rule.rule_name} is in cooldown`);
        return;
      }

      // Check max executions
      if (await this.hasReachedMaxExecutions(rule.rule_id, context.order.order_id, rule.max_executions)) {
        console.log(`[RuleEngine] Rule ${rule.rule_name} has reached max executions`);
        return;
      }

      // Evaluate conditions
      const result = this.evaluateConditions(rule.conditions, context);

      // Log execution
      await this.logRuleExecution(rule.rule_id, context.order.order_id, result);

      // Execute actions if conditions met
      if (result.conditionsMet) {
        await this.executeActions(result.actionsToExecute, context);
        
        // Update rule statistics
        await this.updateRuleStatistics(rule.rule_id, true);
      } else if (rule.else_actions) {
        // Execute else actions
        await this.executeActions(rule.else_actions, context);
      }
    } catch (error) {
      console.error(`[RuleEngine] Error evaluating rule ${rule.rule_name}:`, error);
      await this.updateRuleStatistics(rule.rule_id, false);
    }
  }

  /**
   * Evaluate conditions recursively
   */
  private evaluateConditions(conditions: any, context: RuleContext): RuleEvaluationResult {
    const operator = conditions.operator;

    // Handle logical operators (AND, OR, NOT)
    if (operator === 'AND') {
      const results = conditions.conditions.map((cond: any) => 
        this.evaluateConditions(cond, context)
      );
      const allMet = results.every((r: any) => r.conditionsMet);
      
      return {
        conditionsMet: allMet,
        conditionsResult: { operator: 'AND', results },
        actionsToExecute: allMet ? conditions.actions || [] : [],
      };
    }

    if (operator === 'OR') {
      const results = conditions.conditions.map((cond: any) => 
        this.evaluateConditions(cond, context)
      );
      const anyMet = results.some((r: any) => r.conditionsMet);
      
      return {
        conditionsMet: anyMet,
        conditionsResult: { operator: 'OR', results },
        actionsToExecute: anyMet ? conditions.actions || [] : [],
      };
    }

    if (operator === 'NOT') {
      const result = this.evaluateConditions(conditions.condition, context);
      
      return {
        conditionsMet: !result.conditionsMet,
        conditionsResult: { operator: 'NOT', result },
        actionsToExecute: !result.conditionsMet ? conditions.actions || [] : [],
      };
    }

    // Handle single condition
    const fieldValue = this.getFieldValue(conditions.field, context);
    const conditionMet = this.evaluateSingleCondition(
      fieldValue,
      conditions.operator,
      conditions.value
    );

    return {
      conditionsMet: conditionMet,
      conditionsResult: {
        field: conditions.field,
        operator: conditions.operator,
        expected: conditions.value,
        actual: fieldValue,
        met: conditionMet,
      },
      actionsToExecute: conditionMet ? conditions.actions || [] : [],
    };
  }

  /**
   * Get field value from context
   */
  private getFieldValue(field: string, context: RuleContext): any {
    const fieldMap: Record<string, any> = {
      // Order fields
      'order.id': context.order.order_id,
      'order.status': context.order.order_status,
      'order.total_amount': context.order.total_amount,
      'order.created_at': context.order.created_at,
      
      // Courier fields
      'courier.name': context.courier.courier_name,
      'courier.id': context.courier.courier_id,
      'tracking_number': context.order.tracking_number,
      
      // Event fields
      'event.type': context.latestEvent?.event_type,
      'event.code': context.latestEvent?.event_code,
      'event.timestamp': context.latestEvent?.event_timestamp,
      'event.location_city': context.latestEvent?.location_city,
      'event.location_country': context.latestEvent?.location_country,
      
      // Calculated fields
      'days_since_created': context.daysSinceCreated,
      'days_since_last_scan': context.daysSinceLastScan,
      'hours_since_last_scan': context.hoursSinceLastScan,
      'is_delayed': context.daysSinceCreated > 7,
      'is_stuck': context.daysSinceLastScan > 3,
      
      // Event checks
      'event_count': context.allEvents.length,
      'last_event_was': context.latestEvent?.event_type,
    };

    // Handle special field types
    if (field === 'has_event_type') {
      return (eventType: string) => 
        context.allEvents.some(e => e.event_type === eventType);
    }

    if (field === 'no_event_type') {
      return (eventType: string) => 
        !context.allEvents.some(e => e.event_type === eventType);
    }

    return fieldMap[field];
  }

  /**
   * Evaluate a single condition
   */
  private evaluateSingleCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      
      case 'not_equals':
        return fieldValue !== expectedValue;
      
      case 'greater_than':
        return fieldValue > expectedValue;
      
      case 'less_than':
        return fieldValue < expectedValue;
      
      case 'greater_than_or_equal':
        return fieldValue >= expectedValue;
      
      case 'less_than_or_equal':
        return fieldValue <= expectedValue;
      
      case 'contains':
        return String(fieldValue).includes(expectedValue);
      
      case 'not_contains':
        return !String(fieldValue).includes(expectedValue);
      
      case 'starts_with':
        return String(fieldValue).startsWith(expectedValue);
      
      case 'ends_with':
        return String(fieldValue).endsWith(expectedValue);
      
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
      
      case 'is_true':
        return fieldValue === true;
      
      case 'is_false':
        return fieldValue === false;
      
      case 'is_null':
        return fieldValue === null || fieldValue === undefined;
      
      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined;
      
      default:
        console.warn(`[RuleEngine] Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Execute actions
   */
  private async executeActions(actions: Action[], context: RuleContext): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, context);
      } catch (error) {
        console.error(`[RuleEngine] Error executing action ${action.type}:`, error);
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: Action, context: RuleContext): Promise<void> {
    console.log(`[RuleEngine] Executing action: ${action.type}`);

    switch (action.type) {
      case ActionType.SEND_EMAIL:
        await this.queueNotification({
          orderId: context.order.order_id,
          recipientType: action.target || 'customer',
          channel: 'email',
          template: action.template,
          data: action.data,
          delayHours: action.delay_hours,
        });
        break;

      case ActionType.SEND_SMS:
        await this.queueNotification({
          orderId: context.order.order_id,
          recipientType: action.target || 'customer',
          channel: 'sms',
          template: action.template,
          data: action.data,
        });
        break;

      case ActionType.UPDATE_ORDER_STATUS:
        await this.updateOrderStatus(context.order.order_id, action.data?.status);
        break;

      case ActionType.ADD_ORDER_NOTE:
        await this.addOrderNote(context.order.order_id, action.data?.note);
        break;

      case ActionType.NOTIFY_MERCHANT:
        await this.notifyMerchant(context.order.store.owner_user_id, action.data);
        break;

      case ActionType.CREATE_SUPPORT_TICKET:
        await this.createSupportTicket(context.order.order_id, action.data);
        break;

      case ActionType.UPDATE_AI_CHAT_CONTEXT:
        await this.updateAIChatContext(context.order.order_id, action.data);
        break;

      default:
        console.warn(`[RuleEngine] Unknown action type: ${action.type}`);
    }
  }

  /**
   * Queue a notification
   */
  private async queueNotification(params: any): Promise<void> {
    const { orderId, recipientType, channel, template, data, delayHours } = params;

    // Get recipient details
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, store_id')
      .eq('order_id', orderId)
      .single();

    const recipientId = recipientType === 'customer' ? order?.user_id : order?.store_id;

    // Calculate scheduled time
    const scheduledFor = delayHours 
      ? new Date(Date.now() + delayHours * 60 * 60 * 1000)
      : new Date();

    await supabase.from('notification_queue').insert({
      order_id: orderId,
      recipient_type: recipientType,
      recipient_id: recipientId,
      channel,
      template_name: template,
      message: data?.message || '',
      data,
      scheduled_for: scheduledFor.toISOString(),
    });
  }

  /**
   * Update order status
   */
  private async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await supabase
      .from('orders')
      .update({ order_status: status, updated_at: new Date().toISOString() })
      .eq('order_id', orderId);
  }

  /**
   * Add order note
   */
  private async addOrderNote(orderId: string, note: string): Promise<void> {
    // Assuming there's an order_notes table
    await supabase.from('order_notes').insert({
      order_id: orderId,
      note,
      created_by: 'system',
    });
  }

  /**
   * Notify merchant
   */
  private async notifyMerchant(merchantId: string, data: any): Promise<void> {
    await supabase.from('notification_queue').insert({
      recipient_type: 'merchant',
      recipient_id: merchantId,
      channel: 'email',
      message: data?.message || 'Order needs attention',
      data,
    });
  }

  /**
   * Create support ticket
   */
  private async createSupportTicket(orderId: string, data: any): Promise<void> {
    // Assuming there's a support_tickets table
    await supabase.from('support_tickets').insert({
      order_id: orderId,
      priority: data?.priority || 'medium',
      title: data?.title || 'Order issue',
      description: data?.description || '',
      status: 'open',
    });
  }

  /**
   * Update AI chat context
   */
  private async updateAIChatContext(orderId: string, data: any): Promise<void> {
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('order_id', orderId)
      .single();

    await supabase
      .from('ai_chat_courier_context')
      .upsert({
        order_id: orderId,
        user_id: order?.user_id,
        needs_attention: data?.mark_as === 'needs_attention',
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Get order context for rule evaluation
   */
  private async getOrderContext(orderId: string): Promise<RuleContext> {
    // Get order with courier
    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        courier:couriers(*),
        store:stores(*)
      `)
      .eq('order_id', orderId)
      .single();

    // Get all events
    const { data: allEvents } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('order_id', orderId)
      .order('event_timestamp', { ascending: false });

    const latestEvent = allEvents?.[0];

    // Calculate time differences
    const now = new Date();
    const createdAt = new Date(order.created_at);
    const lastScanAt = latestEvent ? new Date(latestEvent.event_timestamp) : createdAt;

    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastScan = Math.floor((now.getTime() - lastScanAt.getTime()) / (1000 * 60 * 60 * 24));
    const hoursSinceLastScan = Math.floor((now.getTime() - lastScanAt.getTime()) / (1000 * 60 * 60));

    return {
      order,
      courier: order.courier,
      latestEvent,
      allEvents: allEvents || [],
      daysSinceCreated,
      daysSinceLastScan,
      hoursSinceLastScan,
    };
  }

  /**
   * Check if rule is in cooldown period
   */
  private async isInCooldown(ruleId: string, orderId: string): Promise<boolean> {
    const { data } = await supabase
      .from('rule_executions')
      .select('executed_at')
      .eq('rule_id', ruleId)
      .eq('order_id', orderId)
      .eq('conditions_met', true)
      .order('executed_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return false;

    const { data: rule } = await supabase
      .from('notification_rules')
      .select('cooldown_hours')
      .eq('rule_id', ruleId)
      .single();

    if (!rule?.cooldown_hours) return false;

    const lastExecution = new Date(data.executed_at);
    const cooldownEnd = new Date(lastExecution.getTime() + rule.cooldown_hours * 60 * 60 * 1000);

    return new Date() < cooldownEnd;
  }

  /**
   * Check if rule has reached max executions
   */
  private async hasReachedMaxExecutions(
    ruleId: string,
    orderId: string,
    maxExecutions?: number
  ): Promise<boolean> {
    if (!maxExecutions) return false;

    const { count } = await supabase
      .from('rule_executions')
      .select('*', { count: 'exact', head: true })
      .eq('rule_id', ruleId)
      .eq('order_id', orderId)
      .eq('conditions_met', true);

    return (count || 0) >= maxExecutions;
  }

  /**
   * Log rule execution
   */
  private async logRuleExecution(
    ruleId: string,
    orderId: string,
    result: RuleEvaluationResult
  ): Promise<void> {
    await supabase.from('rule_executions').insert({
      rule_id: ruleId,
      order_id: orderId,
      conditions_met: result.conditionsMet,
      conditions_result: result.conditionsResult,
      actions_executed: result.actionsToExecute,
      actions_success: true,
    });
  }

  /**
   * Update rule statistics
   */
  private async updateRuleStatistics(ruleId: string, success: boolean): Promise<void> {
    const field = success ? 'success_count' : 'failure_count';
    
    await supabase.rpc('increment_rule_stat', {
      p_rule_id: ruleId,
      p_field: field,
    });

    await supabase
      .from('notification_rules')
      .update({
        execution_count: supabase.raw('execution_count + 1'),
        last_executed_at: new Date().toISOString(),
      })
      .eq('rule_id', ruleId);
  }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export function createRuleEngine(): RuleEngineService {
  return new RuleEngineService();
}

// =====================================================
// EXPORTS
// =====================================================

export default RuleEngineService;
