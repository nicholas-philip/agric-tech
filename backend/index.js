import 'dotenv/config'; // Automatically loads .env
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import connectDB from './db.js'; 
import authRoutes from './routes/authRoutes.js';
import farmRoutes from './routes/farmRoutes.js';
import activityRoutes from './routes/activityRoute.js';
import batchRoutes from './routes/batchRoute.js';
import agrodealerRoutes from './routes/agrodealerRoute.js';
import climateRoutes from './routes/climateRoute.js';
import investorRoutes from './routes/investorRoute.js';
import agronomistRoutes from './routes/agronomistRoute.js';
import creditRoutes from './routes/creditRoute.js';
import cooperativeRoutes from './routes/cooperativeRoute.js';
import errorHandler from './middleware/ErrorHandler.js';
// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Custom Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Agric-Tech Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/agrodealers', agrodealerRoutes);
app.use('/api/climate', climateRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/agronomist', agronomistRoutes);
app.use('/api/farmers', creditRoutes);
app.use('/api/cooperatives', cooperativeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server function
const startServer = async () => {
  try {
    console.log('⏳ Connecting to Database...');
    console.log(`Debug: MONGO_URI length is ${process.env.MONGO_URI ? process.env.MONGO_URI.length : 0}`);
    // Connect to database first
    await connectDB();
    console.log('Database Connected!');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(` Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.log(`Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;
