import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
<<<<<<< HEAD
import adminRoutes from '../modules/admin/admin.routes.js';
import supportRoutes from './routes/supportRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import notificationRoutes from '../modules/notifications/notifications.routes.js';
import subscriptionRoutes from '../modules/subscriptions/subscriptions.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';
import deliveryRoutes from '../modules/delivery/delivery.routes.js';
import paymentRoutes from '../modules/payments/payments.routes.js';
=======
import adminRoutes from './routes/adminRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4

const app = express();

// Security Middleware
app.use(helmet());

// Logging Middleware
app.use(morgan('dev'));

// Payload compression & JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Base route
app.get('/', (req, res) => {
    res.send('Farm to Table API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/farmers', farmerRoutes);
// app.use('/api/consumers', consumerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/home', homeRoutes);
<<<<<<< HEAD
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', deliveryRoutes);
=======
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4

app.use(notFound);
app.use(errorHandler);

export default app;
