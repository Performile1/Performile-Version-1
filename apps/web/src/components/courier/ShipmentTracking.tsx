import React, { useState, useEffect } from 'react';
import { Package, MapPin, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { shipmentTrackingService } from '../../services/shipmentTrackingService';

interface ShipmentEvent {
  event_id: string;
  event_type: string;
  event_description?: string;
  event_timestamp: string;
  location_city?: string;
  location_country?: string;
  location_facility?: string;
  status: string;
  is_exception: boolean;
  exception_type?: string;
  exception_description?: string;
}

interface ShipmentTrackingProps {
  orderId: string;
}

export const ShipmentTracking: React.FC<ShipmentTrackingProps> = ({ orderId }) => {
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [orderId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const data = await shipmentTrackingService.getOrderTimeline(orderId);
      setTimeline(data.timeline);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (event: any) => {
    if (event.is_exception) {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
    if (event.status === 'delivered') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (event.type === 'out_for_delivery') {
      return <TrendingUp className="w-5 h-5 text-blue-600" />;
    }
    return <Package className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (event: any) => {
    if (event.is_exception) return 'border-red-500 bg-red-50';
    if (event.status === 'delivered') return 'border-green-500 bg-green-50';
    if (event.type === 'out_for_delivery') return 'border-blue-500 bg-blue-50';
    return 'border-gray-300 bg-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No tracking information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{timeline.order_number}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Tracking: {timeline.tracking_number}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Order Created</div>
            <div className="font-medium text-gray-900">
              {new Date(timeline.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-6">Tracking Timeline</h4>
        
        {timeline.events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tracking events yet
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.events.map((event: any, index: number) => (
              <div
                key={index}
                className={`relative pl-8 pb-4 ${
                  index !== timeline.events.length - 1 ? 'border-l-2 border-gray-200' : ''
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-0 top-0 -ml-2.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${getStatusColor(event)}`}>
                    {getStatusIcon(event)}
                  </div>
                </div>

                {/* Event Content */}
                <div className={`rounded-lg border-2 p-4 ${getStatusColor(event)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 capitalize">
                        {event.type.replace(/_/g, ' ')}
                      </h5>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {/* Exception Details */}
                  {event.is_exception && event.exception_type && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-red-900">
                            Exception: {event.exception_type}
                          </div>
                          {event.exception_description && (
                            <div className="text-sm text-red-700 mt-1">
                              {event.exception_description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Delayed Orders Component
export const DelayedOrders: React.FC = () => {
  const [delayedOrders, setDelayedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDelayedOrders();
  }, []);

  const loadDelayedOrders = async () => {
    try {
      setLoading(true);
      const data = await shipmentTrackingService.getDelayedOrders();
      setDelayedOrders(data.delayed_orders);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load delayed orders');
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Delayed Shipments</h2>
          <p className="text-gray-600 mt-1">
            Orders that haven't had updates in over 7 days
          </p>
        </div>
        <button
          onClick={loadDelayedOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {delayedOrders.length === 0 ? (
        <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No delayed orders!</h3>
          <p className="text-gray-600">All your shipments are on track</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {delayedOrders.map((order) => (
            <div
              key={order.order_id}
              className="bg-white border-l-4 border-l-orange-500 border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Delayed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Courier:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {order.courier_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tracking:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {order.tracking_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Days Since Created:</span>
                      <span className="ml-2 font-medium text-orange-600">
                        {order.days_since_created} days
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Days Since Last Scan:</span>
                      <span className="ml-2 font-medium text-orange-600">
                        {order.days_since_last_scan} days
                      </span>
                    </div>
                    {order.latest_location && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Last Location:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {order.latest_location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => window.location.href = `/orders/${order.order_id}`}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
