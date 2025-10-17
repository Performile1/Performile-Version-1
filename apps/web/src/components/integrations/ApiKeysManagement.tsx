/**
 * WEEK 3: API KEYS MANAGEMENT
 * Manage Performile API keys for merchant access
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, CheckCircle, Eye, EyeOff, Loader, RefreshCw } from 'lucide-react';

interface ApiKey {
  api_key_id: string;
  key_name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit_per_hour: number;
  is_active: boolean;
  total_requests: number;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

export default function ApiKeysManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [formData, setFormData] = useState({
    key_name: '',
    permissions: [] as string[],
    rate_limit_per_hour: 1000,
    expires_in_days: 365
  });

  const availablePermissions = [
    'orders:read',
    'orders:write',
    'tracking:read',
    'webhooks:read',
    'webhooks:write',
    'analytics:read',
    'reviews:read',
    'reviews:write'
  ];

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/week3-integrations/api-keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/week3-integrations/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setNewApiKey(result.api_key);
        await fetchApiKeys();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/week3-integrations/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) return;

    try {
      const response = await fetch(`/api/week3-integrations/api-keys/${id}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setNewApiKey(result.api_key);
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      key_name: '',
      permissions: [],
      rate_limit_per_hour: 1000,
      expires_in_days: 365
    });
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
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
          <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
          <p className="text-gray-600 mt-1">Manage API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create API Key
        </button>
      </div>

      {newApiKey && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Eye className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your new API key
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Make sure to copy your API key now. You won't be able to see it again!
              </p>
              <div className="flex items-center gap-2 p-3 bg-white border border-yellow-300 rounded-lg">
                <code className="flex-1 font-mono text-sm text-gray-900 break-all">
                  {newApiKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newApiKey)}
                  className="flex-shrink-0 p-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  {copiedKey ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setNewApiKey(null)}
                className="mt-3 text-sm text-gray-600 hover:text-gray-900"
              >
                I've saved my API key
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No API keys created yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first API key
            </button>
          </div>
        ) : (
          apiKeys.map((apiKey) => (
            <div
              key={apiKey.api_key_id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {apiKey.key_name}
                    </h3>
                    {apiKey.is_active && !isExpired(apiKey.expires_at) ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        {isExpired(apiKey.expires_at) ? 'Expired' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-600">Key Prefix:</span>
                    <p className="font-mono text-sm text-gray-900">
                      {apiKey.key_prefix}••••••••••••••••
                    </p>
                  </div>

                  <div className="mt-3">
                    <span className="text-xs text-gray-600">Permissions:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {apiKey.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Rate Limit:</span>
                      <p className="font-medium text-gray-900">{apiKey.rate_limit_per_hour}/hour</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Requests:</span>
                      <p className="font-medium text-gray-900">{apiKey.total_requests.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Used:</span>
                      <p className="font-medium text-gray-900">
                        {apiKey.last_used_at 
                          ? new Date(apiKey.last_used_at).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {apiKey.expires_at && (
                    <p className="mt-3 text-xs text-gray-500">
                      {isExpired(apiKey.expires_at) ? 'Expired' : 'Expires'} on: {new Date(apiKey.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleRegenerate(apiKey.api_key_id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(apiKey.api_key_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Revoke"
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
                Create API Key
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.key_name}
                  onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Production API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Limit (requests/hour)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={formData.rate_limit_per_hour}
                    onChange={(e) => setFormData({ ...formData, rate_limit_per_hour: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires In (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={formData.expires_in_days}
                    onChange={(e) => setFormData({ ...formData, expires_in_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
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
                  Create API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
