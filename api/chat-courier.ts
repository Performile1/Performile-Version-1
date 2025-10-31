import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
// OpenAI temporarily disabled - needs openai package installation

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

/**
 * AI Chat with Courier Context API
 * Enhanced chat endpoint that provides courier tracking context
 * 
 * POST /api/chat-courier
 * Body: { message: string, order_id?: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message, order_id, conversation_history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Rate limiting check (10 messages per minute)
    const rateLimitKey = `chat_rate_limit:${user.id}`;
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .eq('resource', 'chat')
      .single();

    // Get courier context if order_id is provided
    let courierContext = '';
    if (order_id) {
      const context = await getCourierContext(order_id, user.id);
      courierContext = context;
    }

    // Build system prompt with courier context
    const systemPrompt = `You are a helpful AI assistant for Performile, a courier tracking and management platform.

${courierContext ? `COURIER TRACKING CONTEXT:\n${courierContext}\n\n` : ''}

Your role is to:
1. Help users understand their shipment status
2. Explain courier tracking events
3. Provide guidance on delayed shipments
4. Answer questions about courier integrations
5. Help with notification rules setup

IMPORTANT RULES:
- Be concise and helpful
- Use the courier context provided to give accurate information
- If a shipment is delayed, acknowledge it and suggest actions
- Never make up tracking information
- If you don't have specific information, say so
- Suggest contacting the courier directly for urgent issues

Keep responses under 150 words unless more detail is specifically requested.`;

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 5 messages)
    if (conversation_history && Array.isArray(conversation_history)) {
      messages.push(...conversation_history.slice(-5));
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call OpenAI (temporarily disabled - needs openai package)
    // const completion = await openai.chat.completions.create({
    //   model: 'gpt-4',
    //   messages,
    //   max_tokens: 300,
    //   temperature: 0.7,
    // });

    // const reply = completion.choices[0].message.content;
    const reply = 'AI chat temporarily unavailable. Please install openai package.';

    // Update AI context if order_id provided
    if (order_id) {
      await updateAIChatContext(order_id, user.id, message);
    }

    return res.status(200).json({
      reply,
      has_courier_context: !!courierContext,
    });
  } catch (error: any) {
    console.error('Chat courier API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      reply: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.'
    });
  }
}

/**
 * Get courier context for an order
 */
async function getCourierContext(orderId: string, userId: string): Promise<string> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        order_id,
        order_number,
        tracking_number,
        order_status,
        created_at,
        courier:couriers(courier_name),
        store:stores!inner(owner_user_id)
      `)
      .eq('order_id', orderId)
      .single();

    if (orderError || !order) {
      return '';
    }

    // Check if user has access
    if (order.store && order.store[0]?.owner_user_id !== userId) {
      return '';
    }

    // Get latest tracking events
    const { data: events } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('order_id', orderId)
      .order('event_timestamp', { ascending: false })
      .limit(5);

    // Get AI context if exists
    const { data: aiContext } = await supabase
      .from('ai_chat_courier_context')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .single();

    // Build context string
    let context = `Order #${order.order_number}\n`;
    context += `Courier: ${order.courier && order.courier[0]?.courier_name || 'Unknown'}\n`;
    context += `Tracking: ${order.tracking_number}\n`;
    context += `Status: ${order.order_status}\n`;
    context += `Created: ${new Date(order.created_at).toLocaleDateString()}\n`;

    if (events && events.length > 0) {
      context += `\nRecent Events:\n`;
      events.forEach((event, i) => {
        context += `${i + 1}. ${event.event_type} - ${new Date(event.event_timestamp).toLocaleString()}`;
        if (event.location_city) {
          context += ` (${event.location_city})`;
        }
        context += `\n`;
      });
    }

    if (aiContext) {
      if (aiContext.is_delayed) {
        context += `\n⚠️ This shipment is DELAYED\n`;
      }
      if (aiContext.has_exception) {
        context += `\n⚠️ This shipment has an EXCEPTION\n`;
      }
      if (aiContext.ai_status_summary) {
        context += `\nAI Analysis: ${aiContext.ai_status_summary}\n`;
      }
    }

    return context;
  } catch (error) {
    console.error('Error getting courier context:', error);
    return '';
  }
}

/**
 * Update AI chat context
 */
async function updateAIChatContext(orderId: string, userId: string, query: string) {
  try {
    const { data: existing } = await supabase
      .from('ai_chat_courier_context')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('ai_chat_courier_context')
        .update({
          last_query: query,
          query_count: existing.query_count + 1,
          last_query_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('ai_chat_courier_context')
        .insert({
          order_id: orderId,
          user_id: userId,
          last_query: query,
          query_count: 1,
          last_query_at: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Error updating AI context:', error);
  }
}
