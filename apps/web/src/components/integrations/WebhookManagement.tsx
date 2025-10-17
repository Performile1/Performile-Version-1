/**
 * WEEK 3: WEBHOOK MANAGEMENT
 * Manage incoming webhooks from e-commerce platforms
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, CheckCircle, XCircle, Loader } from 'lucide-react';

interface Webhook {
  webhook_id: string;
  platform_name: string;
  webhook_url: string;
  webhook_secret: string;
  event_types: string[];
  is_active: boolean;
  total_orders_synced: number;
  total_deliveries: number;
  failed_deliveries: number;
  last_sync_at?: string;
  last_triggered_at?: string;
  sync_status?: string;
  created_at: string;
}

export default function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    platform_name: '',
    platform_url: '',
    event_types: [] as string[],
  });

  const availableEventTypes = [
    'order.created',
    'order.updated',
    'order.fulfilled',
    'order.cancelled',
    'shipment.created',
    'shipment.updated',
    'shipment.delivered'
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/week3-integrations/webhooks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingWebhook
        ? `/api/week3-integrations/webhooks/${editingWebhook.webhook_id}`
        : '/api/week3-integrations/webhooks';
      
      const method = editingWebhook ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchWebhooks();
        setShowAddModal(false);
        setEditingWebhook(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save webhook:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/week3-integrations/webhooks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await fetchWebhooks();
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSecret(id);
      setTimeout(() => setCopiedSecret(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      platform_name: '',
      platform_url: '',
      event_types: [],
    });
  };

  const openEditModal = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      platform_name: webhook.platform_name,
      platform_url: '',
      event_types: webhook.event_types,
    });
    setShowAddModal(true);
  };

  const toggleEventType = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter(e => e !== eventType)
        : [...prev.event_types, eventType]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Webhook Management</h2>
          <p className="text-gray-600 mt-1">Manage incoming webhooks from e-commerce platforms</p>
        </div>
        <button
          onClick={() => {
            setEditingWebhook(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Webhook
        </button>
      </div>

      <div className="grid gap-4">
        {webhooks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No webhooks configured yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first webhook
            </button>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div
              key={webhook.webhook_id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {webhook.platform_name}
                    </h3>
                    {webhook.is_active ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-xs text-gray-600">Webhook URL:</span>
                        <p className="font-mono text-sm text-gray-900 break-all">
                          {webhook.webhook_url}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(webhook.webhook_url, `url-${webhook.webhook_id}`)}
                        className="ml-2 p-2 text-gray-600 hover:bg-gray-200 rounded"
                      >
                        {copiedSecret === `url-${webhook.webhook_id}` ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-xs text-gray-600">Webhook Secret:</span>
                        <p className="font-mono text-sm text-gray-900">
                          {webhook.webhook_secret.substring(0, 20)}...
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(webhook.webhook_secret, `secret-${webhook.webhook_id}`)}
                        className="ml-2 p-2 text-gray-600 hover:bg-gray-200 rounded"
                      >
                        {copiedSecret === `secret-${webhook.webhook_id}` ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-xs text-gray-600">Event Types:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {webhook.event_types.map((eventType) => (
                        <span
                          key={eventType}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded"
                        >
                          {eventType}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Orders:</span>
                      <p className="font-medium text-gray-900">{webhook.total_orders_synced}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Deliveries:</span>
                      <p className="font-medium text-gray-900">{webhook.total_deliveries}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Failed:</span>
                      <p className="font-medium text-red-600">{webhook.failed_deliveries}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(webhook)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.webhook_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingWebhook ? 'Edit' : 'Add'} Webhook
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.platform_name}
                  onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Shopify, WooCommerce, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform URL
                </label>
                <input
                  type="url"
                  value={formData.platform_url}
                  onChange={(e) => setFormData({ ...formData, platform_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourstore.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Types *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEventTypes.map((eventType) => (
                    <label
                      key={eventType}
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.event_types.includes(eventType)}
                        onChange={() => toggleEventType(eventType)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{eventType}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingWebhook(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingWebhook ? 'Update' : 'Create'} Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
