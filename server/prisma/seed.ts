import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing data (in correct order for FK constraints)
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.order.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.productType.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.msgTemplate.deleteMany();

  // ─── CHANNELS ───
  const channels = await Promise.all([
    prisma.channel.create({ data: { id: 'ch1', name: 'Facebook',    color: '#1877f2' } }),
    prisma.channel.create({ data: { id: 'ch2', name: 'Google',      color: '#34a853' } }),
    prisma.channel.create({ data: { id: 'ch3', name: 'Instagram',   color: '#e1306c' } }),
    prisma.channel.create({ data: { id: 'ch4', name: 'Diretto',     color: '#818cf8' } }),
    prisma.channel.create({ data: { id: 'ch5', name: 'Marketplace', color: '#f59e0b' } }),
    prisma.channel.create({ data: { id: 'ch6', name: 'Passaparola', color: '#22c55e' } }),
    prisma.channel.create({ data: { id: 'ch7', name: 'WhatsApp',    color: '#25d366' } }),
  ]);

  // ─── PRODUCT TYPES ───
  await Promise.all([
    prisma.productType.create({ data: { id: 'pt1', key: 'obd',       label: 'OBD',         icon: '🔌' } }),
    prisma.productType.create({ data: { id: 'pt2', key: 'pc_tablet', label: 'PC / Tablet', icon: '💻' } }),
    prisma.productType.create({ data: { id: 'pt3', key: 'software',  label: 'Software',    icon: '💿' } }),
    prisma.productType.create({ data: { id: 'pt4', key: 'service',   label: 'Servizio',    icon: '🔧' } }),
    prisma.productType.create({ data: { id: 'pt5', key: 'sub',       label: 'Abbonamento', icon: '♻️' } }),
    prisma.productType.create({ data: { id: 'pt6', key: 'accessory', label: 'Accessorio',  icon: '🔗' } }),
  ]);

  // ─── EXPENSE CATEGORIES ───
  await Promise.all([
    prisma.expenseCategory.create({ data: { id: 'ec1', key: 'logistica',  label: 'Logistica',  color: '#818cf8', icon: '📦' } }),
    prisma.expenseCategory.create({ data: { id: 'ec2', key: 'marketing',  label: 'Marketing',  color: '#e1306c', icon: '📣' } }),
    prisma.expenseCategory.create({ data: { id: 'ec3', key: 'software',   label: 'Software',   color: '#22c55e', icon: '💿' } }),
    prisma.expenseCategory.create({ data: { id: 'ec4', key: 'carburante', label: 'Carburante', color: '#f59e0b', icon: '⛽' } }),
    prisma.expenseCategory.create({ data: { id: 'ec5', key: 'generale',   label: 'Generale',   color: '#a1a1aa', icon: '📄' } }),
  ]);

  // ─── SUPPLIERS ───
  await Promise.all([
    prisma.supplier.create({ data: { id: 'sup1', name: 'AutoTools SRL',  contact: 'info@autotools.it',   phone: '+39 02 1234567' } }),
    prisma.supplier.create({ data: { id: 'sup2', name: 'Autel Italy',    contact: 'vendite@autel.it',    phone: '+39 06 9876543' } }),
    prisma.supplier.create({ data: { id: 'sup3', name: 'TechParts EU',   contact: 'orders@techparts.eu', phone: '+49 30 5551234' } }),
    prisma.supplier.create({ data: { id: 'sup4', name: 'OBD Direct',     contact: 'sales@obddirect.com', phone: '+44 20 7891234' } }),
  ]);

  // ─── PRODUCTS ───
  await Promise.all([
    prisma.product.create({ data: { id: 'p1', sku: 'OBD-PRO-01',  name: 'OBD Scanner Pro Kit', typeKey: 'obd',       price: 450, cost: 180, stock: 2,    lowStock: 5  } }),
    prisma.product.create({ data: { id: 'p2', sku: 'OBD-BASE-01', name: 'OBD Scanner Base',    typeKey: 'obd',       price: 180, cost: 65,  stock: 14,   lowStock: 5  } }),
    prisma.product.create({ data: { id: 'p3', sku: 'LIC-AUTEL',   name: 'Licenza Autel MS906', typeKey: 'software',  price: 320, cost: 140, stock: null } }),
    prisma.product.create({ data: { id: 'p4', sku: 'SRV-FULL',    name: 'Diagnosi Full Check', typeKey: 'service',   price: 150, cost: 35,  stock: null } }),
    prisma.product.create({ data: { id: 'p5', sku: 'SRV-BASE',    name: 'Diagnosi Base',       typeKey: 'service',   price: 70,  cost: 15,  stock: null } }),
    prisma.product.create({ data: { id: 'p6', sku: 'SRV-ECU',     name: 'Ricodifica ECU',      typeKey: 'service',   price: 225, cost: 40,  stock: null } }),
    prisma.product.create({ data: { id: 'p7', sku: 'SUB-PRO',     name: 'Abbonamento Pro',     typeKey: 'sub',       price: 200, cost: 30,  stock: null } }),
    prisma.product.create({ data: { id: 'p8', sku: 'CAB-OBD',     name: 'Cavo OBD-II',         typeKey: 'accessory', price: 35,  cost: 12,  stock: 28,   lowStock: 10 } }),
  ]);

  // ─── CUSTOMERS ───
  await Promise.all([
    prisma.customer.create({ data: { id: 'c1', name: 'Marco Ferrari',  city: 'Milano',  ordersCount: 5, ltv: 1240, lastOrderDate: new Date('2025-05-18'), firstChannel: 'ch1', phone: { countryCode: 'IT', number: '333 1234567' } } }),
    prisma.customer.create({ data: { id: 'c2', name: 'Giulia Rossi',   city: 'Roma',    ordersCount: 3, ltv: 680,  lastOrderDate: new Date('2025-05-17'), firstChannel: 'ch4', phone: { countryCode: 'IT', number: '338 7771234' } } }),
    prisma.customer.create({ data: { id: 'c3', name: 'Luca Bianchi',   city: 'Torino',  ordersCount: 4, ltv: 540,  lastOrderDate: new Date('2025-05-16'), firstChannel: 'ch2', phone: { countryCode: 'IT', number: '347 5554321' } } }),
    prisma.customer.create({ data: { id: 'c4', name: 'Anna Conti',     city: 'Napoli',  ordersCount: 2, ltv: 350,  lastOrderDate: new Date('2025-05-15'), firstChannel: 'ch3', phone: { countryCode: 'IT', number: '347 9876543' } } }),
    prisma.customer.create({ data: { id: 'c5', name: 'Paolo Greco',    city: 'Bologna', ordersCount: 6, ltv: 1580, lastOrderDate: new Date('2025-05-14'), firstChannel: 'ch5', phone: { countryCode: 'IT', number: '320 1112233' } } }),
    prisma.customer.create({ data: { id: 'c6', name: 'Elena Marini',   city: 'Firenze', ordersCount: 3, ltv: 520,  lastOrderDate: new Date('2025-05-13'), firstChannel: 'ch7', phone: { countryCode: 'IT', number: '340 9998877' } } }),
    prisma.customer.create({ data: { id: 'c7', name: 'Stefano Bruno',  city: 'Genova',  ordersCount: 2, ltv: 490,  lastOrderDate: new Date('2025-05-12'), firstChannel: 'ch1', phone: { countryCode: 'IT', number: '335 4443322' } } }),
  ]);

  // ─── SUBSCRIPTIONS ───
  await Promise.all([
    prisma.subscription.create({ data: { id: 's1', customerId: 'c3', plan: 'Abbonamento Pro', mrr: 200, nextDate: new Date('2025-05-22'), status: 'EXPIRING' } }),
    prisma.subscription.create({ data: { id: 's2', customerId: 'c4', plan: 'Abbonamento Pro', mrr: 200, nextDate: new Date('2025-05-25'), status: 'EXPIRING' } }),
    prisma.subscription.create({ data: { id: 's3', customerId: 'c2', plan: 'Abbonamento Pro', mrr: 200, nextDate: new Date('2025-06-17'), status: 'ACTIVE' } }),
    prisma.subscription.create({ data: { id: 's4', customerId: 'c1', plan: 'Abbonamento Pro', mrr: 200, nextDate: new Date('2025-06-02'), status: 'ACTIVE' } }),
    prisma.subscription.create({ data: { id: 's5', customerId: 'c5', plan: 'Abbonamento Pro', mrr: 200, nextDate: new Date('2025-06-14'), status: 'ACTIVE' } }),
    prisma.subscription.create({ data: { id: 's6', customerId: 'c6', plan: 'Abbonamento Pro', mrr: 200, nextDate: new Date('2025-06-08'), status: 'ACTIVE' } }),
  ]);

  // ─── ORDERS ───
  await Promise.all([
    prisma.order.create({ data: { id: 'o1', orderNumber: '#1042', date: new Date('2025-05-18'), customerId: 'c1', productId: 'p1', channelId: 'ch1', total: 450, cogs: 195, status: 'PAID'    } }),
    prisma.order.create({ data: { id: 'o2', orderNumber: '#1041', date: new Date('2025-05-17'), customerId: 'c2', productId: 'p7', channelId: 'ch4', total: 200, cogs: 30,  status: 'ACTIVE'  } }),
    prisma.order.create({ data: { id: 'o3', orderNumber: '#1040', date: new Date('2025-05-16'), customerId: 'c3', productId: 'p5', channelId: 'ch2', total: 70,  cogs: 15,  status: 'PAID'    } }),
    prisma.order.create({ data: { id: 'o4', orderNumber: '#1039', date: new Date('2025-05-15'), customerId: 'c4', productId: 'p4', channelId: 'ch3', total: 150, cogs: 35,  status: 'PAID'    } }),
    prisma.order.create({ data: { id: 'o5', orderNumber: '#1038', date: new Date('2025-05-14'), customerId: 'c5', productId: 'p2', channelId: 'ch5', total: 250, cogs: 90,  status: 'SHIPPED' } }),
    prisma.order.create({ data: { id: 'o6', orderNumber: '#1037', date: new Date('2025-05-13'), customerId: 'c6', productId: 'p6', channelId: 'ch7', total: 225, cogs: 40,  status: 'PAID'    } }),
    prisma.order.create({ data: { id: 'o7', orderNumber: '#1036', date: new Date('2025-05-12'), customerId: 'c7', productId: 'p3', channelId: 'ch1', total: 320, cogs: 140, status: 'PAID'    } }),
    prisma.order.create({ data: { id: 'o8', orderNumber: '#1035', date: new Date('2025-05-11'), customerId: 'c1', productId: 'p1', channelId: 'ch1', total: 450, cogs: 195, status: 'PENDING' } }),
    prisma.order.create({ data: { id: 'o9', orderNumber: '#1034', date: new Date('2025-05-10'), customerId: 'c1', productId: 'p4', channelId: 'ch6', total: 150, cogs: 35,  status: 'PAID'    } }),
  ]);

  // ─── PURCHASES ───
  await Promise.all([
    prisma.purchase.create({ data: { id: 'pu1', poNumber: 'PO-018', date: new Date('2025-05-15'), supplierId: 'sup1', items: 'OBD Scanner Pro ×10, Cavi ×50', total: 2400, status: 'INTRANSIT' } }),
    prisma.purchase.create({ data: { id: 'pu2', poNumber: 'PO-017', date: new Date('2025-05-08'), supplierId: 'sup2', items: 'Licenze MS906 ×5',              total: 700,  status: 'RECEIVED'  } }),
    prisma.purchase.create({ data: { id: 'pu3', poNumber: 'PO-016', date: new Date('2025-05-02'), supplierId: 'sup3', items: 'OBD Scanner Base ×8',           total: 520,  status: 'RECEIVED'  } }),
  ]);

  // ─── EXPENSES ───
  await Promise.all([
    prisma.expense.create({ data: { id: 'e1', date: new Date('2025-05-17'), catKey: 'logistica',  desc: 'Pluriball + scatole (riordino)',     amount: 67,  channelId: null  } }),
    prisma.expense.create({ data: { id: 'e2', date: new Date('2025-05-15'), catKey: 'marketing',  desc: 'Spend Facebook Ads',                 amount: 340, channelId: 'ch1' } }),
    prisma.expense.create({ data: { id: 'e3', date: new Date('2025-05-15'), catKey: 'marketing',  desc: 'Spend Google Ads',                   amount: 180, channelId: 'ch2' } }),
    prisma.expense.create({ data: { id: 'e4', date: new Date('2025-05-14'), catKey: 'software',   desc: 'Rinnovo software diagnostica',       amount: 49,  channelId: null  } }),
    prisma.expense.create({ data: { id: 'e5', date: new Date('2025-05-12'), catKey: 'carburante', desc: 'Carburante furgone consegne',        amount: 60,  channelId: null  } }),
  ]);

  // ─── CONVERSATIONS + MESSAGES ───
  await prisma.conversation.create({
    data: {
      id: 'conv1', contactName: 'Marco Ferrari', phone: '+39 333 1234567', customerId: 'c1', status: 'CONVERTED',
      messages: {
        create: [
          { id: 'm1', direction: 'IN',  text: 'Buongiorno, avete ancora disponibilità per OBD Scanner Pro?', auto: false, createdAt: new Date('2025-05-14T09:12:00') },
          { id: 'm2', direction: 'OUT', text: 'Ciao Marco! Sì, ne abbiamo 2 in magazzino. Ti mando il link per l\'ordine.', auto: false, createdAt: new Date('2025-05-14T09:15:00') },
          { id: 'm3', direction: 'OUT', text: 'Ecco il link al tuo preventivo: https://autodiag.it/prev/1042', auto: true, createdAt: new Date('2025-05-14T09:16:00') },
          { id: 'm4', direction: 'IN',  text: 'Perfetto, ordine fatto! Grazie mille', auto: false, createdAt: new Date('2025-05-14T10:02:00') },
          { id: 'm5', direction: 'OUT', text: 'Ordine confermato! Ti mandiamo tracking appena spediamo', auto: true, createdAt: new Date('2025-05-14T10:03:00') },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      id: 'conv2', contactName: 'Anna Conti', phone: '+39 347 9876543', customerId: 'c4', status: 'LINK_SENT',
      messages: {
        create: [
          { id: 'm6', direction: 'IN',  text: 'Salve, quanto costa la diagnosi full check?', auto: false, createdAt: new Date('2025-05-16T14:22:00') },
          { id: 'm7', direction: 'OUT', text: 'Ciao Anna! La Diagnosi Full Check costa €150. Vuoi prenotare?', auto: false, createdAt: new Date('2025-05-16T14:30:00') },
          { id: 'm8', direction: 'IN',  text: 'Sì mi interessa, come funziona?', auto: false, createdAt: new Date('2025-05-16T14:45:00') },
          { id: 'm9', direction: 'OUT', text: 'Ti mando tutti i dettagli: https://autodiag.it/serv/full-check', auto: true, createdAt: new Date('2025-05-16T14:47:00') },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      id: 'conv3', contactName: 'Giuseppe Mancini', phone: '+39 320 5551234', customerId: null, status: 'NEW_LEAD',
      messages: {
        create: [
          { id: 'm10', direction: 'IN', text: 'Ciao, ho visto la vostra pubblicità su Instagram. Fate anche ricodifica ECU per BMW?', auto: false, createdAt: new Date('2025-05-18T16:05:00') },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      id: 'conv4', contactName: 'Giulia Rossi', phone: '+39 338 7771234', customerId: 'c2', status: 'CONTACTED',
      messages: {
        create: [
          { id: 'm11', direction: 'IN',  text: 'Ciao, volevo info sull\'abbonamento Pro', auto: false, createdAt: new Date('2025-05-17T11:00:00') },
          { id: 'm12', direction: 'OUT', text: 'Ciao Giulia! L\'abbonamento Pro include aggiornamenti illimitati + supporto prioritario a €200/mese. Ti interessa?', auto: false, createdAt: new Date('2025-05-17T11:12:00') },
          { id: 'm13', direction: 'IN',  text: 'Ci penso e ti faccio sapere', auto: false, createdAt: new Date('2025-05-17T11:20:00') },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      id: 'conv5', contactName: 'Roberto Neri', phone: '+39 340 1112233', customerId: null, status: 'LOST',
      messages: {
        create: [
          { id: 'm14', direction: 'IN',  text: 'Buongiorno, prezzo scanner OBD base?', auto: false, createdAt: new Date('2025-05-10T09:30:00') },
          { id: 'm15', direction: 'OUT', text: 'Ciao! OBD Scanner Base a €180. Ti mando il link?', auto: false, createdAt: new Date('2025-05-10T09:35:00') },
          { id: 'm16', direction: 'OUT', text: 'Ci sei ancora? Il tuo carrello ti aspetta', auto: true, createdAt: new Date('2025-05-13T10:00:00') },
        ],
      },
    },
  });

  // ─── MSG TEMPLATES ───
  await Promise.all([
    prisma.msgTemplate.create({ data: { id: 'tpl1', label: 'Preventivo',        text: 'Ecco il link al tuo preventivo: {{link}}' } }),
    prisma.msgTemplate.create({ data: { id: 'tpl2', label: 'Ordine confermato', text: 'Ordine confermato! Ti mandiamo tracking appena spediamo' } }),
    prisma.msgTemplate.create({ data: { id: 'tpl3', label: 'Follow-up',         text: 'Ci sei ancora? Il tuo carrello ti aspetta' } }),
    prisma.msgTemplate.create({ data: { id: 'tpl4', label: 'Benvenuto',          text: 'Ciao {{nome}}! Come posso aiutarti?' } }),
  ]);

  console.log('Seed completato!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
