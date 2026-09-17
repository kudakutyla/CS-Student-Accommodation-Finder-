import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import campusRoutes from './routes/campus.routes';
import listingRoutes from './routes/listing.routes';
import adminRoutes from './routes/admin.routes';
import { sendSuccess, sendError } from './utils/response';

export const app = express();

// Security middleware
app.use(helmet());

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: [clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // max 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint (Required by Specification)
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Student Accommodation Finder API is running',
  });
});

// Root route for convenience
app.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { version: '1.0.0' }, 'Student Accommodation Finder API is online');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/campuses', campusRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  sendError(res, 'Requested resource or API endpoint not found', 404);
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message || 'Internal server error';
  sendError(res, message, 500);
});

export default app;
