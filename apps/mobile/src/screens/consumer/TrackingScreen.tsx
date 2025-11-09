import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRoute } from '@react-navigation/native';
import {
  Package,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  Phone,
  Mail,
} from 'lucide-react-native';

interface TrackingEvent {
  event_id: string;
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

interface TrackingData {
  order_id: string;
  tracking_number: string;
  status: string;
  courier_name: string;
  estimated_delivery: string;
  current_location: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  events: TrackingEvent[];
}

export default function TrackingScreen() {
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackingData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchTrackingData, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      // TODO: Fetch from API
      // const response = await fetch(`/api/consumer/tracking/${orderId}`);
      // const data = await response.json();
      // setTracking(data);
      
      // Mock data for now
      setTracking({
        order_id: orderId,
        tracking_number: 'TRK123456789',
        status: 'in_transit',
        courier_name: 'PostNord',
        estimated_delivery: '2025-11-10T14:00:00Z',
        current_location: {
          latitude: 59.9139,
          longitude: 10.7522,
        },
        destination: {
          latitude: 59.9127,
          longitude: 10.7461,
          address: 'Karl Johans gate 1, 0154 Oslo',
        },
        events: [
          {
            event_id: '1',
            status: 'picked_up',
            location: 'Oslo Distribution Center',
            timestamp: '2025-11-09T08:00:00Z',
            description: 'Package picked up',
          },
          {
            event_id: '2',
            status: 'in_transit',
            location: 'Oslo Central',
            timestamp: '2025-11-09T10:30:00Z',
            description: 'In transit to destination',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrackingData();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'in_transit':
        return Truck;
      case 'picked_up':
        return Package;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#10b981';
      case 'in_transit':
        return '#3b82f6';
      case 'picked_up':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  if (loading || !tracking) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading tracking information...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: tracking.current_location.latitude,
            longitude: tracking.current_location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Current Location Marker */}
          <Marker
            coordinate={tracking.current_location}
            title="Current Location"
            description="Package is here"
          >
            <View style={styles.currentMarker}>
              <Truck color="#fff" size={20} />
            </View>
          </Marker>

          {/* Destination Marker */}
          <Marker
            coordinate={tracking.destination}
            title="Destination"
            description={tracking.destination.address}
          >
            <View style={styles.destinationMarker}>
              <MapPin color="#fff" size={20} />
            </View>
          </Marker>

          {/* Route Line */}
          <Polyline
            coordinates={[tracking.current_location, tracking.destination]}
            strokeColor="#3b82f6"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        </MapView>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View
            style={[
              styles.statusIconContainer,
              { backgroundColor: getStatusColor(tracking.status) },
            ]}
          >
            {React.createElement(getStatusIcon(tracking.status), {
              color: '#fff',
              size: 24,
            })}
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {tracking.status.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.courierName}>{tracking.courier_name}</Text>
          </View>
        </View>

        <View style={styles.trackingInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tracking Number</Text>
            <Text style={styles.infoValue}>{tracking.tracking_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Delivery</Text>
            <Text style={styles.infoValue}>
              {new Date(tracking.estimated_delivery).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Destination</Text>
            <Text style={styles.infoValue}>{tracking.destination.address}</Text>
          </View>
        </View>

        {/* Contact Buttons */}
        <View style={styles.contactButtons}>
          <TouchableOpacity style={styles.contactButton}>
            <Phone color="#3b82f6" size={20} />
            <Text style={styles.contactButtonText}>Call Courier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <Mail color="#3b82f6" size={20} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tracking Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Tracking History</Text>
        <View style={styles.timeline}>
          {tracking.events.map((event, index) => (
            <View key={event.event_id} style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View
                  style={[
                    styles.timelineIcon,
                    { backgroundColor: getStatusColor(event.status) },
                  ]}
                >
                  {React.createElement(getStatusIcon(event.status), {
                    color: '#fff',
                    size: 16,
                  })}
                </View>
                {index < tracking.events.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStatus}>
                  {event.status.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.timelineDescription}>{event.description}</Text>
                <Text style={styles.timelineLocation}>{event.location}</Text>
                <Text style={styles.timelineTimestamp}>
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#e5e7eb',
  },
  map: {
    flex: 1,
  },
  currentMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  courierName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  trackingInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  timelineCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  timelineLocation: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  timelineTimestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
