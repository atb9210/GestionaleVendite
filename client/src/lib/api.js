const BASE = '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Errore di rete');
  }
  if (res.status === 204) return null;
  return res.json();
}

const get    = (path) => request(path);
const post   = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put    = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
const del    = (path) => request(path, { method: 'DELETE' });

export const api = {
  channels: {
    list:   () => get('/channels'),
    create: (d) => post('/channels', d),
    update: (id, d) => put(`/channels/${id}`, d),
    delete: (id) => del(`/channels/${id}`),
  },
  productTypes: {
    list:   () => get('/product-types'),
    create: (d) => post('/product-types', d),
    update: (id, d) => put(`/product-types/${id}`, d),
    delete: (id) => del(`/product-types/${id}`),
  },
  expenseCategories: {
    list:   () => get('/expense-categories'),
    create: (d) => post('/expense-categories', d),
    update: (id, d) => put(`/expense-categories/${id}`, d),
    delete: (id) => del(`/expense-categories/${id}`),
  },
  suppliers: {
    list:   () => get('/suppliers'),
    create: (d) => post('/suppliers', d),
    update: (id, d) => put(`/suppliers/${id}`, d),
    delete: (id) => del(`/suppliers/${id}`),
  },
  products: {
    list:   () => get('/products'),
    create: (d) => post('/products', d),
    update: (id, d) => put(`/products/${id}`, d),
    delete: (id) => del(`/products/${id}`),
  },
  customers: {
    list:   () => get('/customers'),
    create: (d) => post('/customers', d),
    update: (id, d) => put(`/customers/${id}`, d),
    delete: (id) => del(`/customers/${id}`),
  },
  orders: {
    list:   () => get('/orders'),
    create: (d) => post('/orders', d),
    update: (id, d) => put(`/orders/${id}`, d),
    delete: (id) => del(`/orders/${id}`),
    nextNumber: () => get('/orders/next-number'),
  },
  subscriptions: {
    list:   () => get('/subscriptions'),
    create: (d) => post('/subscriptions', d),
    update: (id, d) => put(`/subscriptions/${id}`, d),
    delete: (id) => del(`/subscriptions/${id}`),
  },
  purchases: {
    list:   () => get('/purchases'),
    create: (d) => post('/purchases', d),
    update: (id, d) => put(`/purchases/${id}`, d),
    delete: (id) => del(`/purchases/${id}`),
  },
  expenses: {
    list:   () => get('/expenses'),
    create: (d) => post('/expenses', d),
    update: (id, d) => put(`/expenses/${id}`, d),
    delete: (id) => del(`/expenses/${id}`),
  },
  conversations: {
    list:   () => get('/conversations'),
    create: (d) => post('/conversations', d),
    update: (id, d) => put(`/conversations/${id}`, d),
    delete: (id) => del(`/conversations/${id}`),
    addMessage: (id, d) => post(`/conversations/${id}/messages`, d),
  },
  msgTemplates: {
    list:   () => get('/msg-templates'),
    create: (d) => post('/msg-templates', d),
    update: (id, d) => put(`/msg-templates/${id}`, d),
    delete: (id) => del(`/msg-templates/${id}`),
  },
  analytics: {
    overview: () => get('/analytics/overview'),
    revenue:  (period) => get(`/analytics/revenue?period=${period || '30d'}`),
    channels: () => get('/analytics/channels'),
    products: () => get('/analytics/products'),
  },
};
