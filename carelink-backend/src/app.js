const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const triageRoutes = require('./routes/triageRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const reportRoutes = require('./routes/reportRoutes');
const creditRoutes = require('./routes/creditRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

const allowedOrigins = config.allowedOrigins;

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || allowedOrigins[0]);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'CareLink API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/triage', triageRoutes);
app.use('/api/v1/facilities', facilityRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/credits', creditRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/wandaa', require('./routes/wandaaRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
