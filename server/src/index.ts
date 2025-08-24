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

// Import Rooms
import { AuthRoom } from './rooms/AuthRoom';
import { WorldRoom } from './rooms/WorldRoom';
import { BattleRoom } from './rooms/BattleRoom';
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chimarena3d';

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
        version: '1.0.0',
        rooms: {
          auth: 'Available for authentication',
          world: 'Available after authentication'
        }
      }
    });
  });

  // Authentication routes (REST API)
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
        } : null,
        availableRooms: {
          auth: 'ws://localhost:2567',
          world: 'Available after authentication in AuthRoom'
        }
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

  // Rooms info endpoint
  app.get('/api/rooms', (_req, res) => {
    res.json({
      success: true,
      message: 'Available game rooms',
      data: {
        rooms: [
          {
            name: 'auth',
            description: 'Authentication room - First connection point',
            maxClients: 1000,
            requiresAuth: false,
            purpose: 'User authentication and initial connection'
          },
          {
            name: 'world', 
            description: 'Main lobby and matchmaking',
            maxClients: 500,
            requiresAuth: true,
            purpose: 'Lobby, chat, matchmaking, and social features'
          }
        ],
        flow: [
          'Connect to AuthRoom',
          'Authenticate with credentials', 
          'Receive auth token',
          'Join WorldRoom with token',
          'Access matchmaking and battles'
        ]
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
  // Register rooms in order of connection flow
  
  // 1. AuthRoom - First connection point for authentication
  gameServer.define('auth', AuthRoom, {
    maxClients: 1000  // High limit for authentication
  });
  
  // 2. WorldRoom - Main lobby after authentication  
  gameServer.define('world', WorldRoom, {
    maxClients: 500   // Lobby limit
  });
  
  // 3. BattleRoom - Batailles en temps réel
  gameServer.define('battle', BattleRoom, {
    maxClients: 12  // 2 joueurs + 10 spectateurs max
  });
  // Future rooms can be added here:
  // gameServer.define('battle', BattleRoom);
  // gameServer.define('tournament', TournamentRoom);
  
  console.log('🎮 Game rooms configured:');
  console.log('   📝 AuthRoom - Authentication and login');
  console.log('   🌍 WorldRoom - Main lobby and matchmaking');
  console.log('   🎯 Connection flow: auth → world → battle');
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

    // Development info page
    app.get('/dev', (_req, res) => {
      res.json({
        development: true,
        server: {
          host: HOST,
          port: PORT,
          mongodb: MONGODB_URI
        },
        rooms: {
          auth: `ws://${HOST}:${PORT}`,
          world: `ws://${HOST}:${PORT}` 
        },
        tools: {
          monitor: process.env.COLYSEUS_MONITOR === 'true' ? `http://${HOST}:${PORT}/colyseus` : null,
          playground: process.env.COLYSEUS_PLAYGROUND === 'true' ? `http://${HOST}:${PORT}/playground` : null
        },
        apis: {
          health: `http://${HOST}:${PORT}/api/health`,
          rooms: `http://${HOST}:${PORT}/api/rooms`,
          auth: `http://${HOST}:${PORT}/api/auth`,
          cards: `http://${HOST}:${PORT}/api/cards`,
          collection: `http://${HOST}:${PORT}/api/collection`
        }
      });
    });
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
    
    console.log('\n🎮 Game Rooms:');
    console.log(`   • AuthRoom: ws://${HOST}:${PORT} (room: "auth")`);
    console.log(`   • WorldRoom: ws://${HOST}:${PORT} (room: "world")`);
    console.log('   • Flow: Connect to "auth" → authenticate → join "world"');
    
    if (NODE_ENV === 'development') {
      console.log('\n🛠️ Development Tools:');
      if (process.env.COLYSEUS_MONITOR === 'true') {
        console.log(`   • Monitor: http://${HOST}:${PORT}/colyseus`);
      }
      if (process.env.COLYSEUS_PLAYGROUND === 'true') {
        console.log(`   • Playground: http://${HOST}:${PORT}/playground`);
      }
      console.log(`   • Dev Info: http://${HOST}:${PORT}/dev`);
      console.log(`   • Rooms Info: http://${HOST}:${PORT}/api/rooms`);
    }
    
    console.log('\n✅ Server started successfully!');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
