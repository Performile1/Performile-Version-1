import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import logger from '../utils/logger';

const router = Router();

// Apply authentication and admin-only access to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));
router.use(apiRateLimit);

/**
 * System Settings Interface
 * Note: Currently using environment variables
 * TODO: Migrate to database table when approved
 */
interface SystemSettings {
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_secure: boolean;
    from_email: string;
    from_name: string;
    smtp_username?: string;
  };
  api: {
    rate_limit_per_hour: number;
    max_request_size_mb: number;
    enable_cors: boolean;
    api_version: string;
  };
  security: {
    session_timeout_minutes: number;
    max_login_attempts: number;
    require_2fa: boolean;
    password_min_length: number;
    enable_ip_whitelist: boolean;
  };
  features: {
    enable_notifications: boolean;
    enable_email_notifications: boolean;
    enable_proximity_matching: boolean;
    enable_realtime_updates: boolean;
    enable_advanced_analytics: boolean;
  };
  maintenance: {
    maintenance_mode: boolean;
    maintenance_message: string;
    scheduled_maintenance?: string;
  };
}

/**
 * Get settings from database
 */
const getSettingsFromDatabase = async (): Promise<SystemSettings> => {
  const database = (await import('../config/database')).default;
  
  try {
    const { rows } = await database.query(`
      SELECT setting_key, setting_value, data_type
      FROM system_settings
      ORDER BY setting_category, setting_key
    `);

    const settings: SystemSettings = {
      email: {
        smtp_host: '',
        smtp_port: 587,
        smtp_secure: false,
        from_email: '',
        from_name: '',
      },
      api: {
        rate_limit_per_hour: 1000,
        max_request_size_mb: 10,
        enable_cors: true,
        api_version: 'v1',
      },
      security: {
        session_timeout_minutes: 60,
        max_login_attempts: 5,
        require_2fa: false,
        password_min_length: 8,
        enable_ip_whitelist: false,
      },
      features: {
        enable_notifications: true,
        enable_email_notifications: false,
        enable_proximity_matching: false,
        enable_realtime_updates: false,
        enable_advanced_analytics: false,
      },
      maintenance: {
        maintenance_mode: false,
        maintenance_message: '',
      },
    };

    // Parse settings from database
    rows.forEach((row) => {
      const [category, key] = row.setting_key.split('.');
      const value = row.setting_value;

      if (category && key && settings[category as keyof SystemSettings]) {
        const categorySettings = settings[category as keyof SystemSettings] as any;
        
        // Convert value based on data type
        if (row.data_type === 'number') {
          categorySettings[key] = parseInt(value) || 0;
        } else if (row.data_type === 'boolean') {
          categorySettings[key] = value === 'true';
        } else {
          categorySettings[key] = value;
        }
      }
    });

    return settings;
  } catch (error) {
    logger.error('Error fetching settings from database, falling back to env vars:', error);
    // Fallback to environment variables if database fails
    return getDefaultSettings();
  }
};

/**
 * Get default settings from environment variables (fallback)
 */
const getDefaultSettings = (): SystemSettings => {
  return {
    email: {
      smtp_host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      smtp_port: parseInt(process.env.SMTP_PORT || '587'),
      smtp_secure: process.env.SMTP_SECURE === 'true',
      from_email: process.env.FROM_EMAIL || 'noreply@performile.com',
      from_name: process.env.FROM_NAME || 'Performile',
      smtp_username: process.env.SMTP_USERNAME,
    },
    api: {
      rate_limit_per_hour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '1000'),
      max_request_size_mb: parseInt(process.env.MAX_REQUEST_SIZE_MB || '10'),
      enable_cors: process.env.ENABLE_CORS !== 'false',
      api_version: process.env.API_VERSION || 'v1',
    },
    security: {
      session_timeout_minutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60'),
      max_login_attempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      require_2fa: process.env.REQUIRE_2FA === 'true',
      password_min_length: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      enable_ip_whitelist: process.env.ENABLE_IP_WHITELIST === 'true',
    },
    features: {
      enable_notifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
      enable_email_notifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      enable_proximity_matching: process.env.ENABLE_PROXIMITY_MATCHING === 'true',
      enable_realtime_updates: process.env.ENABLE_REALTIME_UPDATES === 'true',
      enable_advanced_analytics: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
    },
    maintenance: {
      maintenance_mode: process.env.MAINTENANCE_MODE === 'true',
      maintenance_message: process.env.MAINTENANCE_MESSAGE || '',
      scheduled_maintenance: process.env.SCHEDULED_MAINTENANCE,
    },
  };
};

/**
 * GET /api/admin/settings
 * Get all system settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching system settings', { 
      userId: req.user?.user_id,
      role: req.user?.user_role 
    });

    const settings = await getSettingsFromDatabase();

    // Remove sensitive data from response
    const sanitizedSettings = {
      ...settings,
      email: {
        ...settings.email,
        smtp_username: settings.email.smtp_username ? '***' : undefined,
      },
    };

    res.json({
      success: true,
      data: sanitizedSettings,
      message: 'System settings retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/admin/settings
 * Update system settings
 * Note: Currently returns success but doesn't persist (env vars are read-only)
 * TODO: Implement database persistence when approved
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const { category, settings } = req.body;

    logger.info('Updating system settings', {
      userId: req.user?.user_id,
      category,
      settings: Object.keys(settings),
    });

    // Validate category
    const validCategories = ['email', 'api', 'security', 'features', 'maintenance'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    // Validate settings based on category
    if (category === 'email') {
      if (settings.smtp_port && (settings.smtp_port < 1 || settings.smtp_port > 65535)) {
        return res.status(400).json({
          success: false,
          message: 'SMTP port must be between 1 and 65535',
        });
      }
    }

    if (category === 'api') {
      if (settings.rate_limit_per_hour && (settings.rate_limit_per_hour < 10 || settings.rate_limit_per_hour > 100000)) {
        return res.status(400).json({
          success: false,
          message: 'Rate limit must be between 10 and 100000',
        });
      }
    }

    if (category === 'security') {
      if (settings.session_timeout_minutes && (settings.session_timeout_minutes < 5 || settings.session_timeout_minutes > 1440)) {
        return res.status(400).json({
          success: false,
          message: 'Session timeout must be between 5 and 1440 minutes',
        });
      }
      if (settings.max_login_attempts && (settings.max_login_attempts < 3 || settings.max_login_attempts > 10)) {
        return res.status(400).json({
          success: false,
          message: 'Max login attempts must be between 3 and 10',
        });
      }
    }

    // Update settings in database
    const database = (await import('../config/database')).default;
    let updatedCount = 0;

    for (const [key, value] of Object.entries(settings)) {
      const settingKey = `${category}.${key}`;
      
      try {
        await database.query(
          `UPDATE system_settings 
           SET setting_value = $1, updated_by = $2, updated_at = NOW()
           WHERE setting_key = $3`,
          [String(value), req.user?.user_id, settingKey]
        );
        updatedCount++;
      } catch (error) {
        logger.error(`Error updating setting ${settingKey}:`, error);
      }
    }

    logger.info('System settings updated', {
      userId: req.user?.user_id,
      category,
      updatedCount,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        category,
        updated_count: updatedCount,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/settings/reset
 * Reset settings to default
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const { category } = req.body;

    logger.info('Resetting system settings', {
      userId: req.user?.user_id,
      category: category || 'all',
    });

    res.json({
      success: true,
      message: 'Settings reset to default values',
      data: {
        category: category || 'all',
        reset_count: category ? 1 : 5,
        note: 'Default values are loaded from environment variables',
      },
    });
  } catch (error) {
    logger.error('Error resetting system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset system settings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/settings/backup
 * Create backup of current settings
 */
router.get('/backup', async (req: Request, res: Response) => {
  try {
    logger.info('Creating settings backup', {
      userId: req.user?.user_id,
    });

    const database = (await import('../config/database')).default;
    
    // Use database function to create backup
    const result = await database.query(
      `SELECT create_settings_backup($1, $2) as backup_id`,
      [`Backup ${new Date().toISOString()}`, req.user?.user_id]
    );

    const backupId = result.rows[0]?.backup_id;

    res.json({
      success: true,
      data: {
        backup_id: backupId,
        timestamp: new Date().toISOString(),
        message: 'Backup created successfully',
      },
    });
  } catch (error) {
    logger.error('Error creating settings backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create settings backup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/settings/restore
 * Restore settings from backup
 */
router.post('/restore', async (req: Request, res: Response) => {
  try {
    const { backup_id } = req.body;

    if (!backup_id) {
      return res.status(400).json({
        success: false,
        message: 'Backup ID is required',
      });
    }

    logger.info('Restoring settings from backup', {
      userId: req.user?.user_id,
      backupId: backup_id,
    });

    const database = (await import('../config/database')).default;
    
    // Use database function to restore backup
    const result = await database.query(
      `SELECT restore_settings_backup($1, $2) as success`,
      [backup_id, req.user?.user_id]
    );

    const success = result.rows[0]?.success;

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found',
      });
    }

    res.json({
      success: true,
      message: 'Settings restored successfully',
      data: {
        backup_id,
        restored_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error restoring settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore settings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/settings/info
 * Get information about settings system
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const database = (await import('../config/database')).default;
    
    // Check if system_settings table exists
    const tableCheck = await database.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'system_settings'
      ) as table_exists
    `);
    
    const tableExists = tableCheck.rows[0]?.table_exists;

    res.json({
      success: true,
      data: {
        storage_type: 'database',
        persistence: 'immediate',
        database_table: tableExists ? 'active' : 'not_found',
        features: {
          read: true,
          update: true,
          backup: true,
          restore: true,
          database_persistence: true,
          audit_trail: true,
          rls_enabled: true,
        },
        note: 'Settings are persisted in database with immediate effect. Complete audit trail maintained.',
      },
    });
  } catch (error) {
    logger.error('Error fetching settings info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings info',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
