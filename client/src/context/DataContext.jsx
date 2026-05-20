// Context condiviso per tutti i dati dell'app — CRUD via API
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';

// ─── CONTEXT ───
const DataContext = createContext(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// Helper per generare ID (legacy, backend genera IDs ora)
let _counter = Date.now();
export const genId = (prefix = '') => prefix + (++_counter).toString(36);

// Helper formattazione
export const fmt = n => '€ ' + Number(n).toLocaleString('it-IT');

// Helper colori derivati
function enrichChannel(ch) {
  if (!ch.color) return ch;
  const hex = ch.color;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return { ...ch, dim:`rgba(${r},${g},${b},0.12)`, bord:`rgba(${r},${g},${b},0.3)` };
}

// Normalizza date in formato "18 mag"
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// Normalizza prodotto
function normalizeProduct(p) {
  return { ...p, type: p.typeKey || p.type };
}

// Normalizza ordine API → shape frontend
function normalizeOrder(o) {
  return { ...o, channel: o.channelId || o.channel, status: (o.status || '').toLowerCase(), date: o.date ? fmtDate(o.date) : o.date, _rawDate: o.date };
}

// Normalizza cliente
function normalizeCustomer(c) {
  return { ...c, orders: c.ordersCount ?? c.orders ?? 0, last: c.lastOrderDate ? fmtDate(c.lastOrderDate) : (c.last || '—') };
}

// Normalizza abbonamento
function normalizeSubscription(s) {
  return { ...s, _rawNext: s.nextDate || s.next, next: s.nextDate ? fmtDate(s.nextDate) : (s.next || '—'), status: (s.status || '').toLowerCase() };
}

// Normalizza acquisto
function normalizePurchase(p) {
  const rawDate = p.date;
  return { ...p, _rawDate: rawDate, supplier: p.supplier?.name || p.supplierName || p.supplier, date: rawDate ? fmtDate(rawDate) : rawDate, status: (p.status || '').toLowerCase() };
}

// Normalizza spesa
function normalizeExpense(e) {
  const rawDate = e.date;
  return { ...e, _rawDate: rawDate, cat: e.catKey || e.cat, date: rawDate ? fmtDate(rawDate) : rawDate, channel: e.channelId || e.channel };
}

// Normalizza conversazione
function normalizeConversation(c) {
  return {
    ...c,
    status: (c.status || '').toLowerCase(),
    messages: (c.messages || []).map(m => ({
      ...m,
      dir: (m.direction || m.dir || '').toLowerCase(),
      ts: m.createdAt ? fmtDate(m.createdAt) : (m.ts || ''),
    })),
  };
}

export function DataProvider({ children }) {
  const [channels, setChannels]           = useState([]);
  const [productTypes, setProductTypes]   = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [products, setProducts]           = useState([]);
  const [customers, setCustomers]         = useState([]);
  const [orders, setOrders]               = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [purchases, setPurchases]         = useState([]);
  const [expenses, setExpenses]           = useState([]);
  const [suppliers, setSuppliers]         = useState([]);
  const [conversations, setConversations] = useState([]);
  const [msgTemplates, setMsgTemplates]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [toast, setToast]                 = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
  }, []);
  const hideToast = useCallback(() => setToast(t => ({ ...t, show: false })), []);

  // ─── Fetch all data on mount ───
  const refreshAll = useCallback(async () => {
    try {
      const [ch, pt, ec, sup, prod, cust, ord, subs, purch, exp, conv, tpl] = await Promise.all([
        api.channels.list(),
        api.productTypes.list(),
        api.expenseCategories.list(),
        api.suppliers.list(),
        api.products.list(),
        api.customers.list(),
        api.orders.list(),
        api.subscriptions.list(),
        api.purchases.list(),
        api.expenses.list(),
        api.conversations.list(),
        api.msgTemplates.list(),
      ]);
      setChannels(ch.map(enrichChannel));
      setProductTypes(pt);
      setExpenseCategories(ec);
      setSuppliers(sup);
      setProducts(prod.map(normalizeProduct));
      setCustomers(cust.map(normalizeCustomer));
      setOrders(ord.map(normalizeOrder));
      setSubscriptions(subs.map(normalizeSubscription));
      setPurchases(purch.map(normalizePurchase));
      setExpenses(exp.map(normalizeExpense));
      setConversations(conv.map(normalizeConversation));
      setMsgTemplates(tpl);
    } catch (e) {
      console.error('Fetch error:', e);
      showToast('Errore caricamento dati', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // ─── Refresh singole entità ───
  const refreshChannels       = useCallback(async () => { const d = await api.channels.list(); setChannels(d.map(enrichChannel)); }, []);
  const refreshProducts       = useCallback(async () => { const d = await api.products.list(); setProducts(d.map(normalizeProduct)); }, []);
  const refreshCustomers      = useCallback(async () => { const d = await api.customers.list(); setCustomers(d.map(normalizeCustomer)); }, []);
  const refreshOrders         = useCallback(async () => { const d = await api.orders.list(); setOrders(d.map(normalizeOrder)); }, []);
  const refreshSubscriptions  = useCallback(async () => { const d = await api.subscriptions.list(); setSubscriptions(d.map(normalizeSubscription)); }, []);
  const refreshPurchases      = useCallback(async () => { const d = await api.purchases.list(); setPurchases(d.map(normalizePurchase)); }, []);
  const refreshExpenses       = useCallback(async () => { const d = await api.expenses.list(); setExpenses(d.map(normalizeExpense)); }, []);
  const refreshConversations  = useCallback(async () => { const d = await api.conversations.list(); setConversations(d.map(normalizeConversation)); }, []);

  // ─── CRUD helpers (single round-trip, use response directly) ───
  const createChannel = useCallback(async (data) => { const r = await api.channels.create(data); setChannels(prev => [...prev, enrichChannel(r)]); }, []);
  const updateChannel = useCallback(async (id, data) => { const r = await api.channels.update(id, data); setChannels(prev => prev.map(c => c.id === id ? enrichChannel(r) : c)); }, []);
  const deleteChannel = useCallback(async (id) => { await api.channels.delete(id); setChannels(prev => prev.filter(c => c.id !== id)); }, []);

  const createProduct = useCallback(async (data) => { const r = await api.products.create(data); setProducts(prev => [...prev, normalizeProduct(r)]); }, []);
  const updateProduct = useCallback(async (id, data) => { const r = await api.products.update(id, data); setProducts(prev => prev.map(p => p.id === id ? normalizeProduct(r) : p)); }, []);
  const deleteProduct = useCallback(async (id) => { await api.products.delete(id); setProducts(prev => prev.filter(p => p.id !== id)); }, []);

  const createCustomer = useCallback(async (data) => { const r = await api.customers.create(data); setCustomers(prev => [...prev, normalizeCustomer(r)]); }, []);
  const updateCustomer = useCallback(async (id, data) => { const r = await api.customers.update(id, data); setCustomers(prev => prev.map(c => c.id === id ? normalizeCustomer(r) : c)); }, []);
  const deleteCustomer = useCallback(async (id) => { await api.customers.delete(id); setCustomers(prev => prev.filter(c => c.id !== id)); }, []);

  const createOrder = useCallback(async (data) => { const r = await api.orders.create(data); setOrders(prev => [normalizeOrder(r), ...prev]); return r; }, []);
  const updateOrder = useCallback(async (id, data) => { const r = await api.orders.update(id, data); setOrders(prev => prev.map(o => o.id === id ? normalizeOrder(r) : o)); }, []);
  const deleteOrder = useCallback(async (id) => { await api.orders.delete(id); setOrders(prev => prev.filter(o => o.id !== id)); }, []);

  const createSubscription = useCallback(async (data) => { const r = await api.subscriptions.create(data); setSubscriptions(prev => [...prev, normalizeSubscription(r)]); }, []);
  const updateSubscription = useCallback(async (id, data) => { const r = await api.subscriptions.update(id, data); setSubscriptions(prev => prev.map(s => s.id === id ? normalizeSubscription(r) : s)); }, []);
  const deleteSubscription = useCallback(async (id) => { await api.subscriptions.delete(id); setSubscriptions(prev => prev.filter(s => s.id !== id)); }, []);

  const createPurchase = useCallback(async (data) => { const r = await api.purchases.create(data); setPurchases(prev => [normalizePurchase(r), ...prev]); }, []);
  const updatePurchase = useCallback(async (id, data) => { const r = await api.purchases.update(id, data); setPurchases(prev => prev.map(p => p.id === id ? normalizePurchase(r) : p)); }, []);
  const deletePurchase = useCallback(async (id) => { await api.purchases.delete(id); setPurchases(prev => prev.filter(p => p.id !== id)); }, []);

  const createExpense = useCallback(async (data) => { const r = await api.expenses.create(data); setExpenses(prev => [normalizeExpense(r), ...prev]); }, []);
  const updateExpense = useCallback(async (id, data) => { const r = await api.expenses.update(id, data); setExpenses(prev => prev.map(e => e.id === id ? normalizeExpense(r) : e)); }, []);
  const deleteExpense = useCallback(async (id) => { await api.expenses.delete(id); setExpenses(prev => prev.filter(e => e.id !== id)); }, []);

  const createConversation = useCallback(async (data) => { const r = await api.conversations.create(data); setConversations(prev => [normalizeConversation(r), ...prev]); }, []);
  const updateConversation = useCallback(async (id, data) => { const r = await api.conversations.update(id, data); setConversations(prev => prev.map(c => c.id === id ? normalizeConversation(r) : c)); }, []);
  const deleteConversation = useCallback(async (id) => { await api.conversations.delete(id); setConversations(prev => prev.filter(c => c.id !== id)); }, []);
  const sendMessage = useCallback(async (convId, data) => { await api.conversations.addMessage(convId, data); await refreshConversations(); }, [refreshConversations]);

  const createMsgTemplate = useCallback(async (data) => { const r = await api.msgTemplates.create(data); setMsgTemplates(prev => [...prev, r]); }, []);
  const updateMsgTemplate = useCallback(async (id, data) => { const r = await api.msgTemplates.update(id, data); setMsgTemplates(prev => prev.map(t => t.id === id ? r : t)); }, []);
  const deleteMsgTemplate = useCallback(async (id) => { await api.msgTemplates.delete(id); setMsgTemplates(prev => prev.filter(t => t.id !== id)); }, []);

  const createSupplier = useCallback(async (data) => { const r = await api.suppliers.create(data); setSuppliers(prev => [...prev, r]); }, []);
  const updateSupplier = useCallback(async (id, data) => { const r = await api.suppliers.update(id, data); setSuppliers(prev => prev.map(s => s.id === id ? r : s)); }, []);
  const deleteSupplier = useCallback(async (id) => { await api.suppliers.delete(id); setSuppliers(prev => prev.filter(s => s.id !== id)); }, []);

  const createProductType = useCallback(async (data) => { const r = await api.productTypes.create(data); setProductTypes(prev => [...prev, r]); }, []);
  const createExpenseCategory = useCallback(async (data) => { const r = await api.expenseCategories.create(data); setExpenseCategories(prev => [...prev, r]); }, []);

  // ─── Lookup helpers ───
  const getChannel = useCallback((id) => channels.find(c => c.id === id), [channels]);
  const getCustomer = useCallback((id) => customers.find(c => c.id === id), [customers]);
  const getProduct = useCallback((id) => products.find(p => p.id === id), [products]);
  const getProductType = useCallback((key) => productTypes.find(t => t.key === key), [productTypes]);
  const getExpenseCat = useCallback((key) => expenseCategories.find(c => c.key === key), [expenseCategories]);

  const value = {
    // Data arrays
    channels, productTypes, expenseCategories, products, customers,
    orders, subscriptions, purchases, expenses, suppliers,
    conversations, msgTemplates,
    // Legacy setters (for backward compat where pages haven't migrated yet)
    setChannels, setProductTypes, setExpenseCategories, setProducts,
    setCustomers, setOrders, setSubscriptions, setPurchases,
    setExpenses, setSuppliers, setConversations, setMsgTemplates,
    // CRUD helpers (preferred)
    createChannel, updateChannel, deleteChannel,
    createProduct, updateProduct, deleteProduct,
    createCustomer, updateCustomer, deleteCustomer,
    createOrder, updateOrder, deleteOrder,
    createSubscription, updateSubscription, deleteSubscription,
    createPurchase, updatePurchase, deletePurchase,
    createExpense, updateExpense, deleteExpense,
    createConversation, updateConversation, deleteConversation, sendMessage,
    createMsgTemplate, updateMsgTemplate, deleteMsgTemplate,
    createSupplier, updateSupplier, deleteSupplier,
    createProductType, createExpenseCategory,
    // Lookups
    getChannel, getCustomer, getProduct, getProductType, getExpenseCat,
    // Utils
    loading, refreshAll,
    toast, showToast, hideToast,
    api,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
