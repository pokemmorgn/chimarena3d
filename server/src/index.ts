import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { monitor } from '@colyseus/monitor';
import { playground } from '@colyseus/playground';
import mongoose from 'mongoose';
import { WebSocketTransport } from '@colyseus/ws-transport';
// Ipmport Rooms
import { WorldRoom } from './rooms/WorldRoom';
// Import routes
import authRoutes from './routes/AuthRoutes';
import cardRoutes from './routes/CardRoutes';
import collectionRoutes from './routes/CollectionRoutes';
// Import middleware
import { authenticateOptional } from './middleware/AuthData';

// Server configuration
const app = express();
app.set('trust proxy', 'loopback');
const server = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
    pingInterval: 3000,
    pingMaxRetries: 3
  })
});

// Environment variables
const PORT = parseInt(process.env.PORT || '2567', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clash-royale-game';

/**
 * Database connection
 */
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

/**
 * Express middleware setup
 */
function setupMiddleware(): void {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Version', 'X-Platform']
  };
  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks and monitoring
      return req.path === '/api/health' || req.path.startsWith('/colyseus');
    }
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging in development
  if (NODE_ENV === 'development') {
    app.use((_req, _res, next) => {
      console.log(`${new Date().toISOString()} - ${_req.method} ${_req.path}`);
      next();
    });
  }
}

/**
 * API routes setup
 */
function setupRoutes(): void {
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      message: 'Server is healthy',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        version: '1.0.0'
      }
    });
  });

  // Authentication routes
  app.use('/api/auth', authRoutes);
  app.use('/api/cards', cardRoutes);
  app.use('/api/collection', collectionRoutes);
  // Game API routes (for future expansion)
  app.use('/api/game', authenticateOptional, (req, res) => {
    res.json({
      success: true,
      message: 'Game API endpoint',
      data: {
        authenticated: !!req.user,
        user: req.user ? {
          id: req.user._id,
          username: req.user.username,
          level: req.user.level
        } : null
      }
    });
  });

  // User management routes (for future expansion)
  app.use('/api/user', authenticateOptional, (req, res) => {
    res.json({
      success: true,
      message: 'User API endpoint',
      data: {
        authenticated: !!req.user
      }
    });
  });

  // 404 handler for API routes
  app.use('/api/*', (_req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      code: 'ENDPOINT_NOT_FOUND'
    });
  });
}

/**
 * Colyseus game server setup
 */
function setupGameServer(): void {
  // Register game rooms (to be implemented later)
  // gameServer.define('lobby', LobbyRoom);
  // gameServer.define('game', GameRoom);
  gameServer.define('world', WorldRoom);
  console.log('🎮 Game server configured (rooms will be added later)');
}

/**
 * Development tools setup
 */
function setupDevelopmentTools(): void {
  if (NODE_ENV === 'development') {
    // Colyseus monitor
    if (process.env.COLYSEUS_MONITOR === 'true') {
      app.use('/colyseus', monitor());
      console.log('🔍 Colyseus monitor available at /colyseus');
    }

    // Colyseus playground
    if (process.env.COLYSEUS_PLAYGROUND === 'true') {
      app.use('/playground', playground);
      console.log('🎮 Colyseus playground available at /playground');
    }
  }
}

/**
 * Error handling middleware
 */
function setupErrorHandling(): void {
  // Global error handler
  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Global error handler:', error);
    
    res.status(500).json({
      success: false,
      message: NODE_ENV === 'development' ? error.message : 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(NODE_ENV === 'development' && { stack: error.stack })
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

/**
 * Graceful shutdown
 */
function setupGracefulShutdown(): void {
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Close Colyseus server
      await gameServer.gracefullyShutdown();
      console.log('✅ Colyseus server closed');
      
      // Close database connection
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
      
      // Close HTTP server
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
      
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

/**
 * Main server initialization
 */
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting Clash Royale Game Server...');
    
    // Connect to database
    await connectDatabase();
    
    // Setup Express middleware
    setupMiddleware();
    
    // Setup API routes
    setupRoutes();
    
    // Setup Colyseus game server
    setupGameServer();
    
    // Setup development tools
    setupDevelopmentTools();
    
    // Setup error handling
    setupErrorHandling();
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    // Start listening
    await gameServer.listen(PORT, HOST);
    
    console.log('🎯 Server Information:');
    console.log(`   • Environment: ${NODE_ENV}`);
    console.log(`   • HTTP Server: http://${HOST}:${PORT}`);
    console.log(`   • WebSocket Server: ws://${HOST}:${PORT}`);
    console.log(`   • API Base URL: http://${HOST}:${PORT}/api`);
    console.log(`   • Database: ${MONGODB_URI}`);
    
    if (NODE_ENV === 'development') {
      console.log('\n🛠️ Development Tools:');
      if (process.env.COLYSEUS_MONITOR === 'true') {
        console.log(`   • Monitor: http://${HOST}:${PORT}/colyseus`);
      }
      if (process.env.COLYSEUS_PLAYGROUND === 'true') {
        console.log(`   • Playground: http://${HOST}:${PORT}/playground`);
      }
    }
    
    console.log('\n✅ Server started successfully!');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
