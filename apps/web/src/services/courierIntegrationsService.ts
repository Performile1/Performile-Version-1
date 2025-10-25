import { authStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface CourierIntegration {
  integration_id?: string;
  courier_id?: string;
  api_base_url?: string;
  api_version?: string;
  auth_type?: string;
  api_key?: string;
  api_secret?: string;
  client_id?: string;
  token_url?: string;
  is_active?: boolean;
  is_sandbox?: boolean;
  sync_frequency_minutes?: number;
  requests_per_minute?: number;
  requests_per_hour?: number;
  webhook_url?: string;
  webhook_secret?: string;
  webhook_events?: string[];
  config?: any;
}

class CourierIntegrationsService {
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

  async listIntegrations() {
    const response = await fetch(`${API_BASE_URL}/api/courier-integrations?action=list`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch integrations');
    }

    return response.json();
  }

  async getIntegration(integrationId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/courier-integrations?action=get&integration_id=${integrationId}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch integration');
    }

    return response.json();
  }

  async createIntegration(data: CourierIntegration) {
    const response = await fetch(`${API_BASE_URL}/api/courier-integrations?action=create`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create integration');
    }

    return response.json();
  }

  async updateIntegration(integrationId: string, data: Partial<CourierIntegration>) {
    const response = await fetch(`${API_BASE_URL}/api/courier-integrations?action=update`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ integration_id: integrationId, ...data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update integration');
    }

    return response.json();
  }

  async deleteIntegration(integrationId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/courier-integrations?action=delete&integration_id=${integrationId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete integration');
    }

    return response.json();
  }

  async testIntegration(integrationId: string) {
    const response = await fetch(`${API_BASE_URL}/api/courier-integrations?action=test`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ integration_id: integrationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to test integration');
    }

    return response.json();
  }

  async syncIntegration(integrationId: string) {
    const response = await fetch(`${API_BASE_URL}/api/courier-integrations?action=sync`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ integration_id: integrationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync integration');
    }

    return response.json();
  }
}

export const courierIntegrationsService = new CourierIntegrationsService();
