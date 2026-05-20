import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { errorHandler } from './middleware/errorHandler';
import channelsRouter from './routes/channels';
import productTypesRouter from './routes/productTypes';
import expenseCategoriesRouter from './routes/expenseCategories';
import suppliersRouter from './routes/suppliers';
import productsRouter from './routes/products';
import customersRouter from './routes/customers';
import ordersRouter from './routes/orders';
import subscriptionsRouter from './routes/subscriptions';
import purchasesRouter from './routes/purchases';
import expensesRouter from './routes/expenses';
import conversationsRouter from './routes/conversations';
import msgTemplatesRouter from './routes/msgTemplates';
import analyticsRouter from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server funzionante!' });
});

// API Routes
app.use('/api/v1/channels', channelsRouter);
app.use('/api/v1/product-types', productTypesRouter);
app.use('/api/v1/expense-categories', expenseCategoriesRouter);
app.use('/api/v1/suppliers', suppliersRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/subscriptions', subscriptionsRouter);
app.use('/api/v1/purchases', purchasesRouter);
app.use('/api/v1/expenses', expensesRouter);
app.use('/api/v1/conversations', conversationsRouter);
app.use('/api/v1/msg-templates', msgTemplatesRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Error handler (must be last)
app.use(errorHandler);

// Avvia server
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});