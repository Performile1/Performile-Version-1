/**
 * WEEK 3: INTEGRATION DASHBOARD
 * Overview of all integrations and their status
 */

import React, { useState } from 'react';
import { Package, Webhook, Key, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import CourierIntegrationSettings from './CourierIntegrationSettings';
import WebhookManagement from './WebhookManagement';
import ApiKeysManagement from './ApiKeysManagement';

type TabType = 'overview' | 'couriers' | 'webhooks' | 'api-keys';

export default function IntegrationDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Activity },
    { id: 'couriers' as TabType, label: 'Courier APIs', icon: Package },
    { id: 'webhooks' as TabType, label: 'Webhooks', icon: Webhook },
    { id: 'api-keys' as TabType, label: 'API Keys', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">
            Manage your courier APIs, webhooks, and API keys
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'couriers' && <CourierIntegrationSettings />}
            {activeTab === 'webhooks' && <WebhookManagement />}
            {activeTab === 'api-keys' && <ApiKeysManagement />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  const stats = [
    {
      label: 'Active Courier APIs',
      value: '0',
      change: '+0%',
      icon: Package,
      color: 'blue'
    },
    {
      label: 'Active Webhooks',
      value: '0',
      change: '+0%',
      icon: Webhook,
      color: 'green'
    },
    {
      label: 'API Keys',
      value: '0',
      change: '+0%',
      icon: Key,
      color: 'purple'
    },
    {
      label: 'API Requests (24h)',
      value: '0',
      change: '+0%',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <span className="text-sm text-green-600 font-medium">
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Start Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Getting Started with Integrations
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium">Set up Courier APIs</p>
                  <p className="text-gray-600">
                    Add your courier API credentials to start tracking shipments
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium">Configure Webhooks</p>
                  <p className="text-gray-600">
                    Create webhooks to receive order updates from your e-commerce platform
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium">Generate API Keys</p>
                  <p className="text-gray-600">
                    Create API keys for programmatic access to Performile
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No recent activity</p>
          <p className="text-sm mt-1">Activity will appear here once you start using integrations</p>
        </div>
      </div>
    </div>
  );
}
