import React, { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, Power, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { courierIntegrationsService } from '../../services/courierIntegrationsService';

interface CourierIntegration {
  integration_id: string;
  courier_id: string;
  merchant_id: string;
  api_base_url: string;
  api_version?: string;
  auth_type: string;
  is_active: boolean;
  is_sandbox: boolean;
  last_sync_at?: string;
  last_error?: string;
  sync_frequency_minutes: number;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_today: number;
  created_at: string;
  courier?: {
    courier_id: string;
    courier_name: string;
    courier_code: string;
    logo_url?: string;
  };
}

export const CourierIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<CourierIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [syncingIntegration, setSyncingIntegration] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await courierIntegrationsService.listIntegrations();
      setIntegrations(data.integrations);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (integrationId: string, currentStatus: boolean) => {
    try {
      await courierIntegrationsService.updateIntegration(integrationId, {
        is_active: !currentStatus
      });
      await loadIntegrations();
    } catch (err: any) {
      alert(`Failed to toggle integration: ${err.message}`);
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      setTestingIntegration(integrationId);
      const result = await courierIntegrationsService.testIntegration(integrationId);
      
      if (result.success) {
        alert('Connection test successful!');
      } else {
        alert(`Connection test failed: ${result.message}`);
      }
      
      await loadIntegrations();
    } catch (err: any) {
      alert(`Test failed: ${err.message}`);
    } finally {
      setTestingIntegration(null);
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      setSyncingIntegration(integrationId);
      await courierIntegrationsService.syncIntegration(integrationId);
      alert('Sync triggered successfully!');
      await loadIntegrations();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncingIntegration(null);
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return;
    }

    try {
      await courierIntegrationsService.deleteIntegration(integrationId);
      await loadIntegrations();
    } catch (err: any) {
      alert(`Failed to delete integration: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Courier Integrations</h2>
          <p className="text-gray-600 mt-1">
            Manage your courier API integrations for automated tracking
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Integration
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Integrations List */}
      {integrations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
          <p className="text-gray-600 mb-4">
            Connect your courier APIs to enable automated tracking and notifications
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Integration
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.integration_id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Left: Courier Info */}
                <div className="flex items-start gap-4 flex-1">
                  {integration.courier?.logo_url && (
                    <img
                      src={integration.courier.logo_url}
                      alt={integration.courier.courier_name}
                      className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {integration.courier?.courier_name || 'Unknown Courier'}
                      </h3>
                      {integration.is_active ? (
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
                      {integration.is_sandbox && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          Sandbox
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Auth Type:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {integration.auth_type}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">API Version:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {integration.api_version || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sync Frequency:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          Every {integration.sync_frequency_minutes} min
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Requests Today:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {integration.requests_today} / {integration.requests_per_hour}
                        </span>
                      </div>
                      {integration.last_sync_at && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Last Sync:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {new Date(integration.last_sync_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {integration.last_error && (
                        <div className="col-span-2">
                          <span className="text-red-600 text-xs">
                            Error: {integration.last_error}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(integration.integration_id, integration.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      integration.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={integration.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Power className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleTestConnection(integration.integration_id)}
                    disabled={testingIntegration === integration.integration_id}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                    title="Test Connection"
                  >
                    {testingIntegration === integration.integration_id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSync(integration.integration_id)}
                    disabled={syncingIntegration === integration.integration_id}
                    className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                    title="Sync Now"
                  >
                    {syncingIntegration === integration.integration_id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(integration.integration_id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Integration Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Add Courier Integration</h3>
            <p className="text-gray-600 mb-4">
              Integration form coming soon. For now, please contact support to set up your courier API integration.
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
