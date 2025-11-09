import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Search,
  Eye,
  RotateCcw,
  AlertCircle,
} from 'lucide-react-native';

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
}

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, orders]);

  const fetchOrders = async () => {
    try {
      // TODO: Fetch from API
      // const response = await fetch('/api/consumer/orders');
      // const data = await response.json();
      // setOrders(data);
      
      // Mock data
      setOrders([]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (!searchQuery) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.merchant_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return CheckCircle;
      case 'in_transit':
        return Truck;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#10b981';
      case 'in_transit':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const StatusIcon = getStatusIcon(item.status);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() =>
          navigation.navigate('OrderDetail' as never, { orderId: item.order_id } as never)
        }
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={[styles.statusIcon, { backgroundColor: statusColor + '20' }]}>
              <StatusIcon color={statusColor} size={20} />
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.orderNumber}>#{item.order_number}</Text>
              <Text style={styles.merchantName}>{item.merchant_name}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.orderMeta}>
          <View style={styles.metaRow}>
            <Truck color="#6b7280" size={16} />
            <Text style={styles.metaText}>{item.courier_name}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin color="#6b7280" size={16} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.delivery_address}
            </Text>
          </View>
        </View>

        {item.tracking_number && (
          <View style={styles.trackingContainer}>
            <Text style={styles.trackingLabel}>Tracking</Text>
            <Text style={styles.trackingNumber}>{item.tracking_number}</Text>
          </View>
        )}

        <View style={styles.orderFooter}>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('Tracking' as never, { orderId: item.order_id } as never)
              }
            >
              <Eye color="#3b82f6" size={16} />
              <Text style={styles.actionButtonText}>Track</Text>
            </TouchableOpacity>
            
            {/* Show Return button only for delivered orders */}
            {item.status === 'delivered' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.returnButton]}
                onPress={() =>
                  navigation.navigate('CreateReturn' as never, { orderId: item.order_id } as never)
                }
              >
                <RotateCcw color="#10b981" size={16} />
                <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Return</Text>
              </TouchableOpacity>
            )}
            
            {/* Show Claim button for all orders */}
            <TouchableOpacity
              style={[styles.actionButton, styles.claimButton]}
              onPress={() =>
                navigation.navigate('Claims' as never, { orderId: item.order_id } as never)
              }
            >
              <AlertCircle color="#f59e0b" size={16} />
              <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>Claim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Package color="#9ca3af" size={64} />
      <Text style={styles.emptyTitle}>No orders found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Your orders will appear here once you make a purchase'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>Track and manage your deliveries</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search color="#6b7280" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.order_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  merchantName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderMeta: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  trackingContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  trackingLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'monospace',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  orderDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 4,
  },
  returnButton: {
    borderColor: '#10b981',
  },
  claimButton: {
    borderColor: '#f59e0b',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
