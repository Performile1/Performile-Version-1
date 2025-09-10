// Frontend type definitions for Performile

export interface User {
  user_id: string;
  email: string;
  user_role: 'admin' | 'merchant' | 'courier' | 'consumer';
  subscription_tier?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_role: 'merchant' | 'courier' | 'consumer';
  phone?: string;
}

export interface TrustScore {
  courier_id: string;
  courier_name: string;
  total_reviews: number;
  average_rating: number;
  weighted_rating: number;
  completion_rate: number;
  on_time_rate: number;
  response_time_avg: number;
  customer_satisfaction_score: number;
  issue_resolution_rate: number;
  delivery_attempt_avg: number;
  last_mile_performance: number;
  trust_score: number;
  total_orders: number;
  completed_orders: number;
  on_time_deliveries: number;
  last_calculated: string;
}

export interface CourierDashboard extends TrustScore {
  description?: string;
  logo_url?: string;
  contact_email?: string;
  service_areas?: string[];
  performance_grade: string;
  reliability_grade: string;
  recent_orders: number;
  avg_delivery_hours: number;
}

export interface Order {
  order_id: string;
  tracking_number: string;
  store_id: string;
  courier_id: string;
  consumer_id?: string;
  order_number?: string;
  order_date: string;
  delivery_date?: string;
  estimated_delivery?: string;
  level_of_service?: string;
  type_of_delivery?: string;
  postal_code?: string;
  country: string;
  delivery_address?: string;
  order_status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';
  is_reviewed: boolean;
  review_link_token?: string;
  first_response_time?: string;
  issue_reported: boolean;
  issue_resolved: boolean;
  issue_resolution_time?: string;
  delivery_attempts: number;
  last_mile_duration?: string;
}

export interface Review {
  review_id: string;
  order_id: string;
  reviewer_user_id?: string;
  rating: number;
  on_time_delivery_score?: number;
  package_condition_score?: number;
  communication_score?: number;
  delivery_person_score?: number;
  review_text?: string;
  delay_minutes: number;
  sentiment: string;
  needs_evaluation: boolean;
  review_date: string;
}

export interface Store {
  store_id: string;
  store_name: string;
  owner_user_id: string;
  subscription_plan_id?: string;
  website_url?: string;
  description?: string;
  logo_url?: string;
  custom_css?: string;
  market_settings: Record<string, any>;
  integration_limits: Record<string, any>;
  is_active: boolean;
}

export interface Courier {
  courier_id: string;
  courier_name: string;
  user_id: string;
  subscription_plan_id?: string;
  description?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  service_areas: string[];
  market_settings: Record<string, any>;
  is_active: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TrustScoreFilters {
  country?: string;
  postal_code?: string;
  min_reviews?: number;
  courier_id?: string;
}

export interface DashboardStats {
  total_couriers: number;
  avg_trust_score: number;
  avg_on_time_rate: number;
  avg_completion_rate: number;
  total_orders_processed: number;
  total_reviews_count: number;
}

export interface TrendData {
  date: string;
  orders_count: number;
  completed_count: number;
  on_time_count: number;
  on_time_rate: number;
  avg_rating: number;
}

export interface ComparisonData {
  couriers: CourierDashboard[];
  comparison_metrics: {
    highest_trust_score: number;
    lowest_trust_score: number;
    avg_trust_score: number;
    highest_on_time_rate: number;
    lowest_on_time_rate: number;
    most_reviews: number;
    least_reviews: number;
  };
}

// Theme and UI types
export interface Theme {
  palette: {
    mode: 'light' | 'dark';
    primary: {
      main: string;
      light: string;
      dark: string;
    };
    secondary: {
      main: string;
      light: string;
      dark: string;
    };
    background: {
      default: string;
      paper: string;
    };
  };
}

import React from 'react';

export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ComponentType;
  roles: string[];
  children?: NavigationItem[];
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'number' | 'date';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
}

// Error types
export interface AppError {
  message: string;
  statusCode?: number;
  field?: string;
}

// Subscription types
export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  user_role: string;
  price_monthly: number;
  price_yearly: number;
  features_json: Record<string, any>;
  limits_json: Record<string, any>;
  is_active: boolean;
}

export interface UserSubscription {
  subscription_id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: string;
  end_date?: string;
  auto_renew: boolean;
  payment_method_id?: string;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  [key: string]: string | number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}
