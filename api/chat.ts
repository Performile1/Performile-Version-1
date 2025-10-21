/**
 * AI CHAT API ENDPOINT
 * OpenAI GPT-4 integration for chat functionality
 * Created: October 21, 2025
 * 
 * Security:
 * - No sensitive data exposure
 * - Rate limiting
 * - Input validation
 * - API key protection
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context?: {
    isAuthenticated?: boolean;
    hasAccount?: boolean;
  };
}

/**
 * Rate limiting store (in-memory for serverless)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + 60000, // 1 minute window
    });
    return true;
  }

  if (limit.count >= 10) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Validate and sanitize request
 */
function validateRequest(body: any): ChatRequest | null {
  if (!body || !Array.isArray(body.messages)) {
    return null;
  }

  // Validate messages
  const messages = body.messages
    .filter((msg: any) => 
      msg && 
      typeof msg.role === 'string' && 
      typeof msg.content === 'string' &&
      ['system', 'user', 'assistant'].includes(msg.role)
    )
    .map((msg: any) => ({
      role: msg.role,
      content: msg.content.substring(0, 2000), // Limit message length
    }));

  if (messages.length === 0) {
    return null;
  }

  return {
    messages,
    context: {
      isAuthenticated: body.context?.isAuthenticated === true,
      hasAccount: body.context?.hasAccount === true,
    },
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
  } catch (error: any) {
    console.error('OpenAI API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key');
    }
    
    if (error.response?.status === 429) {
      throw new Error('OpenAI rate limit exceeded');
    }
    
    throw new Error('Failed to get AI response');
  }
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const ip = req.headers['x-forwarded-for'] as string || 
               req.headers['x-real-ip'] as string || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      });
    }

    // Validate request
    const chatRequest = validateRequest(req.body);
    if (!chatRequest) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Call OpenAI
    const aiResponse = await callOpenAI(chatRequest.messages);

    // Return response
    return res.status(200).json({
      message: aiResponse,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Chat API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Return user-friendly error
    return res.status(500).json({
      error: error.message || 'An error occurred while processing your request. Please try again.',
    });
  }
}
