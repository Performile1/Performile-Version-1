import { supabase } from '../config/supabase';

interface TrustScoreMetrics {
  avgRating: number;
  onTimeRate: number;
  completionRate: number;
  totalOrders: number;
  totalReviews: number;
  avgDeliverySpeed: number;
  avgPackageCondition: number;
  avgCommunication: number;
  trustScore: number;
}

/**
 * Calculate average rating from reviews
 */
function calculateAverageRating(reviews: any[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
  return sum / reviews.length;
}

/**
 * Calculate on-time delivery rate
 */
function calculateOnTimeRate(orders: any[]): number {
  const deliveredOrders = orders.filter(o => o.order_status === 'delivered');
  if (deliveredOrders.length === 0) return 0;
  
  const onTimeOrders = deliveredOrders.filter(o => {
    if (!o.delivery_date || !o.estimated_delivery) return false;
    return new Date(o.delivery_date) <= new Date(o.estimated_delivery);
  });
  
  return (onTimeOrders.length / deliveredOrders.length) * 100;
}

/**
 * Calculate order completion rate
 */
function calculateCompletionRate(orders: any[]): number {
  if (orders.length === 0) return 0;
  const completedOrders = orders.filter(o => o.order_status === 'delivered');
  return (completedOrders.length / orders.length) * 100;
}

/**
 * Calculate average delivery speed (in days)
 */
function calculateAvgDeliverySpeed(orders: any[]): number {
  const deliveredOrders = orders.filter(o => 
    o.order_status === 'delivered' && o.order_date && o.delivery_date
  );
  
  if (deliveredOrders.length === 0) return 0;
  
  const totalDays = deliveredOrders.reduce((sum, order) => {
    const orderDate = new Date(order.order_date);
    const deliveryDate = new Date(order.delivery_date);
    const days = (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);
  
  return totalDays / deliveredOrders.length;
}

/**
 * Calculate average package condition rating
 */
function calculateAvgPackageCondition(reviews: any[]): number {
  const reviewsWithRating = reviews.filter(r => r.package_condition_rating);
  if (reviewsWithRating.length === 0) return 0;
  
  const sum = reviewsWithRating.reduce((acc, r) => acc + r.package_condition_rating, 0);
  return sum / reviewsWithRating.length;
}

/**
 * Calculate average communication rating
 */
function calculateAvgCommunication(reviews: any[]): number {
  const reviewsWithRating = reviews.filter(r => r.communication_rating);
  if (reviewsWithRating.length === 0) return 0;
  
  const sum = reviewsWithRating.reduce((acc, r) => acc + r.communication_rating, 0);
  return sum / reviewsWithRating.length;
}

/**
 * Calculate trust score for a courier
 * Trust Score = (avgRating/5 * 40) + (onTimeRate * 0.3) + (completionRate * 0.3)
 */
export async function calculateTrustScore(courierId: string): Promise<TrustScoreMetrics> {
  try {
    // Get all reviews for courier
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('courier_id', courierId);
    
    if (reviewsError) throw reviewsError;
    
    // Get all orders for courier
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('courier_id', courierId);
    
    if (ordersError) throw ordersError;
    
    // Calculate metrics
    const avgRating = calculateAverageRating(reviews || []);
    const onTimeRate = calculateOnTimeRate(orders || []);
    const completionRate = calculateCompletionRate(orders || []);
    const totalOrders = orders?.length || 0;
    const totalReviews = reviews?.length || 0;
    const avgDeliverySpeed = calculateAvgDeliverySpeed(orders || []);
    const avgPackageCondition = calculateAvgPackageCondition(reviews || []);
    const avgCommunication = calculateAvgCommunication(reviews || []);
    
    // Calculate weighted trust score (0-100)
    const trustScore = (
      (avgRating / 5) * 40 +  // 40% weight on rating
      onTimeRate * 0.3 +       // 30% weight on on-time delivery
      completionRate * 0.3     // 30% weight on completion rate
    );
    
    // Get courier details
    const { data: courier } = await supabase
      .from('couriers')
      .select('courier_name')
      .eq('courier_id', courierId)
      .single();
    
    // Update courier_analytics
    const { error: analyticsError } = await supabase
      .from('courier_analytics')
      .upsert({
        courier_id: courierId,
        courier_name: courier?.courier_name,
        total_orders: totalOrders,
        delivered_orders: orders?.filter(o => o.order_status === 'delivered').length || 0,
        in_transit_orders: orders?.filter(o => o.order_status === 'in_transit').length || 0,
        pending_orders: orders?.filter(o => o.order_status === 'pending').length || 0,
        cancelled_orders: orders?.filter(o => o.order_status === 'cancelled').length || 0,
        completion_rate: completionRate,
        on_time_rate: onTimeRate,
        total_reviews: totalReviews,
        avg_rating: avgRating,
        trust_score: trustScore,
        avg_delivery_days: avgDeliverySpeed,
        last_calculated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'courier_id'
      });
    
    if (analyticsError) {
      console.error('Error updating courier_analytics:', analyticsError);
    }
    
    // Update trustscorecache
    const { error: cacheError } = await supabase
      .from('trustscorecache')
      .upsert({
        courier_id: courierId,
        overall_score: trustScore,
        avg_delivery_speed: avgDeliverySpeed,
        avg_package_condition: avgPackageCondition,
        avg_communication: avgCommunication,
        total_reviews: totalReviews,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'courier_id'
      });
    
    if (cacheError) {
      console.error('Error updating trustscorecache:', cacheError);
    }
    
    return {
      avgRating,
      onTimeRate,
      completionRate,
      totalOrders,
      totalReviews,
      avgDeliverySpeed,
      avgPackageCondition,
      avgCommunication,
      trustScore
    };
  } catch (error) {
    console.error('Error calculating trust score:', error);
    throw error;
  }
}

/**
 * Get trust score from cache
 */
export async function getTrustScore(courierId: string) {
  const { data, error } = await supabase
    .from('trustscorecache')
    .select('*')
    .eq('courier_id', courierId)
    .single();
  
  if (error) {
    // If not in cache, calculate it
    if (error.code === 'PGRST116') {
      await calculateTrustScore(courierId);
      return getTrustScore(courierId);
    }
    throw error;
  }
  
  return data;
}

/**
 * Get courier analytics
 */
export async function getCourierAnalytics(courierId: string) {
  const { data, error } = await supabase
    .from('courier_analytics')
    .select('*')
    .eq('courier_id', courierId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      await calculateTrustScore(courierId);
      return getCourierAnalytics(courierId);
    }
    throw error;
  }
  
  return data;
}

/**
 * Get leaderboard (top couriers by trust score)
 */
export async function getLeaderboard(limit: number = 50) {
  const { data, error } = await supabase
    .from('trustscorecache')
    .select(`
      *,
      couriers (
        courier_name,
        logo_url,
        courier_code
      )
    `)
    .order('overall_score', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data;
}

/**
 * Recalculate trust scores for all active couriers
 */
export async function recalculateAllTrustScores() {
  const { data: couriers, error } = await supabase
    .from('couriers')
    .select('courier_id')
    .eq('is_active', true);
  
  if (error) throw error;
  
  const results = [];
  for (const courier of couriers || []) {
    try {
      const metrics = await calculateTrustScore(courier.courier_id);
      results.push({ courier_id: courier.courier_id, success: true, metrics });
    } catch (err) {
      results.push({ courier_id: courier.courier_id, success: false, error: err });
    }
  }
  
  return results;
}
