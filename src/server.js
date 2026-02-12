import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Joi from 'joi';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';

/**
 * Load environment variables (ONLY in development)
 */
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

/**
 * Strict environment validation
 */
const envSchema = Joi.object({
  MONGO_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
  RATE_LIMIT_WINDOW: Joi.number().integer().min(1).required(),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  PORT: Joi.number().optional(),
}).unknown();

const { error: envError } = envSchema.validate(process.env);

if (envError) {
  console.error('❌ Invalid environment configuration:', envError.message);
  process.exit(1);
}

/**
 * Create Express app
 */
const app = express();

/**
 * Root route
 */
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'HealthVillage API is running' });
});

/**
 * Logging
 */
if (process.env.NODE_ENV === 'production') {
  app.use(
    morgan('combined', {
      skip: (req, res) => res.statusCode < 400,
    })
  );
} else {
  app.use(morgan('dev'));
}

/**
 * Security middleware
 */
app.use(helmet());
app.use(mongoSanitize());

/**
 * CORS configuration
 */
let allowedOrigins;

if (process.env.NODE_ENV === 'production') {
  allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);
} else {
  allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    process.env.FRONTEND_URL,
  ].filter(Boolean);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

/**
 * Body parsing
 */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * Rate limiting
 */
app.use('/api', generalLimiter);

/**
 * Health endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * API routes
 */
app.use('/api', apiRoutes);

/**
 * 404 & error handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Start server
 */
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

startServer();
