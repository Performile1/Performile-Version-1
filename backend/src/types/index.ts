// Type definitions for Performile Backend API

export interface User {
  user_id: string;
  email: string;
  user_role: 'admin' | 'merchant' | 'courier' | 'consumer';
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

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

export interface Order {
  order_id: string;
  tracking_number: string;
  store_id: string;
  courier_id: string;
  consumer_id?: string;
  order_number?: string;
  order_date: Date;
  delivery_date?: Date;
  estimated_delivery?: Date;
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
  review_date: Date;
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
  last_calculated: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterQuery {
  country?: string;
  postal_code?: string;
  min_reviews?: number;
  courier_id?: string;
  store_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface RequestWithUser extends Request {
  user?: User;
}

// Database connection types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Redis configuration
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

// Email configuration
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

// Validation schemas
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_role: 'merchant' | 'courier' | 'consumer';
  phone?: string;
}

export interface CreateOrderRequest {
  tracking_number: string;
  store_id: string;
  courier_id: string;
  consumer_id?: string;
  order_number?: string;
  estimated_delivery?: string;
  level_of_service?: string;
  type_of_delivery?: string;
  postal_code?: string;
  country?: string;
  delivery_address?: string;
}

export interface CreateReviewRequest {
  order_id: string;
  rating: number;
  on_time_delivery_score?: number;
  package_condition_score?: number;
  communication_score?: number;
  delivery_person_score?: number;
  review_text?: string;
  delay_minutes?: number;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
}

// Middleware types
export interface StrictAuthenticatedRequest extends Request {
  user: User;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Integration types
export interface Integration {
  integration_id: string;
  user_id: string;
  integration_type: 'payment' | 'ecommerce' | 'transport' | 'analytics';
  provider_name: string;
  api_key_encrypted?: string;
  settings_json: Record<string, any>;
  is_active: boolean;
  last_sync?: Date;
}

// Subscription types
export interface UserSubscription {
  subscription_id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: Date;
  end_date?: Date;
  auto_renew: boolean;
  payment_method_id?: string;
}

