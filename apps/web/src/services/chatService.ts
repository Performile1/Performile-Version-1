/**
 * CHAT SERVICE
 * Handles AI chat communication with OpenAI GPT-4
 * Created: October 21, 2025
 * 
 * Security:
 * - No sensitive data sent to API
 * - Rate limiting
 * - Input sanitization
 * - Error handling
 */

import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  isAuthenticated: boolean;
  context?: {
    hasAccount?: boolean;
    // NO sensitive data allowed here
  };
  conversationHistory?: Message[];
}

interface ChatResponse {
  message: string;
  conversationId?: string;
}

class ChatService {
  private baseURL = '/api/chat';
  private rateLimitMap = new Map<string, number>();
  private readonly RATE_LIMIT = 10; // 10 messages per minute
  private readonly RATE_WINDOW = 60000; // 1 minute

  /**
   * Check rate limit
   */
  private checkRateLimit(userId: string = 'anonymous'): boolean {
    const now = Date.now();
    const userRequests = this.rateLimitMap.get(userId) || 0;
    
    if (userRequests >= this.RATE_LIMIT) {
      return false;
    }
    
    this.rateLimitMap.set(userId, userRequests + 1);
    
    // Reset after window
    setTimeout(() => {
      this.rateLimitMap.delete(userId);
    }, this.RATE_WINDOW);
    
    return true;
  }

  /**
   * Sanitize input to prevent injection
   */
  private sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .substring(0, 1000); // Max 1000 chars
  }

  /**
   * Build system prompt based on context
   */
  private buildSystemPrompt(isAuthenticated: boolean): string {
    const basePrompt = `You are a helpful AI assistant for Performile, a logistics performance platform. 

Your role is to:
- Answer questions about Performile's features and services
- Help users understand how to use the platform
- Provide information about delivery tracking, courier performance, and analytics
- Be friendly, professional, and concise

Important security rules:
- NEVER ask for or discuss user roles, subscription plans, or sensitive data
- NEVER provide information about specific users or their data
- Keep responses focused on general platform features and help
- If asked about sensitive information, politely decline and suggest contacting support

Platform features you can discuss:
- TrustScore system for courier ratings
- Real-time delivery tracking
- Analytics dashboards
- Parcel point locations
- Service performance metrics
- Coverage checker
- Integration capabilities`;

    if (isAuthenticated) {
      return basePrompt + `\n\nThe user is logged in, so you can provide personalized help with using their dashboard and features.`;
    }

    return basePrompt + `\n\nThe user is not logged in. Focus on explaining platform features and encouraging them to sign up.`;
  }

  /**
   * Send message to AI
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait a moment before sending more messages.');
    }

    // Sanitize input
    const sanitizedMessage = this.sanitizeInput(request.message);
    
    if (!sanitizedMessage) {
      throw new Error('Invalid message');
    }

    try {
      // Build conversation history for context
      const messages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(request.isAuthenticated),
        },
        // Include last 5 messages for context
        ...(request.conversationHistory || []).slice(-5).map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user',
          content: sanitizedMessage,
        },
      ];

      const response = await axios.post<ChatResponse>(
        this.baseURL,
        {
          messages,
          // Only send safe context
          context: {
            isAuthenticated: request.isAuthenticated,
            hasAccount: request.context?.hasAccount || false,
          },
        },
        {
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Chat service error:', error);
      
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please try again in a moment.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      }
      
      throw new Error('Failed to get response. Please try again.');
    }
  }

  /**
   * Get suggested questions based on context
   */
  getSuggestedQuestions(isAuthenticated: boolean): string[] {
    if (isAuthenticated) {
      return [
        'How do I track my deliveries?',
        'What is the TrustScore system?',
        'How can I view analytics?',
        'Where can I find parcel points?',
        'How do I integrate with my e-commerce store?',
      ];
    }

    return [
      'What is Performile?',
      'How does the TrustScore system work?',
      'What features are available?',
      'How much does it cost?',
      'How do I sign up?',
    ];
  }
}

export const chatService = new ChatService();
