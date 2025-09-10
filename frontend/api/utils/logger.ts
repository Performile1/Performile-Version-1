// Import types for TypeScript support
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface LogContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  requestId?: string;
}

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: LogContext;
  data?: any;
  error?: Error | string;
  stack?: string;
  performance?: {
    startTime: number;
    duration?: number;
  };
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? JSON.stringify(entry.context) : '';
    const data = entry.data ? JSON.stringify(entry.data) : '';
    
    return `[${timestamp}] ${level} ${entry.message} ${context} ${data}`.trim();
  }

  private addLog(entry: LogEntry): void {
    entry.context = {
      ...entry.context,
      timestamp: new Date().toISOString()
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    const formatted = this.formatMessage(entry);
    switch (entry.level) {
      case 'error':
        console.error(formatted);
        if (entry.error) console.error(entry.error);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.addLog({ level: 'info', message, context, data });
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.addLog({ level: 'warn', message, context, data });
  }

  error(message: string, error?: Error | string, context?: LogContext, data?: any): void {
    const entry: LogEntry = { 
      level: 'error', 
      message, 
      context, 
      data,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    };
    this.addLog(entry);
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.addLog({ level: 'debug', message, context, data });
  }

  // Performance logging
  startTimer(label: string, context?: LogContext): () => void {
    const startTime = performance.now();
    this.debug(`Timer started: ${label}`, context);
    
    return () => {
      const duration = performance.now() - startTime;
      this.info(`Timer finished: ${label} (${duration.toFixed(2)}ms)`, context, { duration });
    };
  }

  // API request logging
  logRequest(req: VercelRequest, additionalContext?: Partial<LogContext>): LogContext {
    const context: LogContext = {
      endpoint: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'] as string,
      ip: req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown',
      requestId: req.headers['x-request-id'] as string || Math.random().toString(36).substring(7),
      ...additionalContext
    };

    this.info('API Request', context, {
      query: req.query,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body)
    });

    return context;
  }

  logResponse(context: LogContext, statusCode: number, data?: any, error?: Error): void {
    const message = error ? 'API Response Error' : 'API Response Success';
    const logData = {
      statusCode,
      responseData: error ? undefined : data,
      error: error?.message
    };

    if (error) {
      this.error(message, error, context, logData);
    } else {
      this.info(message, context, logData);
    }
  }

  // Database operation logging
  logDatabaseQuery(query: string, params?: any[], context?: LogContext): void {
    this.debug('Database Query', context, {
      query: query.replace(/\s+/g, ' ').trim(),
      paramCount: params?.length || 0,
      params: this.sanitizeParams(params)
    });
  }

  logDatabaseError(error: Error, query?: string, context?: LogContext): void {
    this.error('Database Error', error, context, {
      query: query?.replace(/\s+/g, ' ').trim(),
      errorCode: (error as any).code,
      errorDetail: (error as any).detail
    });
  }

  // Authentication logging
  logAuthAttempt(email: string, success: boolean, context?: LogContext): void {
    const message = success ? 'Authentication Success' : 'Authentication Failed';
    const level = success ? 'info' : 'warn';
    
    this.addLog({
      level,
      message,
      context: { ...context, userId: success ? email : undefined },
      data: { email: this.sanitizeEmail(email), success }
    });
  }

  // JWT logging
  logJWTError(error: Error, context?: LogContext): void {
    this.error('JWT Error', error, context, {
      jwtError: true,
      tokenExpired: error.message.includes('expired'),
      tokenInvalid: error.message.includes('invalid')
    });
  }

  // Get logs for debugging
  getLogs(filter?: {
    level?: LogEntry['level'];
    userId?: string;
    endpoint?: string;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter?.userId) {
      filteredLogs = filteredLogs.filter(log => log.context?.userId === filter.userId);
    }

    if (filter?.endpoint) {
      filteredLogs = filteredLogs.filter(log => 
        log.context?.endpoint?.includes(filter.endpoint!)
      );
    }

    if (filter?.limit) {
      filteredLogs = filteredLogs.slice(-filter.limit);
    }

    return filteredLogs;
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared');
  }

  // Utility methods for sanitizing sensitive data
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
  }

  private sanitizeParams(params?: any[]): any[] {
    if (!params) return [];
    
    return params.map((param, index) => {
      // Don't log potential passwords or tokens
      if (typeof param === 'string' && (param.length > 20 || param.includes(':'))) {
        return `[SANITIZED_PARAM_${index}]`;
      }
      return param;
    });
  }

  private sanitizeEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  }
}

// Export singleton instance
module.exports.logger = Logger.getInstance();

// Middleware function for API routes
module.exports.withLogging = function withLogging(
  handler: (req: VercelRequest, res: VercelResponse, context: LogContext) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const context = module.exports.logger.logRequest(req);
    const endTimer = module.exports.logger.startTimer(`${req.method} ${req.url}`, context);

    try {
      await handler(req, res, context);
      module.exports.logger.logResponse(context, res.statusCode);
    } catch (error) {
      module.exports.logger.logResponse(context, 500, undefined, error as Error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          requestId: context.requestId
        });
      }
    } finally {
      endTimer();
    }
  };
};

// Health check endpoint for logs
module.exports.createLogEndpoint = function createLogEndpoint() {
  return (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { level, userId, endpoint, limit } = req.query;
    
    const logs = module.exports.logger.getLogs({
      level: level as LogEntry['level'],
      userId: userId as string,
      endpoint: endpoint as string,
      limit: limit ? parseInt(limit as string) : 100
    });

    res.status(200).json({
      success: true,
      logs,
      total: logs.length,
      timestamp: new Date().toISOString()
    });
  };
};
