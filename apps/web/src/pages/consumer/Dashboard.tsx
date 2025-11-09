import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Package,
  Truck,
  FileText,
  RotateCcw,
  Star,
  Send,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  activeShipments: number;
  pendingClaims: number;
  c2cShipments: number;
}

const ConsumerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeShipments: 0,
    pendingClaims: 0,
    c2cShipments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.user_role !== 'consumer') {
      navigate('/login');
      return;
    }

    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/consumer/dashboard-stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: Send,
      title: 'Ship Package',
      description: 'Send a package with C2C shipping',
      color: 'bg-blue-500',
      action: () => navigate('/consumer/c2c/create'),
    },
    {
      icon: Package,
      title: 'Track Order',
      description: 'Track your shipments',
      color: 'bg-green-500',
      action: () => navigate('/consumer/orders'),
    },
    {
      icon: AlertCircle,
      title: 'File Claim',
      description: 'Report an issue with delivery',
      color: 'bg-orange-500',
      action: () => navigate('/consumer/claims/create'),
    },
    {
      icon: RotateCcw,
      title: 'Request Return',
      description: 'Return an item',
      color: 'bg-purple-500',
      action: () => navigate('/consumer/returns/create'),
    },
  ];

  const statCards = [
    {
      icon: Package,
      title: 'Total Orders',
      value: stats.totalOrders,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Truck,
      title: 'Active Shipments',
      value: stats.activeShipments,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Send,
      title: 'C2C Shipments',
      value: stats.c2cShipments,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: AlertCircle,
      title: 'Pending Claims',
      value: stats.pendingClaims,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your orders, shipments, and deliveries
              </p>
            </div>
            <button
              onClick={() => navigate('/consumer/c2c/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Send className="h-4 w-4 mr-2" />
              Ship Package
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="relative group bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-4`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500">{action.description}</p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {/* Placeholder for recent activity */}
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No recent activity</p>
                <p className="text-sm mt-1">
                  Your orders and shipments will appear here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumerDashboard;
