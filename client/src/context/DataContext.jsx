// Context condiviso per tutti i dati dell'app — CRUD client-side
import { createContext, useContext, useState, useCallback } from 'react';

// ─── DATI INIZIALI (matching template + schema Prisma) ───

const INIT_CHANNELS = [
  { id:'ch1', name:'Facebook',    color:'#1877f2', dim:'rgba(24,119,242,0.12)',  bord:'rgba(24,119,242,0.3)' },
  { id:'ch2', name:'Google',      color:'#34a853', dim:'rgba(52,168,83,0.12)',   bord:'rgba(52,168,83,0.3)'  },
  { id:'ch3', name:'Instagram',   color:'#e1306c', dim:'rgba(225,48,108,0.12)',  bord:'rgba(225,48,108,0.3)' },
  { id:'ch4', name:'Diretto',     color:'#818cf8', dim:'rgba(129,140,248,0.15)', bord:'rgba(129,140,248,0.3)'},
  { id:'ch5', name:'Marketplace', color:'#f59e0b', dim:'rgba(245,158,11,0.12)',  bord:'rgba(245,158,11,0.3)' },
  { id:'ch6', name:'Passaparola', color:'#22c55e', dim:'rgba(34,197,94,0.12)',   bord:'rgba(34,197,94,0.3)'  },
  { id:'ch7', name:'WhatsApp',    color:'#25d366', dim:'rgba(37,211,102,0.12)',  bord:'rgba(37,211,102,0.3)' },
];

const INIT_PRODUCT_TYPES = [
  { id:'pt1', key:'obd',      label:'OBD',         icon:'🔌' },
  { id:'pt2', key:'pc_tablet', label:'PC / Tablet', icon:'💻' },
  { id:'pt3', key:'software', label:'Software',    icon:'💿' },
  { id:'pt4', key:'service',  label:'Servizio',    icon:'🔧' },
  { id:'pt5', key:'sub',      label:'Abbonamento', icon:'♻️' },
  { id:'pt6', key:'accessory',label:'Accessorio',  icon:'🔗' },
];

const INIT_EXPENSE_CATS = [
  { id:'ec1', key:'logistica',  label:'Logistica',  color:'#818cf8', icon:'📦' },
  { id:'ec2', key:'marketing',  label:'Marketing',  color:'#e1306c', icon:'📣' },
  { id:'ec3', key:'software',   label:'Software',   color:'#22c55e', icon:'💿' },
  { id:'ec4', key:'carburante', label:'Carburante', color:'#f59e0b', icon:'⛽' },
  { id:'ec5', key:'generale',   label:'Generale',   color:'#a1a1aa', icon:'📄' },
];

const INIT_PRODUCTS = [
  { id:'p1', sku:'OBD-PRO-01',  name:'OBD Scanner Pro Kit', type:'obd',      price:450, cost:180, stock:2,  lowStock:5  },
  { id:'p2', sku:'OBD-BASE-01', name:'OBD Scanner Base',    type:'obd',      price:180, cost:65,  stock:14, lowStock:5  },
  { id:'p3', sku:'LIC-AUTEL',   name:'Licenza Autel MS906', type:'software', price:320, cost:140, stock:null },
  { id:'p4', sku:'SRV-FULL',    name:'Diagnosi Full Check', type:'service',  price:150, cost:35,  stock:null },
  { id:'p5', sku:'SRV-BASE',    name:'Diagnosi Base',       type:'service',  price:70,  cost:15,  stock:null },
  { id:'p6', sku:'SRV-ECU',     name:'Ricodifica ECU',      type:'service',  price:225, cost:40,  stock:null },
  { id:'p7', sku:'SUB-PRO',     name:'Abbonamento Pro',     type:'sub',      price:200, cost:30,  stock:null },
  { id:'p8', sku:'CAB-OBD',     name:'Cavo OBD-II',         type:'accessory',price:35,  cost:12,  stock:28, lowStock:10 },
];

const INIT_CUSTOMERS = [
  { id:'c1', name:'Marco Ferrari',  city:'Milano',  orders:5, ltv:1240, last:'18 mag', firstChannel:'ch1' },
  { id:'c2', name:'Giulia Rossi',   city:'Roma',    orders:3, ltv:680,  last:'17 mag', firstChannel:'ch4' },
  { id:'c3', name:'Luca Bianchi',   city:'Torino',  orders:4, ltv:540,  last:'16 mag', firstChannel:'ch2' },
  { id:'c4', name:'Anna Conti',     city:'Napoli',  orders:2, ltv:350,  last:'15 mag', firstChannel:'ch3' },
  { id:'c5', name:'Paolo Greco',    city:'Bologna', orders:6, ltv:1580, last:'14 mag', firstChannel:'ch5' },
  { id:'c6', name:'Elena Marini',   city:'Firenze', orders:3, ltv:520,  last:'13 mag', firstChannel:'ch7' },
  { id:'c7', name:'Stefano Bruno',  city:'Genova',  orders:2, ltv:490,  last:'12 mag', firstChannel:'ch1' },
];

const INIT_ORDERS = [
  { id:'o1', orderNumber:'#1042', date:'18 mag', customerId:'c1', productId:'p1', channel:'ch1', total:450, cogs:195, status:'paid'    },
  { id:'o2', orderNumber:'#1041', date:'17 mag', customerId:'c2', productId:'p7', channel:'ch4', total:200, cogs:30,  status:'active'  },
  { id:'o3', orderNumber:'#1040', date:'16 mag', customerId:'c3', productId:'p5', channel:'ch2', total:70,  cogs:15,  status:'paid'    },
  { id:'o4', orderNumber:'#1039', date:'15 mag', customerId:'c4', productId:'p4', channel:'ch3', total:150, cogs:35,  status:'paid'    },
  { id:'o5', orderNumber:'#1038', date:'14 mag', customerId:'c5', productId:'p2', channel:'ch5', total:250, cogs:90,  status:'shipped' },
  { id:'o6', orderNumber:'#1037', date:'13 mag', customerId:'c6', productId:'p6', channel:'ch7', total:225, cogs:40,  status:'paid'    },
  { id:'o7', orderNumber:'#1036', date:'12 mag', customerId:'c7', productId:'p3', channel:'ch1', total:320, cogs:140, status:'paid'    },
  { id:'o8', orderNumber:'#1035', date:'11 mag', customerId:'c1', productId:'p1', channel:'ch1', total:450, cogs:195, status:'pending' },
  { id:'o9', orderNumber:'#1034', date:'10 mag', customerId:'c1', productId:'p4', channel:'ch6', total:150, cogs:35,  status:'paid'    },
];

const INIT_SUBSCRIPTIONS = [
  { id:'s1', customerId:'c3', plan:'Abbonamento Pro', mrr:200, next:'22 mag', status:'expiring' },
  { id:'s2', customerId:'c4', plan:'Abbonamento Pro', mrr:200, next:'25 mag', status:'expiring' },
  { id:'s3', customerId:'c2', plan:'Abbonamento Pro', mrr:200, next:'17 giu', status:'active'   },
  { id:'s4', customerId:'c1', plan:'Abbonamento Pro', mrr:200, next:'02 giu', status:'active'   },
  { id:'s5', customerId:'c5', plan:'Abbonamento Pro', mrr:200, next:'14 giu', status:'active'   },
  { id:'s6', customerId:'c6', plan:'Abbonamento Pro', mrr:200, next:'08 giu', status:'active'   },
];

const INIT_PURCHASES = [
  { id:'pu1', poNumber:'PO-018', date:'15 mag', supplier:'AutoTools SRL', items:'OBD Scanner Pro ×10, Cavi ×50', total:2400, status:'intransit' },
  { id:'pu2', poNumber:'PO-017', date:'08 mag', supplier:'Autel Italy',   items:'Licenze MS906 ×5',              total:700,  status:'received'  },
  { id:'pu3', poNumber:'PO-016', date:'02 mag', supplier:'TechParts EU',  items:'OBD Scanner Base ×8',           total:520,  status:'received'  },
];

const INIT_EXPENSES = [
  { id:'e1', date:'17 mag', cat:'logistica',  desc:'Pluriball + scatole (riordino)',     amount:67,  channel:null  },
  { id:'e2', date:'15 mag', cat:'marketing',  desc:'Spend Facebook Ads',                 amount:340, channel:'ch1' },
  { id:'e3', date:'15 mag', cat:'marketing',  desc:'Spend Google Ads',                   amount:180, channel:'ch2' },
  { id:'e4', date:'14 mag', cat:'software',   desc:'Rinnovo software diagnostica',       amount:49,  channel:null  },
  { id:'e5', date:'12 mag', cat:'carburante', desc:'Carburante furgone consegne',        amount:60,  channel:null  },
];

const INIT_CONVERSATIONS = [
  { id:'conv1', contactName:'Marco Ferrari', phone:'+39 333 1234567', customerId:'c1', orderId:'o1', status:'converted',
    messages:[
      { id:'m1', dir:'in',  text:'Buongiorno, avete ancora disponibilità per OBD Scanner Pro?', ts:'14 mag 09:12', auto:false },
      { id:'m2', dir:'out', text:'Ciao Marco! Sì, ne abbiamo 2 in magazzino. Ti mando il link per l\'ordine.', ts:'14 mag 09:15', auto:false },
      { id:'m3', dir:'out', text:'Ecco il link al tuo preventivo: https://autodiag.it/prev/1042', ts:'14 mag 09:16', auto:true },
      { id:'m4', dir:'in',  text:'Perfetto, ordine fatto! Grazie mille', ts:'14 mag 10:02', auto:false },
      { id:'m5', dir:'out', text:'Ordine confermato! Ti mandiamo tracking appena spediamo 🚀', ts:'14 mag 10:03', auto:true },
    ]
  },
  { id:'conv2', contactName:'Anna Conti', phone:'+39 347 9876543', customerId:'c4', orderId:null, status:'link_sent',
    messages:[
      { id:'m6', dir:'in',  text:'Salve, quanto costa la diagnosi full check?', ts:'16 mag 14:22', auto:false },
      { id:'m7', dir:'out', text:'Ciao Anna! La Diagnosi Full Check costa €150. Vuoi prenotare?', ts:'16 mag 14:30', auto:false },
      { id:'m8', dir:'in',  text:'Sì mi interessa, come funziona?', ts:'16 mag 14:45', auto:false },
      { id:'m9', dir:'out', text:'Ti mando tutti i dettagli: https://autodiag.it/serv/full-check', ts:'16 mag 14:47', auto:true },
    ]
  },
  { id:'conv3', contactName:'Giuseppe Mancini', phone:'+39 320 5551234', customerId:null, orderId:null, status:'new_lead',
    messages:[
      { id:'m10', dir:'in', text:'Ciao, ho visto la vostra pubblicità su Instagram. Fate anche ricodifica ECU per BMW?', ts:'18 mag 16:05', auto:false },
    ]
  },
  { id:'conv4', contactName:'Giulia Rossi', phone:'+39 338 7771234', customerId:'c2', orderId:null, status:'contacted',
    messages:[
      { id:'m11', dir:'in',  text:'Ciao, volevo info sull\'abbonamento Pro', ts:'17 mag 11:00', auto:false },
      { id:'m12', dir:'out', text:'Ciao Giulia! L\'abbonamento Pro include aggiornamenti illimitati + supporto prioritario a €200/mese. Ti interessa?', ts:'17 mag 11:12', auto:false },
      { id:'m13', dir:'in',  text:'Ci penso e ti faccio sapere', ts:'17 mag 11:20', auto:false },
    ]
  },
  { id:'conv5', contactName:'Roberto Neri', phone:'+39 340 1112233', customerId:null, orderId:null, status:'lost',
    messages:[
      { id:'m14', dir:'in',  text:'Buongiorno, prezzo scanner OBD base?', ts:'10 mag 09:30', auto:false },
      { id:'m15', dir:'out', text:'Ciao! OBD Scanner Base a €180. Ti mando il link?', ts:'10 mag 09:35', auto:false },
      { id:'m16', dir:'out', text:'Ci sei ancora? Il tuo carrello ti aspetta 😉', ts:'13 mag 10:00', auto:true },
    ]
  },
];

const INIT_MSG_TEMPLATES = [
  { id:'tpl1', label:'Preventivo', text:'Ecco il link al tuo preventivo: {{link}}' },
  { id:'tpl2', label:'Ordine confermato', text:'Ordine confermato! Ti mandiamo tracking appena spediamo 🚀' },
  { id:'tpl3', label:'Follow-up', text:'Ci sei ancora? Il tuo carrello ti aspetta 😉' },
  { id:'tpl4', label:'Benvenuto', text:'Ciao {{nome}}! Come posso aiutarti?' },
];

// ─── CONTEXT ───
const DataContext = createContext(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// Helper per generare ID unico
let _counter = Date.now();
export const genId = (prefix = '') => prefix + (++_counter).toString(36);

// Helper formattazione
export const fmt = n => '€ ' + Number(n).toLocaleString('it-IT');

export function DataProvider({ children }) {
  const [channels, setChannels]           = useState(INIT_CHANNELS);
  const [productTypes, setProductTypes]   = useState(INIT_PRODUCT_TYPES);
  const [expenseCategories, setExpenseCategories] = useState(INIT_EXPENSE_CATS);
  const [products, setProducts]           = useState(INIT_PRODUCTS);
  const [customers, setCustomers]         = useState(INIT_CUSTOMERS);
  const [orders, setOrders]               = useState(INIT_ORDERS);
  const [subscriptions, setSubscriptions] = useState(INIT_SUBSCRIPTIONS);
  const [purchases, setPurchases]         = useState(INIT_PURCHASES);
  const [expenses, setExpenses]           = useState(INIT_EXPENSES);
  const [conversations, setConversations] = useState(INIT_CONVERSATIONS);
  const [msgTemplates, setMsgTemplates]   = useState(INIT_MSG_TEMPLATES);
  const [toast, setToast]                 = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
  }, []);
  const hideToast = useCallback(() => setToast(t => ({ ...t, show: false })), []);

  // ─── Lookup helpers ───
  const getChannel = useCallback((id) => channels.find(c => c.id === id), [channels]);
  const getCustomer = useCallback((id) => customers.find(c => c.id === id), [customers]);
  const getProduct = useCallback((id) => products.find(p => p.id === id), [products]);
  const getProductType = useCallback((key) => productTypes.find(t => t.key === key), [productTypes]);
  const getExpenseCat = useCallback((key) => expenseCategories.find(c => c.key === key), [expenseCategories]);

  const value = {
    // Data
    channels, setChannels,
    productTypes, setProductTypes,
    expenseCategories, setExpenseCategories,
    products, setProducts,
    customers, setCustomers,
    orders, setOrders,
    subscriptions, setSubscriptions,
    purchases, setPurchases,
    expenses, setExpenses,
    conversations, setConversations,
    msgTemplates, setMsgTemplates,
    // Lookups
    getChannel, getCustomer, getProduct, getProductType, getExpenseCat,
    // Toast
    toast, showToast, hideToast,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
