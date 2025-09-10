import { Request, Response, NextFunction } from 'express';
import logger from './logger';

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Log performance metrics
    logger.debug('Request completed', {
      method: req.method,
      url: req.url,
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode
    });
  });
  
  next();
};

// Memory usage monitoring
export const memoryMonitor = () => {
  const usage = process.memoryUsage();
  const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
  
  return {
    rss: `${formatBytes(usage.rss)} MB`,
    heapTotal: `${formatBytes(usage.heapTotal)} MB`,
    heapUsed: `${formatBytes(usage.heapUsed)} MB`,
    external: `${formatBytes(usage.external)} MB`,
    arrayBuffers: `${formatBytes(usage.arrayBuffers)} MB`
  };
};

// Database query performance tracker
export class QueryPerformanceTracker {
  private static queries: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();
  
  static trackQuery(query: string, duration: number) {
    const existing = this.queries.get(query) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.queries.set(query, existing);
    
    // Log slow queries (>500ms)
    if (duration > 500) {
      logger.warn('Slow database query', {
        query: query.substring(0, 100) + '...',
        duration: `${duration}ms`,
        avgTime: `${existing.avgTime.toFixed(2)}ms`,
        count: existing.count
      });
    }
  }
  
  static getStats() {
    const stats = Array.from(this.queries.entries()).map(([query, stats]) => ({
      query: query.substring(0, 50) + '...',
      ...stats
    }));
    
    return stats.sort((a, b) => b.avgTime - a.avgTime);
  }
}
