import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Package, Home, User, Send, FileText } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/consumer/DashboardScreen';
import OrdersScreen from './src/screens/consumer/OrdersScreen';
import OrderDetailScreen from './src/screens/consumer/OrderDetailScreen';
import TrackingScreen from './src/screens/consumer/TrackingScreen';
import C2CCreateScreen from './src/screens/consumer/C2CCreateScreen';
import ClaimsScreen from './src/screens/consumer/ClaimsScreen';
import ProfileScreen from './src/screens/consumer/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ConsumerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Ship"
        component={C2CCreateScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Send color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Claims"
        component={ClaimsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if access token exists
      const accessToken = await AsyncStorage.getItem('accessToken');
      const user = await AsyncStorage.getItem('user');
      
      if (accessToken && user) {
        const userData = JSON.parse(user);
        
        // Validate user is a consumer
        if (userData.user_role === 'consumer') {
          setIsAuthenticated(true);
        } else {
          // Clear storage if not a consumer
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Or loading screen
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={ConsumerTabs} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
