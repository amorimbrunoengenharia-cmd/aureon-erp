import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
import models from './models/index.js';
import logger from './utils/logger.js';
import { validateEnv, printEnvSummary } from './utils/validateEnv.js';
import { retry } from './utils/dbRetry.js';
import healthCheckService from './utils/healthCheck.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import traceMiddleware from './middlewares/trace.js';
import { swaggerSpec, swaggerUi, swaggerUiOptions } from './config/swagger.js';
import { initializeSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from './config/sentry.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import productRoutes from './routes/product.routes.js';
import salesRoutes from './routes/sales.routes.js';
import clientRoutes from './routes/client.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import financeRoutes from './routes/finance.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import eventRoutes from './routes/event.routes.js';
import auditRoutes from './routes/audit.routes.js';
import alertRoutes from './routes/alert.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import backupRoutes from './routes/backup.routes.js';
import emailRoutes from './routes/email.routes.js';
import searchRoutes from './routes/search.routes.js';
import financialRoutes from './routes/financialRoutes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import customerRoutes from './routes/customer.routes.js';
import supplierQuotationRoutes from './routes/supplierQuotation.routes.js';

dotenv.config();

// Initialize Sentry (must be first!)
initializeSentry();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== SENTRY MIDDLEWARES (MUST BE FIRST) =====
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// ===== MIDDLEWARES =====
// Security headers with proper CSP for API
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://www.gstatic.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(compression()); // Gzip compression
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Trace ID for distributed tracing (resiliente)
app.use(traceMiddleware);

app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
app.use('/api/', rateLimiter);

// ===== API DOCUMENTATION =====
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ===== ROOT ROUTE =====
app.get('/', (req, res) => {
  res.json({
    name: 'AUREON ERP API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      products: '/api/products',
      clients: '/api/clients',
      suppliers: '/api/suppliers',
      sales: '/api/sales',
      prescriptions: '/api/prescriptions',
      finance: '/api/finance',
      inventory: '/api/inventory',
      events: '/api/events',
      audit: '/api/audit',
      analytics: '/api/analytics',
      backup: '/api/backup',
      email: '/api/email',
      search: '/api/search',
      financial: '/api/financial',
      marketplace: '/api/marketplace',
      customer: '/api/customer',
      supplierQuotations: '/api/suppliers/quotations'
    },
    documentation: '/api-docs'
  });
});

// ===== HEALTH CHECK ENDPOINTS =====

// Liveness probe - verifica se o app está rodando
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Readiness probe - verifica se o app está pronto para receber tráfego
app.get('/ready', async (req, res) => {
  try {
    // Check if database circuit is open
    if (healthCheckService.isDatabaseCircuitOpen()) {
      return res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: 'Database circuit breaker is open',
        checks: {
          database: 'circuit_open',
          models: 'unknown',
          server: 'degraded'
        }
      });
    }

    // Verificar conexão com banco de dados
    const dbHealth = await healthCheckService.checkDatabaseHealth(sequelize);
    
    // Verificar se modelos estão carregados
    const modelsLoaded = Object.keys(models).length > 0;
    
    if (!dbHealth.healthy || !modelsLoaded) {
      return res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: dbHealth.error || 'Models not loaded',
        checks: {
          database: dbHealth.healthy ? 'connected' : 'error',
          models: modelsLoaded ? 'loaded' : 'not_loaded',
          server: 'not ready'
        }
      });
    }
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        models: 'loaded',
        server: 'ready'
      },
      latency: {
        database: `${dbHealth.latency}ms`
      }
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: 'error',
        models: 'unknown',
        server: 'not ready'
      }
    });
  }
});

// Detailed health check - informações completas do sistema
app.get('/health/detailed', async (req, res) => {
  try {
    // Get health status from service
    const healthStatus = healthCheckService.getHealthStatus();
    const memoryHealth = healthCheckService.checkMemoryHealth();
    
    // Verificar database
    const dbHealth = await healthCheckService.checkDatabaseHealth(sequelize);
    
    res.status(healthStatus.healthy ? 200 : 503).json({
      status: healthStatus.healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      memory: memoryHealth,
      database: {
        status: dbHealth.healthy ? 'connected' : 'error',
        latency: dbHealth.latency ? `${dbHealth.latency}ms` : null,
        type: process.env.USE_POSTGRES === 'true' ? 'PostgreSQL' : 'SQLite',
        circuitBreaker: healthCheckService.isDatabaseCircuitOpen() ? 'open' : 'closed'
      },
      features: {
        swagger: process.env.ENABLE_SWAGGER === 'true',
        traceId: process.env.ENABLE_TRACE_ID === 'true',
        email: !!process.env.SMTP_USER
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/suppliers', supplierQuotationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/customer', customerRoutes);

// ===== ERROR HANDLERS =====
// Sentry error handler must be BEFORE other error handlers
app.use(sentryErrorHandler());
app.use(errorHandler);

// ===== DATABASE CONNECTION & SERVER START =====
const startServer = async () => {
  try {
    // Validate environment variables
    logger.info('🔍 Validating environment variables...');
    validateEnv();
    printEnvSummary();

    // Test database connection with retry
    await retry(() => sequelize.authenticate(), { retries: 5, backoff: 1000 });
    logger.info('✅ Database connection established successfully (with retry)');

    // Sync models (development only - use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('✅ Database models synchronized');
    } else {
      logger.info('⚠️  Production mode: Use migrations to update database schema');
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 AUREON Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN}`);
      
      // Signal PM2 that app is ready
      if (process.send) {
        process.send('ready');
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`⚠️  ${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        try {
          await sequelize.close();
          logger.info('✅ Database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('💥 UNCAUGHT EXCEPTION! Shutting down gracefully...', {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
    timestamp: new Date().toISOString()
  });
  
  // Give time to flush logs
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🔥 UNHANDLED REJECTION! Promise rejected', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : 'No stack trace',
    promise: String(promise),
    timestamp: new Date().toISOString()
  });
  
  // In production, exit gracefully
  if (process.env.NODE_ENV === 'production') {
    logger.error('Shutting down due to unhandled rejection...');
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  } else {
    logger.warn('⚠️  Unhandled rejection in development - server continues running');
  }
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
