const app = require('./app');
const logger = require('./config/logger');
const { closePool } = require('./db');
const supabase = require('./config/supabaseClient');
const { validateSupabaseConfig } = require('./config/supabase');
const NotificationScheduler = require('./services/notificationScheduler');

const PORT = process.env.PORT || 5000;

let serverInstance;

// Initialize Supabase and database
const initializeDatabase = async () => {
  try {
    validateSupabaseConfig();
    logger.info('✅ Supabase configuration validated');
    
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) {
      logger.warn('⚠️ Supabase connection test failed:', error.message);
    } else {
      logger.info('✅ Supabase connection successful');
    }

    try {
      const { error: fieldsError } = await supabase
        .from('fields')
        .select('id')
        .limit(1);

      if (fieldsError) {
        const errorText = `${fieldsError.code || ''} ${fieldsError.message || ''}`.toLowerCase();
        if (fieldsError.code === 'PGRST205' || errorText.includes('could not find the table') || errorText.includes('schema cache')) {
          logger.warn('⚠️ public.fields is missing from Supabase. Field management will fail until the table is created.');
        } else {
          logger.warn('⚠️ public.fields startup check returned an error:', {
            code: fieldsError.code,
            message: fieldsError.message,
            details: fieldsError.details,
            hint: fieldsError.hint
          });
        }
      } else {
        logger.info('✅ public.fields table is available');
      }
    } catch (fieldsCheckError) {
      logger.warn('⚠️ public.fields startup check could not complete:', fieldsCheckError.message);
    }

    logger.info('🚀 Database initialization complete');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    logger.info('🚀 Server will continue without database connection');
    // Don't exit, just continue without database
  }
};

// Start server
const startServer = async () => {
  await initializeDatabase();

  // Initialize notification scheduler
  try {
    NotificationScheduler.initialize();
    logger.info('✅ Notification scheduler initialized');
  } catch (error) {
    logger.error('❌ Failed to initialize notification scheduler:', error);
  }

  if (!serverInstance) {
    // Get the server instance from app.js (it's exported as a property)
    serverInstance = app.get('server');
    
    if (!serverInstance) {
      throw new Error('Server instance not found in app.js');
    }
    
    serverInstance.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 Farm to Table API Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`💬 Chat endpoints: http://localhost:${PORT}/api/chat`);
      console.log(`🗄️  Database: Supabase PostgreSQL with PostGIS`);
      console.log(`🔔 Notifications: Scheduler active (low stock & deliveries)`);
      console.log(`🔌 Socket.io: Real-time chat enabled`);
    });
  } else {
    logger.info('Server already running — skipping listen.');
  }

  return serverInstance;
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      logger.info('HTTP server closed');
      try {
        await closePool();
        logger.info('Database connections closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Immediately start the server
(async () => {
  try {
    await startServer();

    // Handle signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();
