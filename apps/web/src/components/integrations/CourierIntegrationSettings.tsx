/**
 * WEEK 3: COURIER INTEGRATION SETTINGS
 * Manage courier API credentials
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Loader } from 'lucide-react';

interface CourierCredential {
  credential_id: string;
  courier_name: string;
  base_url: string;
  api_version?: string;
  rate_limit_per_minute: number;
  is_active: boolean;
  total_requests: number;
  failed_requests: number;
  last_used?: string;
  created_at: string;
}

export default function CourierIntegrationSettings() {
  const [credentials, setCredentials] = useState<CourierCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<CourierCredential | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    courier_name: '',
    api_key: '',
    api_secret: '',
    client_id: '',
    client_secret: '',
    base_url: '',
    api_version: '',
    rate_limit_per_minute: 60
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/week3-integrations/courier-credentials', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCredential
        ? `/api/week3-integrations/courier-credentials/${editingCredential.credential_id}`
        : '/api/week3-integrations/courier-credentials';
      
      const method = editingCredential ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCredentials();
        setShowAddModal(false);
        setEditingCredential(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save credential:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;

    try {
      const response = await fetch(`/api/week3-integrations/courier-credentials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await fetchCredentials();
      }
    } catch (error) {
      console.error('Failed to delete credential:', error);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    
    try {
      const response = await fetch(`/api/week3-integrations/courier-credentials/${id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Connection test successful!\n${result.message}`);
      } else {
        alert(`❌ Connection test failed!\n${result.error}`);
      }
    } catch (error) {
      alert('❌ Connection test failed!');
    } finally {
      setTestingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      courier_name: '',
      api_key: '',
      api_secret: '',
      client_id: '',
      client_secret: '',
      base_url: '',
      api_version: '',
      rate_limit_per_minute: 60
    });
  };

  const openEditModal = (credential: CourierCredential) => {
    setEditingCredential(credential);
    setFormData({
      courier_name: credential.courier_name,
      api_key: '',
      api_secret: '',
      client_id: '',
      client_secret: '',
      base_url: credential.base_url,
      api_version: credential.api_version || '',
      rate_limit_per_minute: credential.rate_limit_per_minute
    });
    setShowAddModal(true);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Courier Integrations</h2>
          <p className="text-gray-600 mt-1">Manage API credentials for courier services</p>
        </div>
        <button
          onClick={() => {
            setEditingCredential(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Courier
        </button>
      </div>

      {/* Credentials List */}
      <div className="grid gap-4">
        {credentials.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No courier integrations configured yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first courier integration
            </button>
          </div>
        ) : (
          credentials.map((credential) => (
            <div
              key={credential.credential_id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {credential.courier_name}
                    </h3>
                    {credential.is_active ? (
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
                  
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Base URL:</span>
                      <p className="font-medium text-gray-900">{credential.base_url}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">API Version:</span>
                      <p className="font-medium text-gray-900">{credential.api_version || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate Limit:</span>
                      <p className="font-medium text-gray-900">{credential.rate_limit_per_minute} req/min</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Requests:</span>
                      <p className="font-medium text-gray-900">
                        {credential.total_requests.toLocaleString()}
                        {credential.failed_requests > 0 && (
                          <span className="text-red-600 ml-2">
                            ({credential.failed_requests} failed)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {credential.last_used && (
                    <p className="mt-3 text-xs text-gray-500">
                      Last used: {new Date(credential.last_used).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleTest(credential.credential_id)}
                    disabled={testingId === credential.credential_id}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Test Connection"
                  >
                    {testingId === credential.credential_id ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(credential)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(credential.credential_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingCredential ? 'Edit' : 'Add'} Courier Integration
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Courier Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.courier_name}
                  onChange={(e) => setFormData({ ...formData, courier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., DHL, FedEx, UPS"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={formData.client_secret}
                    onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://api.courier.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Version
                  </label>
                  <input
                    type="text"
                    value={formData.api_version}
                    onChange={(e) => setFormData({ ...formData, api_version: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="v1, v2, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Limit (req/min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rate_limit_per_minute}
                    onChange={(e) => setFormData({ ...formData, rate_limit_per_minute: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCredential(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCredential ? 'Update' : 'Add'} Courier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
