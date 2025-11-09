import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Search,
  Filter,
  Eye,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

interface Order {
  order_id: string;
  order_number: string;
  merchant_name: string;
  courier_name: string;
  tracking_number: string;
  status: string;
  delivery_address: string;
  estimated_delivery: string;
  created_at: string;
  total_items: number;
}

const ConsumerOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.user_role !== 'consumer') {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/consumer/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.merchant_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || order.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track and manage your deliveries
              </p>
            </div>
            <button
              onClick={() => navigate('/consumer/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by order number, tracking, or merchant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Your orders will appear here once you make a purchase'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.order_id}
                className="bg-white shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Order #{order.order_number}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {order.merchant_name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{order.courier_name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        Est. {new Date(order.estimated_delivery).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {order.tracking_number && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                      <p className="text-sm font-mono text-gray-900">
                        {order.tracking_number}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Ordered on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/consumer/orders/${order.order_id}`)}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        Track
                      </button>
                      
                      {/* Show Return button only for delivered orders */}
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => navigate(`/consumer/returns/create?orderId=${order.order_id}`)}
                          className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          title="Request a return"
                        >
                          <RotateCcw className="h-4 w-4 mr-1.5" />
                          Return
                        </button>
                      )}
                      
                      {/* Show Claim button for all orders */}
                      <button
                        onClick={() => navigate(`/consumer/claims/create?orderId=${order.order_id}`)}
                        className="inline-flex items-center px-3 py-1.5 border border-amber-300 shadow-sm text-sm font-medium rounded-md text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        title="File a claim"
                      >
                        <AlertCircle className="h-4 w-4 mr-1.5" />
                        Claim
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerOrders;
