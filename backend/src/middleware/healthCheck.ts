import { Request, Response, NextFunction } from 'express';
import database from '../config/database';
import redisClient from '../config/redis';
import { memoryMonitor } from '../utils/performance';
import logger from '../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    memory: MemoryHealth;
  };
  performance?: {
    responseTime: number;
    requestsPerMinute: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

interface MemoryHealth {
  status: 'healthy' | 'warning' | 'critical';
  usage: ReturnType<typeof memoryMonitor>;
  heapUsedPercent: number;
}

export class HealthCheckService {
  private static requestCount = 0;
  private static startTime = Date.now();

  static async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    // Check database
    const dbHealth = await this.checkDatabase();
    
    // Check Redis
    const redisHealth = await this.checkRedis();
    
    // Check memory
    const memoryHealth = this.checkMemory();
    
    // Determine overall status
    const overallStatus = this.determineOverallStatus(dbHealth, redisHealth, memoryHealth);
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbHealth,
        redis: redisHealth,
        memory: memoryHealth
      },
      performance: {
        responseTime,
        requestsPerMinute: this.calculateRequestsPerMinute()
      }
    };
  }

  private static async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await database.query('SELECT 1');
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Database health check failed', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const client = redisClient.getClient();
      await client.ping();
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Redis health check failed', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static checkMemory(): MemoryHealth {
    const usage = memoryMonitor();
    const heapUsed = parseFloat(usage.heapUsed);
    const heapTotal = parseFloat(usage.heapTotal);
    const heapUsedPercent = (heapUsed / heapTotal) * 100;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (heapUsedPercent > 90) {
      status = 'critical';
    } else if (heapUsedPercent > 75) {
      status = 'warning';
    }

    return {
      status,
      usage,
      heapUsedPercent: Math.round(heapUsedPercent)
    };
  }

  private static determineOverallStatus(
    db: ServiceHealth,
    redis: ServiceHealth,
    memory: MemoryHealth
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (db.status === 'unhealthy' || redis.status === 'unhealthy') {
      return 'unhealthy';
    }
    
    if (memory.status === 'critical' || memory.status === 'warning') {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private static calculateRequestsPerMinute(): number {
    const uptimeMinutes = (Date.now() - this.startTime) / (1000 * 60);
    return Math.round(this.requestCount / uptimeMinutes);
  }

  static incrementRequestCount(): void {
    this.requestCount++;
  }
}

// Middleware to track requests
export const requestCounter = (req: Request, res: Response, next: NextFunction) => {
  HealthCheckService.incrementRequestCount();
  next();
};

// Health check endpoint handler
export const healthCheckHandler = async (req: Request, res: Response) => {
  try {
    const health = await HealthCheckService.performHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check endpoint error', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};
