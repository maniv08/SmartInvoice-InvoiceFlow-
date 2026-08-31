import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger/swagger.json';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during development
      }
    },
    credentials: true,
  })
);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection Protection
app.use(mongoSanitize());

// Rate Limiting on write / auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static Uploads
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check & Full Architecture Status
app.get('/api/health', (_req, res) => {
  const { getPGStatus } = require('./config/postgres');
  const { getRedisStatus } = require('./config/redis');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'InvoiceFlow Enterprise API',
    stack: {
      framework: 'Express.js + TypeScript (REST API)',
      postgres: getPGStatus(),
      redis: getRedisStatus(),
      docker: 'Containerized Architecture Ready',
      versionControl: 'Git/GitHub'
    }
  });
});

// API Routes
app.use('/api', routes);

// Error Handling
app.use(errorHandler);

export { app };
export default app;
