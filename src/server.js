import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Resolve __dirname (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to backend/.env
const envPath = path.join(__dirname, '..', '.env');

// Load environment variables
dotenv.config({ path: envPath });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';

const app = express();

// Request logging middleware
if (process.env.NODE_ENV === 'production') {
  // Production: Log only errors and important requests
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
} else {
  // Development: Log all requests
  app.use(morgan('dev'));
}

// Security middleware
app.use(helmet()); // Set security headers

// CORS configuration - lock down to specific origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Apply general rate limiting to all routes
app.use('/api', generalLimiter);

// Health check endpoint (no rate limit)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Start server with MongoDB connection
 */
async function startServer() {
  try {
    // Validate required environment variables
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

startServer();
