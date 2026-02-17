import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { router } from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (env.frontendOrigins.includes(origin)) {
    return true;
  }

  // Allow iOS/Android Capacitor WebView origins.
  if (origin === 'capacitor://localhost' || origin === 'ionic://localhost' || origin === 'http://localhost') {
    return true;
  }

  // Allow Vercel deployment URLs to prevent breakage between preview/prod URLs.
  if (origin.endsWith('.vercel.app')) {
    return true;
  }

  return false;
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use('/api', router);
app.use(errorHandler);
