import { authStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface NotificationRule {
  rule_id?: string;
  rule_name: string;
  rule_description?: string;
  rule_type?: string;
  priority?: number;
  conditions: any;
  actions: any[];
  else_actions?: any[];
  cooldown_hours?: number;
  max_executions?: number;
  execution_window_start?: string;
  execution_window_end?: string;
  applies_to_couriers?: string[];
  applies_to_order_statuses?: string[];
  min_order_value?: number;
}

class NotificationRulesService {
  private getAuthHeaders() {
    const token = authStore.getState().tokens?.access_token;
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async listRules() {
    const response = await fetch(`${API_BASE_URL}/api/notification-rules?action=list`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch rules');
    }

    return response.json();
  }

  async getRule(ruleId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/notification-rules?action=get&rule_id=${ruleId}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch rule');
    }

    return response.json();
  }

  async createRule(data: NotificationRule) {
    const response = await fetch(`${API_BASE_URL}/api/notification-rules?action=create`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create rule');
    }

    return response.json();
  }

  async updateRule(ruleId: string, data: Partial<NotificationRule>) {
    const response = await fetch(`${API_BASE_URL}/api/notification-rules?action=update`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ rule_id: ruleId, ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update rule');
    }

    return response.json();
  }

  async deleteRule(ruleId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/notification-rules?action=delete&rule_id=${ruleId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete rule');
    }

    return response.json();
  }

  async toggleRule(ruleId: string, isActive: boolean) {
    const response = await fetch(`${API_BASE_URL}/api/notification-rules?action=toggle`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ rule_id: ruleId, is_active: isActive }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle rule');
    }

    return response.json();
  }

  async getRuleExecutions(ruleId: string, limit = 50, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/api/notification-rules?action=executions&rule_id=${ruleId}&limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch executions');
    }

    return response.json();
  }

  async getTemplates() {
    const response = await fetch(`${API_BASE_URL}/api/notification-rules?action=templates`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch templates');
    }

    return response.json();
  }
}

export const notificationRulesService = new NotificationRulesService();
