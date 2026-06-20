const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const i18n = require('./middleware/i18n');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (env.clientOrigins.includes(origin)) return cb(null, true);
    if (env.nodeEnv === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// ---- Security hardening ----
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());   // strip $ and . from inputs to block NoSQL injection
app.use(hpp());             // prevent HTTP parameter pollution
app.use(compression());
if (env.nodeEnv === 'development') app.use(morgan('dev'));

// global + strict auth rate limits
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: { success: false, message: 'Too many requests' } }));

// language detection (so / ar / en)
app.use(i18n);

// uploaded media (audio/video). NOTE: for production use signed URLs / S3 + access control.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API
app.use('/api/v1', routes);

// errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;
