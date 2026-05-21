import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import { errorHandler } from './middleware/errorHandler';
import { addSSEClient } from './lib/sse';
import { getWasender } from './config/wasender';

// ── Moduli dominio (1 modulo ≈ 1 pagina frontend) ──
import customersRouter      from './modules/customers/routes';
import ordersRouter         from './modules/orders/routes';
import productsRouter       from './modules/products/routes';
import subscriptionsRouter  from './modules/subscriptions/routes';
import purchasesRouter      from './modules/purchases/routes';
import expensesRouter       from './modules/expenses/routes';

// Communications (gestita dalla pagina Communications)
import conversationsRouter  from './modules/communications/conversations.routes';
import msgTemplatesRouter   from './modules/communications/msgTemplates.routes';
import wasenderRouter       from './modules/communications/wasender.routes';

// Settings (4 entità di configurazione)
import channelsRouter           from './modules/settings/channels.routes';
import suppliersRouter          from './modules/settings/suppliers.routes';
import productTypesRouter       from './modules/settings/productTypes.routes';
import expenseCategoriesRouter  from './modules/settings/expenseCategories.routes';

// Dashboard & Reports (analytics)
import analyticsRouter      from './modules/dashboard/analytics.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

// Wasender webhook needs raw body for signature verification — must be before express.json()
app.use('/api/wasender', wasenderRouter);

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server funzionante!' });
});

// SSE — push eventi real-time al frontend
app.get('/api/events', (_req, res) => {
  addSSEClient(res);
  // Interroga Wasender per lo stato sessione corrente e lo invia subito al client
  const wasender = getWasender();
  if (wasender) {
    wasender.getSessionStatus()
      .then(result => {
        const status = result?.response?.status || 'unknown';
        res.write(`event: session-status\ndata: ${JSON.stringify({ status })}\n\n`);
      })
      .catch(() => {}); // silenzioso — non blocca l'SSE
  }
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

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../public');
  app.use(express.static(clientDist));
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Error handler (must be last)
app.use(errorHandler);

// Avvia server
app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});