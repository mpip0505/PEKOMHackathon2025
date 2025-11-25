require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./utils/logger');

// Initialize Firebase
require('./config/firebase');

// Initialize Express app
const app = express();

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { 
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// ==================== SWAGGER DOCUMENTATION ====================
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DalCo API Documentation'
  }));
} catch (err) {
  logger.warn('Swagger documentation not available');
}

const publicDir = path.join(__dirname, '../public');
app.use('/dashboard', express.static(publicDir));
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});

// ==================== ROUTES ====================
const API_PREFIX = '/api';

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to DalCo API - Data-Link Co-pilot',
    version: '1.0.0',
    database: 'Firebase Firestore',
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test Firestore connection
    const { db } = require('./config/firebase');
    await db.collection('_health').doc('check').set({ 
      timestamp: new Date(),
      status: 'healthy' 
    });

    res.json({
      success: true,
      status: 'healthy',
      services: {
        api: 'running',
        firestore: 'connected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Import routes (create these next)
try {
  const systemRoutes = require('./routes/system.routes');
  const authRoutes = require('./routes/auth.routes');
  const messageRoutes = require('./routes/messages.routes');
  const leadRoutes = require('./routes/leads.routes');
  const analyticsRoutes = require('./routes/analytics.routes');

  app.use(`${API_PREFIX}/system`, systemRoutes);
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/messages`, messageRoutes);
  app.use(`${API_PREFIX}/leads`, leadRoutes);
  app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
} catch (err) {
  logger.warn('Some routes not yet implemented');
}

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);

  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║    DalCo API Server Running (Firebase)            ║
    ║                                                   ║
    ║   Environment: ${process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}                        ║
    ║   Port: ${PORT}                                      ║
    ║   Database: Firebase Firestore                    ║
    ║   API Docs: http://localhost:${PORT}/api/docs        ║
    ║                                                   ║
    ║   Ready to reduce admin work!                     ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Closing server gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;