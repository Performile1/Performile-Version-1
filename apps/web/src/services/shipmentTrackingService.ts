import { authStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ShipmentTrackingService {
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

  async getOrderEvents(orderId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/shipment-tracking?action=events&order_id=${orderId}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch events');
    }

    return response.json();
  }

  async getLatestEvent(orderId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/shipment-tracking?action=latest&order_id=${orderId}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch latest event');
    }

    return response.json();
  }

  async getOrderTimeline(orderId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/shipment-tracking?action=timeline&order_id=${orderId}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch timeline');
    }

    return response.json();
  }

  async addTrackingEvent(data: {
    order_id: string;
    tracking_number: string;
    event_type: string;
    event_timestamp: string;
    status: string;
    event_code?: string;
    event_description?: string;
    location_city?: string;
    location_country?: string;
    location_postal_code?: string;
    location_facility?: string;
    substatus?: string;
    is_exception?: boolean;
    exception_type?: string;
    exception_description?: string;
    raw_event_data?: any;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/shipment-tracking?action=add_event`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add tracking event');
    }

    return response.json();
  }

  async getExceptions(limit = 50, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/api/shipment-tracking?action=exceptions&limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch exceptions');
    }

    return response.json();
  }

  async getDelayedOrders() {
    const response = await fetch(
      `${API_BASE_URL}/api/shipment-tracking?action=delayed_orders`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch delayed orders');
    }

    return response.json();
  }
}

export const shipmentTrackingService = new ShipmentTrackingService();
