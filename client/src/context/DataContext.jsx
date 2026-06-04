// Context condiviso per tutti i dati dell'app — CRUD via API
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';
import { dashCache } from '../lib/dashboardCache';

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
    activities: (c.activities || []).map(a => ({
      ...a,
      type: (a.type || '').toLowerCase(),
      ts: a.createdAt ? fmtDate(a.createdAt) : '',
      tsRaw: a.createdAt,
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
  const [convGroups, setConvGroups]       = useState([]);
  const [msgTemplates, setMsgTemplates]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [whatsappStatus, setWhatsappStatus] = useState('unknown');
  const [toast, setToast]                 = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
  }, []);
  const hideToast = useCallback(() => setToast(t => ({ ...t, show: false })), []);

  // ─── Fetch all data on mount ───
  const refreshAll = useCallback(async () => {
    try {
      const [ch, pt, ec, sup, prod, cust, ord, subs, purch, exp, conv, grps, tpl] = await Promise.all([
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
        api.convGroups.list(),
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
      setConvGroups(grps);
      setMsgTemplates(tpl);
    } catch (e) {
      console.error('Fetch error:', e);
      showToast('Errore caricamento dati', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // Prefetch dati Dashboard (periodo 'month') in background, dopo il caricamento iniziale.
  // Non blocca la LoadingGate. Riempie dashCache così la Dashboard renderizza istantaneamente.
  useEffect(() => {
    if (loading) return;
    Promise.all([
      api.analytics.overview('month'),
      api.analytics.channels('month'),
      api.analytics.recentTransactions(6),
    ])
      .then(([overview, channels, transactions]) => {
        dashCache.month = { overview, channels, transactions };
      })
      .catch(() => {}); // silenzioso: la Dashboard farà comunque il fetch al mount
  }, [loading]);

  // ─── Refresh singole entità ───
  const refreshChannels       = useCallback(async () => { const d = await api.channels.list(); setChannels(d.map(enrichChannel)); }, []);
  const refreshProducts       = useCallback(async () => { const d = await api.products.list(); setProducts(d.map(normalizeProduct)); }, []);
  const refreshCustomers      = useCallback(async () => { const d = await api.customers.list(); setCustomers(d.map(normalizeCustomer)); }, []);
  const refreshOrders         = useCallback(async () => { const d = await api.orders.list(); setOrders(d.map(normalizeOrder)); }, []);
  const refreshSubscriptions  = useCallback(async () => { const d = await api.subscriptions.list(); setSubscriptions(d.map(normalizeSubscription)); }, []);
  const refreshPurchases      = useCallback(async () => { const d = await api.purchases.list(); setPurchases(d.map(normalizePurchase)); }, []);
  const refreshExpenses       = useCallback(async () => { const d = await api.expenses.list(); setExpenses(d.map(normalizeExpense)); }, []);
  const refreshConversations  = useCallback(async () => { const d = await api.conversations.list(); setConversations(d.map(normalizeConversation)); }, []);

  // SSE — connessione persistente per aggiornamenti real-time WhatsApp (dopo la def. di refreshConversations)
  useEffect(() => {
    const es = new EventSource('/api/events');
    es.addEventListener('new-message', () => refreshConversations());
    es.addEventListener('session-status', (e) => {
      const { status } = JSON.parse(e.data);
      setWhatsappStatus(status);
    });
    es.addEventListener('message-failed', (e) => {
      const { error } = JSON.parse(e.data);
      showToast(`Messaggio non inviato: ${error}`, 'error');
    });
    return () => es.close();
  }, [refreshConversations, showToast]);

  // ─── CRUD helpers (Optimistic UI) ───
  // Pattern: aggiorno lo state subito con dati ottimistici (id temporaneo),
  // poi sincronizzo con il backend in background. In caso di errore: rollback + toast.
  const tempId = () => '_temp_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);

  // Helper generico: applica update ottimistico + sync in background
  const optimisticCreate = (setState, normalize, apiCall, optimisticItem, errorLabel) => {
    const tId = optimisticItem.id;
    setState(prev => [optimisticItem, ...prev]);
    apiCall()
      .then(real => setState(prev => prev.map(x => x.id === tId ? normalize(real) : x)))
      .catch(e => {
        setState(prev => prev.filter(x => x.id !== tId));
        showToast(e.message || errorLabel, 'error');
      });
  };
  const optimisticUpdate = (setState, normalize, apiCall, id, patch, errorLabel) => {
    let snapshot;
    setState(cur => { snapshot = cur; return cur.map(x => x.id === id ? normalize({ ...x, ...patch }) : x); });
    apiCall()
      .then(real => setState(prev => prev.map(x => x.id === id ? normalize(real) : x)))
      .catch(e => { setState(snapshot); showToast(e.message || errorLabel, 'error'); });
  };
  const optimisticDelete = (setState, apiCall, id, errorLabel) => {
    let snapshot;
    setState(cur => { snapshot = cur; return cur.filter(x => x.id !== id); });
    apiCall()
      .catch(e => { setState(snapshot); showToast(e.message || errorLabel, 'error'); });
  };

  // ─── Channels ───
  const createChannel = useCallback((data) => {
    const opt = enrichChannel({ ...data, id: tempId() });
    optimisticCreate(setChannels, enrichChannel, () => api.channels.create(data), opt, 'Errore creazione canale');
  }, [showToast]);
  const updateChannel = useCallback((id, data) => optimisticUpdate(setChannels, enrichChannel, () => api.channels.update(id, data), id, data, 'Errore aggiornamento canale'), [showToast]);
  const deleteChannel = useCallback((id) => optimisticDelete(setChannels, () => api.channels.delete(id), id, 'Errore eliminazione canale'), [showToast]);

  // ─── Products ───
  const createProduct = useCallback((data) => {
    const opt = normalizeProduct({ ...data, id: tempId() });
    optimisticCreate(setProducts, normalizeProduct, () => api.products.create(data), opt, 'Errore creazione prodotto');
  }, [showToast]);
  const updateProduct = useCallback((id, data) => optimisticUpdate(setProducts, normalizeProduct, () => api.products.update(id, data), id, data, 'Errore aggiornamento prodotto'), [showToast]);
  const deleteProduct = useCallback((id) => optimisticDelete(setProducts, () => api.products.delete(id), id, 'Errore eliminazione prodotto'), [showToast]);

  // ─── Customers ───
  const createCustomer = useCallback((data) => {
    const opt = normalizeCustomer({ ...data, id: tempId(), ordersCount: 0, ltv: 0, lastOrderDate: null });
    optimisticCreate(setCustomers, normalizeCustomer, () => api.customers.create(data), opt, 'Errore creazione cliente');
  }, [showToast]);
  const updateCustomer = useCallback((id, data) => optimisticUpdate(setCustomers, normalizeCustomer, () => api.customers.update(id, data), id, data, 'Errore aggiornamento cliente'), [showToast]);
  const deleteCustomer = useCallback((id) => optimisticDelete(setCustomers, () => api.customers.delete(id), id, 'Errore eliminazione cliente'), [showToast]);

  // ─── Orders ───
  const createOrder = useCallback((data) => {
    const opt = normalizeOrder({ ...data, id: tempId(), orderNumber: data.orderNumber || '#…' });
    optimisticCreate(setOrders, normalizeOrder, () => api.orders.create(data), opt, 'Errore creazione ordine');
  }, [showToast]);
  const updateOrder = useCallback((id, data) => optimisticUpdate(setOrders, normalizeOrder, () => api.orders.update(id, data), id, data, 'Errore aggiornamento ordine'), [showToast]);
  const deleteOrder = useCallback((id) => optimisticDelete(setOrders, () => api.orders.delete(id), id, 'Errore eliminazione ordine'), [showToast]);

  // ─── Subscriptions ───
  const createSubscription = useCallback((data) => {
    const opt = normalizeSubscription({ ...data, id: tempId() });
    optimisticCreate(setSubscriptions, normalizeSubscription, () => api.subscriptions.create(data), opt, 'Errore creazione abbonamento');
  }, [showToast]);
  const updateSubscription = useCallback((id, data) => optimisticUpdate(setSubscriptions, normalizeSubscription, () => api.subscriptions.update(id, data), id, data, 'Errore aggiornamento abbonamento'), [showToast]);
  const deleteSubscription = useCallback((id) => optimisticDelete(setSubscriptions, () => api.subscriptions.delete(id), id, 'Errore eliminazione abbonamento'), [showToast]);

  // ─── Purchases ───
  const createPurchase = useCallback((data) => {
    // Per i Purchase, il normalizer cerca supplier.name; lo iniettiamo ottimisticamente
    const sup = suppliers.find(s => s.id === data.supplierId);
    const opt = normalizePurchase({ ...data, id: tempId(), supplier: sup ? { name: sup.name } : null });
    optimisticCreate(setPurchases, normalizePurchase, () => api.purchases.create(data), opt, 'Errore creazione acquisto');
  }, [showToast, suppliers]);
  const updatePurchase = useCallback((id, data) => optimisticUpdate(setPurchases, normalizePurchase, () => api.purchases.update(id, data), id, data, 'Errore aggiornamento acquisto'), [showToast]);
  const deletePurchase = useCallback((id) => optimisticDelete(setPurchases, () => api.purchases.delete(id), id, 'Errore eliminazione acquisto'), [showToast]);

  // ─── Expenses ───
  const createExpense = useCallback((data) => {
    const opt = normalizeExpense({ ...data, id: tempId() });
    optimisticCreate(setExpenses, normalizeExpense, () => api.expenses.create(data), opt, 'Errore creazione spesa');
  }, [showToast]);
  const updateExpense = useCallback((id, data) => optimisticUpdate(setExpenses, normalizeExpense, () => api.expenses.update(id, data), id, data, 'Errore aggiornamento spesa'), [showToast]);
  const deleteExpense = useCallback((id) => optimisticDelete(setExpenses, () => api.expenses.delete(id), id, 'Errore eliminazione spesa'), [showToast]);

  // ─── Conversations ───
  const createConversation = useCallback((data) => {
    const opt = normalizeConversation({ ...data, id: tempId(), messages: [], activities: [] });
    optimisticCreate(setConversations, normalizeConversation, () => api.conversations.create(data), opt, 'Errore creazione conversazione');
  }, [showToast]);
  const updateConversation = useCallback((id, data) => optimisticUpdate(setConversations, normalizeConversation, () => api.conversations.update(id, data), id, data, 'Errore aggiornamento conversazione'), [showToast]);
  const deleteConversation = useCallback((id) => optimisticDelete(setConversations, () => api.conversations.delete(id), id, 'Errore eliminazione conversazione'), [showToast]);

  const createActivity = useCallback(async (convId, data) => {
    const tAct = { id: tempId(), type: data.type.toLowerCase(), text: data.text, ts: fmtDate(new Date().toISOString()), tsRaw: new Date().toISOString() };
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, activities: [tAct, ...(c.activities || [])] } : c));
    try {
      const real = await api.conversations.addActivity(convId, data);
      const realAct = { ...real, type: (real.type || '').toLowerCase(), ts: fmtDate(real.createdAt), tsRaw: real.createdAt };
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, activities: c.activities.map(a => a.id === tAct.id ? realAct : a) } : c));
      return realAct;
    } catch (e) {
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, activities: c.activities.filter(a => a.id !== tAct.id) } : c));
      showToast(e.message || 'Errore aggiunta attività', 'error');
    }
  }, [showToast]);

  const deleteActivity = useCallback(async (convId, actId) => {
    let snapshot;
    setConversations(prev => { snapshot = prev; return prev.map(c => c.id === convId ? { ...c, activities: c.activities.filter(a => a.id !== actId) } : c); });
    try {
      await api.conversations.delActivity(convId, actId);
    } catch (e) {
      setConversations(snapshot);
      showToast(e.message || 'Errore eliminazione attività', 'error');
    }
  }, [showToast]);
  // Send message: optimistic append + sostituzione con dato reale, senza full refresh
  const sendMessage = useCallback((convId, data) => {
    const tMsg = { id: tempId(), dir: (data.direction || 'out').toLowerCase(), text: data.text, ts: fmtDate(new Date().toISOString()), auto: !!data.auto };
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...(c.messages || []), tMsg] } : c));
    api.conversations.addMessage(convId, data)
      .then(real => {
        if (!real) return;
        const realMsg = { ...real, dir: (real.direction || '').toLowerCase(), ts: fmtDate(real.createdAt) };
        setConversations(prev => prev.map(c => c.id === convId
          ? { ...c, messages: c.messages.map(m => m.id === tMsg.id ? realMsg : m) }
          : c
        ));
      })
      .catch(e => {
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: c.messages.filter(m => m.id !== tMsg.id) } : c));
        showToast(e.message || 'Errore invio messaggio', 'error');
      });
  }, [showToast]);

  // ─── ConvGroups ───
  const createConvGroup = useCallback((data) => {
    const opt = { ...data, id: tempId(), isDefault: false };
    optimisticCreate(setConvGroups, x => x, () => api.convGroups.create(data), opt, 'Errore creazione gruppo');
  }, [showToast]);
  const updateConvGroup = useCallback((id, data) => optimisticUpdate(setConvGroups, x => x, () => api.convGroups.update(id, data), id, data, 'Errore aggiornamento gruppo'), [showToast]);
  const deleteConvGroup = useCallback((id) => optimisticDelete(setConvGroups, () => api.convGroups.delete(id), id, 'Errore eliminazione gruppo'), [showToast]);

  // ─── Message Templates (no normalize) ───
  const createMsgTemplate = useCallback((data) => {
    const opt = { ...data, id: tempId() };
    optimisticCreate(setMsgTemplates, x => x, () => api.msgTemplates.create(data), opt, 'Errore creazione template');
  }, [showToast]);
  const updateMsgTemplate = useCallback((id, data) => optimisticUpdate(setMsgTemplates, x => x, () => api.msgTemplates.update(id, data), id, data, 'Errore aggiornamento template'), [showToast]);
  const deleteMsgTemplate = useCallback((id) => optimisticDelete(setMsgTemplates, () => api.msgTemplates.delete(id), id, 'Errore eliminazione template'), [showToast]);

  // ─── Suppliers (no normalize) ───
  const createSupplier = useCallback((data) => {
    const opt = { ...data, id: tempId() };
    optimisticCreate(setSuppliers, x => x, () => api.suppliers.create(data), opt, 'Errore creazione fornitore');
  }, [showToast]);
  const updateSupplier = useCallback((id, data) => optimisticUpdate(setSuppliers, x => x, () => api.suppliers.update(id, data), id, data, 'Errore aggiornamento fornitore'), [showToast]);
  const deleteSupplier = useCallback((id) => optimisticDelete(setSuppliers, () => api.suppliers.delete(id), id, 'Errore eliminazione fornitore'), [showToast]);

  // ─── Product Types & Expense Categories (no normalize) ───
  const createProductType = useCallback((data) => {
    const opt = { ...data, id: tempId() };
    optimisticCreate(setProductTypes, x => x, () => api.productTypes.create(data), opt, 'Errore creazione tipo prodotto');
  }, [showToast]);
  const createExpenseCategory = useCallback((data) => {
    const opt = { ...data, id: tempId() };
    optimisticCreate(setExpenseCategories, x => x, () => api.expenseCategories.create(data), opt, 'Errore creazione categoria');
  }, [showToast]);

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
    conversations, convGroups, msgTemplates,
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
    createConversation, updateConversation, deleteConversation, sendMessage, refreshConversations,
    createActivity, deleteActivity,
    createConvGroup, updateConvGroup, deleteConvGroup,
    createMsgTemplate, updateMsgTemplate, deleteMsgTemplate,
    createSupplier, updateSupplier, deleteSupplier,
    createProductType, createExpenseCategory,
    // Lookups
    getChannel, getCustomer, getProduct, getProductType, getExpenseCat,
    // Utils
    loading, refreshAll,
    whatsappStatus,
    toast, showToast, hideToast,
    api,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
