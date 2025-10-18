/**
 * Claims CRUD API v2
 * Manages claims with new schema from Phase 1
 * 
 * Phase: Dashboard Analytics - Phase 1.6
 * Created: October 18, 2025, 7:21 PM
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Get subscription tier limits
const getTierLimits = (tier: string = 'tier1') => {
  switch (tier) {
    case 'tier1':
      return { maxClaims: 10, canUpdate: false };
    case 'tier2':
      return { maxClaims: 50, canUpdate: true };
    case 'tier3':
      return { maxClaims: 1000, canUpdate: true };
    default:
      return { maxClaims: 10, canUpdate: false };
  }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Get user from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Missing or invalid token'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid token'
      });
    }

    // Get user details and subscription tier
    const { data: userData } = await supabase
      .from('users')
      .select('user_id, user_role, subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userTier = userData.subscription_tier || 'tier1';
    const limits = getTierLimits(userTier);

    // Route to appropriate handler
    switch (req.method) {
      case 'GET':
        return await getClaims(req, res, userData, limits);
      case 'POST':
        return await createClaim(req, res, userData, limits);
      case 'PUT':
        return await updateClaim(req, res, userData, limits);
      case 'DELETE':
        return await deleteClaim(req, res, userData, limits);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error: any) {
    console.error('Claims API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET - List claims
async function getClaims(req: VercelRequest, res: VercelResponse, user: any, limits: any) {
  const { 
    entity_type, 
    entity_id, 
    status, 
    search, 
    page = '1', 
    limit = '10' 
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), limits.maxClaims);
  const offset = (pageNum - 1) * limitNum;

  // Build query
  let query = supabase
    .from('claims')
    .select('*', { count: 'exact' });

  // Filter by entity
  if (entity_type === 'courier') {
    query = query.eq('courier_id', entity_id || user.user_id);
  } else if (entity_type === 'merchant') {
    query = query.eq('merchant_id', entity_id || user.user_id);
  } else {
    // Default: show user's own claims
    if (user.user_role === 'courier') {
      const { data: courierData } = await supabase
        .from('couriers')
        .select('courier_id')
        .eq('user_id', user.user_id)
        .single();
      
      if (courierData) {
        query = query.eq('courier_id', courierData.courier_id);
      }
    } else if (user.user_role === 'merchant') {
      query = query.eq('merchant_id', user.user_id);
    }
  }

  // Filter by status
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Search by order_id
  if (search) {
    query = query.ilike('order_id', `%${search}%`);
  }

  // Pagination
  query = query
    .range(offset, offset + limitNum - 1)
    .order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch claims',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  return res.status(200).json({
    success: true,
    data: data || [],
    total: count || 0,
    page: pageNum,
    limit: limitNum,
    meta: {
      tier: user.subscription_tier,
      max_claims: limits.maxClaims,
      can_update: limits.canUpdate
    }
  });
}

// POST - Create claim
async function createClaim(req: VercelRequest, res: VercelResponse, user: any, limits: any) {
  const {
    order_id,
    claim_type,
    title,
    description,
    claim_amount,
    evidence_urls,
    priority = 'medium'
  } = req.body;

  // Validation
  if (!order_id || !claim_type || !title || !claim_amount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: order_id, claim_type, title, claim_amount'
    });
  }

  // Get order details to determine courier_id and merchant_id
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('courier_id, shop_id')
    .eq('order_id', order_id)
    .single();

  if (orderError || !orderData) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  // Get merchant_id from shop
  const { data: shopData } = await supabase
    .from('stores')
    .select('merchant_id')
    .eq('shop_id', orderData.shop_id)
    .single();

  // Create claim
  const { data, error } = await supabase
    .from('claims')
    .insert({
      order_id,
      courier_id: orderData.courier_id,
      merchant_id: shopData?.merchant_id || user.user_id,
      claim_type,
      status: 'open',
      priority,
      title,
      description,
      claim_amount: parseFloat(claim_amount),
      evidence_urls: evidence_urls || [],
      metadata: {
        created_by: user.user_id,
        created_by_role: user.user_role
      }
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create claim',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  return res.status(201).json({
    success: true,
    data
  });
}

// PUT - Update claim
async function updateClaim(req: VercelRequest, res: VercelResponse, user: any, limits: any) {
  const { claim_id } = req.query;
  const { status, resolution_notes, approved_amount } = req.body;

  if (!claim_id) {
    return res.status(400).json({
      success: false,
      error: 'claim_id required'
    });
  }

  // Check if user can update
  if (!limits.canUpdate) {
    return res.status(403).json({
      success: false,
      error: 'Upgrade to Pro or Enterprise to update claims',
      upgrade_required: true
    });
  }

  // Get existing claim
  const { data: existingClaim, error: fetchError } = await supabase
    .from('claims')
    .select('*')
    .eq('claim_id', claim_id)
    .single();

  if (fetchError || !existingClaim) {
    return res.status(404).json({
      success: false,
      error: 'Claim not found'
    });
  }

  // Check permissions
  const canUpdate = 
    user.user_role === 'admin' ||
    (user.user_role === 'merchant' && existingClaim.merchant_id === user.user_id) ||
    (user.user_role === 'courier' && existingClaim.courier_id === user.user_id);

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this claim'
    });
  }

  // Build update object
  const updates: any = {
    updated_at: new Date().toISOString()
  };

  if (status) {
    updates.status = status;
    
    // Set resolved_at if status is approved, declined, or closed
    if (['approved', 'declined', 'closed'].includes(status)) {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user.user_id;
    }
  }

  if (resolution_notes) {
    updates.resolution_notes = resolution_notes;
  }

  if (approved_amount !== undefined) {
    updates.approved_amount = parseFloat(approved_amount);
  }

  // Update claim
  const { data, error } = await supabase
    .from('claims')
    .update(updates)
    .eq('claim_id', claim_id)
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update claim',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  return res.status(200).json({
    success: true,
    data
  });
}

// DELETE - Delete claim
async function deleteClaim(req: VercelRequest, res: VercelResponse, user: any, limits: any) {
  const { claim_id } = req.query;

  if (!claim_id) {
    return res.status(400).json({
      success: false,
      error: 'claim_id required'
    });
  }

  // Only admins can delete claims
  if (user.user_role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Only administrators can delete claims'
    });
  }

  const { error } = await supabase
    .from('claims')
    .delete()
    .eq('claim_id', claim_id);

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete claim',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Claim deleted successfully'
  });
}
