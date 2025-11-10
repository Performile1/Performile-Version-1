import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Log Courier Selection in Checkout API
 * Tracks when a customer selects a specific courier
 * 
 * POST /api/checkout/log-courier-selection
 * 
 * Body:
 * {
 *   "checkout_session_id": "checkout_1699612345_abc123",
 *   "selected_courier_id": "uuid"
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { checkout_session_id, selected_courier_id } = req.body;

    // Validate required fields
    if (!checkout_session_id || !selected_courier_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['checkout_session_id', 'selected_courier_id']
      });
    }

    // Validate session ID format
    if (!checkout_session_id.startsWith('checkout_')) {
      return res.status(400).json({
        error: 'Invalid checkout_session_id format',
        expected: 'checkout_timestamp_random'
      });
    }

    // Check if session exists
    const { data: existingRecords, error: fetchError } = await supabase
      .from('checkout_courier_analytics')
      .select('analytics_id, courier_id, was_selected, position_shown')
      .eq('checkout_session_id', checkout_session_id);

    if (fetchError) {
      console.error('Error fetching checkout analytics:', fetchError);
      return res.status(500).json({
        error: 'Failed to fetch checkout session',
        message: fetchError.message
      });
    }

    if (!existingRecords || existingRecords.length === 0) {
      return res.status(404).json({
        error: 'Checkout session not found',
        message: 'No courier displays logged for this session',
        checkout_session_id,
        hint: 'Call /api/checkout/log-courier-display first'
      });
    }

    // Check if selected courier was displayed
    const selectedRecord = existingRecords.find(
      record => record.courier_id === selected_courier_id
    );

    if (!selectedRecord) {
      return res.status(400).json({
        error: 'Invalid courier selection',
        message: 'Selected courier was not displayed in this session',
        selected_courier_id,
        displayed_couriers: existingRecords.map(r => r.courier_id)
      });
    }

    // Check if already selected
    if (selectedRecord.was_selected) {
      return res.status(200).json({
        success: true,
        message: 'Courier selection already logged',
        checkout_session_id,
        selected_courier_id,
        already_selected: true
      });
    }

    // Update: Mark selected courier as selected
    const { error: updateSelectedError } = await supabase
      .from('checkout_courier_analytics')
      .update({ was_selected: true })
      .eq('checkout_session_id', checkout_session_id)
      .eq('courier_id', selected_courier_id);

    if (updateSelectedError) {
      console.error('Error updating selected courier:', updateSelectedError);
      return res.status(500).json({
        error: 'Failed to log courier selection',
        message: updateSelectedError.message
      });
    }

    // Update: Mark other couriers as NOT selected (in case of re-selection)
    const otherCourierIds = existingRecords
      .filter(record => record.courier_id !== selected_courier_id)
      .map(record => record.courier_id);

    if (otherCourierIds.length > 0) {
      const { error: updateOthersError } = await supabase
        .from('checkout_courier_analytics')
        .update({ was_selected: false })
        .eq('checkout_session_id', checkout_session_id)
        .in('courier_id', otherCourierIds);

      if (updateOthersError) {
        console.error('Error updating other couriers:', updateOthersError);
        // Don't fail the request, selection was logged successfully
      }
    }

    // Get updated analytics for response
    const { data: updatedRecords } = await supabase
      .from('checkout_courier_analytics')
      .select('courier_id, position_shown, was_selected')
      .eq('checkout_session_id', checkout_session_id)
      .order('position_shown', { ascending: true });

    return res.status(200).json({
      success: true,
      message: 'Courier selection logged successfully',
      checkout_session_id,
      selected_courier_id,
      selection_details: {
        position: selectedRecord.position_shown || null,
        total_couriers: existingRecords.length
      },
      all_couriers: updatedRecords || []
    });

  } catch (error: any) {
    console.error('Error in log-courier-selection:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
