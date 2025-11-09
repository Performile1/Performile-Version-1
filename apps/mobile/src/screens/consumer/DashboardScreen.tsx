import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Package, Truck, Send, AlertCircle, TrendingUp } from 'lucide-react-native';

interface DashboardStats {
  totalOrders: number;
  activeShipments: number;
  pendingClaims: number;
  c2cShipments: number;
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeShipments: 0,
    pendingClaims: 0,
    c2cShipments: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: Fetch from API
      // const response = await fetch('/api/consumer/dashboard-stats');
      // const data = await response.json();
      // setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      icon: Send,
      title: 'Ship Package',
      color: '#3b82f6',
      onPress: () => navigation.navigate('Ship' as never),
    },
    {
      icon: Package,
      title: 'Track Order',
      color: '#10b981',
      onPress: () => navigation.navigate('Orders' as never),
    },
    {
      icon: AlertCircle,
      title: 'File Claim',
      color: '#f59e0b',
      onPress: () => navigation.navigate('Claims' as never),
    },
    {
      icon: TrendingUp,
      title: 'View Stats',
      color: '#8b5cf6',
      onPress: () => {},
    },
  ];

  const statCards = [
    {
      icon: Package,
      title: 'Total Orders',
      value: stats.totalOrders,
      color: '#3b82f6',
    },
    {
      icon: Truck,
      title: 'Active Shipments',
      value: stats.activeShipments,
      color: '#10b981',
    },
    {
      icon: Send,
      title: 'C2C Shipments',
      value: stats.c2cShipments,
      color: '#8b5cf6',
    },
    {
      icon: AlertCircle,
      title: 'Pending Claims',
      value: stats.pendingClaims,
      color: '#f59e0b',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}!</Text>
        </View>
        <TouchableOpacity
          style={styles.shipButton}
          onPress={() => navigation.navigate('Ship' as never)}
        >
          <Send color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
              <stat.icon color={stat.color} size={24} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: action.color },
                ]}
              >
                <action.icon color="#fff" size={24} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <Package color="#9ca3af" size={48} />
          <Text style={styles.emptyStateText}>No recent activity</Text>
          <Text style={styles.emptyStateSubtext}>
            Your orders and shipments will appear here
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  shipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
