// Main Express server for Cybrige Solutions

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const courseRoutes = require('./src/routes/courses');
const certificateRoutes = require('./src/routes/certificates');
const videoRoutes = require('./src/routes/videos');
const contactRoutes = require('./src/routes/contact');

const app = express();

// Connect to MongoDB
connectDB();

// Basic security & logging middlewares
app.use(helmet());

// Configure CORS for frontend (adjust origin for production domain)
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Rate limiter for auth & certificate verification endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth', authLimiter);
app.use('/api/certificates/verify', authLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/contact', contactRoutes);

// Serve static frontend (for production build or static HTML)
app.use(express.static(path.join(__dirname, '..', 'client')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Cybrige Solutions server running on port ${PORT}`);
});


