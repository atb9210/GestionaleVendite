# Backend Development Plan — Gestionale Vendite

## 1. Panoramica Progetto

Gestionale vendite per un business di diagnostica auto (OBD scanner, licenze software, servizi). Il frontend React è completo con mock data client-side. Il backend deve sostituire i mock con API REST + database reale.

**Stack previsto:** Express.js + TypeScript, Prisma ORM, Neon (PostgreSQL serverless)

---

## 2. Architettura Frontend (stato attuale)

```
client/
├── src/
│   ├── context/DataContext.jsx    ← stato globale, sarà sostituito da fetch API
│   ├── components/
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   ├── SearchableSelect.jsx   ← dropdown searchable
│   │   ├── DatePicker.jsx         ← calendario popup
│   │   ├── PhoneInput.jsx         ← input telefono con flag/prefisso
│   │   ├── Sidebar.jsx
│   │   ├── TopNav.jsx
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Orders.jsx             ← CRUD ordini + toggle spedizione/abbonamento
│   │   ├── Customers.jsx          ← CRUD clienti + telefono + indirizzo
│   │   ├── Products.jsx           ← CRUD prodotti
│   │   ├── Subscriptions.jsx      ← CRUD abbonamenti
│   │   ├── Purchases.jsx          ← CRUD acquisti + tracking + fornitore da Settings
│   │   ├── Expenses.jsx           ← CRUD spese
│   │   ├── Communications.jsx     ← Chat WhatsApp-style
│   │   ├── Reports.jsx
│   │   └── Settings.jsx           ← CRUD canali, categorie spesa, tipi prodotto, fornitori
│   └── styles/dashboard.css
```

Il frontend usa `DataContext` che espone setState per ogni entità. L'integrazione backend richiede:
1. Sostituire `useState(INIT_*)` con fetch da API
2. Sostituire `setEntities(prev => ...)` con chiamate POST/PUT/DELETE + refetch o optimistic update

---

## 3. Schema Database (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── CONFIGURAZIONE ───

model Channel {
  id        String   @id @default(cuid())
  name      String
  color     String
  createdAt DateTime @default(now())
  orders    Order[]
  expenses  Expense[]
  customers Customer[]
}

model ProductType {
  id    String @id @default(cuid())
  key   String @unique
  label String
  icon  String
  products Product[]
}

model ExpenseCategory {
  id    String @id @default(cuid())
  key   String @unique
  label String
  icon  String
  color String
  expenses Expense[]
}

model Supplier {
  id        String   @id @default(cuid())
  name      String
  contact   String?
  phone     String?
  createdAt DateTime @default(now())
  purchases Purchase[]
}

// ─── ENTITÀ PRINCIPALI ───

model Customer {
  id           String   @id @default(cuid())
  name         String
  city         String
  phone        Json     // { countryCode: "IT", number: "333 1234567" }
  address      String?
  cap          String?
  country      String   @default("Italia")
  firstChannel String?
  channel      Channel? @relation(fields: [firstChannel], references: [id])
  ltv          Float    @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  orders       Order[]
  subscriptions Subscription[]
  conversations Conversation[]
}

model Product {
  id       String  @id @default(cuid())
  sku      String  @unique
  name     String
  typeKey  String
  type     ProductType @relation(fields: [typeKey], references: [key])
  price    Float
  cost     Float
  stock    Int?    // null = illimitato (servizi/licenze)
  lowStock Int?
  createdAt DateTime @default(now())
  orders   Order[]
}

model Order {
  id          String   @id @default(cuid())
  orderNumber String   @unique  // auto-generated sequenziale (#1042, #1043...)
  date        DateTime
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  channelId   String
  channel     Channel  @relation(fields: [channelId], references: [id])
  total       Float
  cogs        Float
  status      OrderStatus @default(PENDING)
  
  // Spedizione (opzionale, toggle nel form)
  shippingAddress  String?
  shippingCivico   String?
  shippingCap      String?
  shippingCountry  String?
  shippingTracking String?
  contrassegno     Boolean @default(false)
  
  // Abbonamento collegato (opzionale, toggle nel form)
  subscriptionId String?
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  REFUNDED
  ACTIVE  // usato per ordini ricorrenti/abbonamenti
}

model Subscription {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  plan       String
  mrr        Float
  nextDate   DateTime
  status     SubStatus @default(ACTIVE)
  createdAt  DateTime  @default(now())
  orders     Order[]
}

enum SubStatus {
  ACTIVE
  EXPIRING
  CANCELLED
}

model Purchase {
  id         String   @id @default(cuid())
  poNumber   String   @unique
  supplierId String
  supplier   Supplier @relation(fields: [supplierId], references: [id])
  items      String
  total      Float
  status     PurchaseStatus @default(INTRANSIT)
  date       DateTime
  tracking   String?
  createdAt  DateTime @default(now())
}

enum PurchaseStatus {
  INTRANSIT
  RECEIVED
  TOPAY
}

model Expense {
  id         String   @id @default(cuid())
  catKey     String
  category   ExpenseCategory @relation(fields: [catKey], references: [key])
  desc       String
  amount     Float
  date       DateTime
  channelId  String?
  channel    Channel? @relation(fields: [channelId], references: [id])
  createdAt  DateTime @default(now())
}

// ─── COMUNICAZIONI (WhatsApp) ───

model Conversation {
  id          String   @id @default(cuid())
  contactName String
  phone       String
  customerId  String?
  customer    Customer? @relation(fields: [customerId], references: [id])
  status      ConvStatus @default(NEW_LEAD)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  messages    Message[]
}

enum ConvStatus {
  NEW_LEAD
  CONTACTED
  LINK_SENT
  CONVERTED
  LOST
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  direction      MsgDirection
  text           String
  auto           Boolean  @default(false) // messaggio automatico (template)
  createdAt      DateTime @default(now())
}

enum MsgDirection {
  IN
  OUT
}

model MsgTemplate {
  id    String @id @default(cuid())
  label String
  text  String  // supporta variabili: {{nome}}, {{link}}
}
```

---

## 4. API Endpoints

Tutte le routes prefix: `/api/v1`

### Autenticazione (fase 2)
```
POST   /auth/login          → JWT token
POST   /auth/register
GET    /auth/me
```

### Canali
```
GET    /channels             → lista canali
POST   /channels             → crea canale { name, color }
PUT    /channels/:id         → aggiorna
DELETE /channels/:id         → rimuovi
```

### Tipi Prodotto
```
GET    /product-types
POST   /product-types        → { key, label, icon }
PUT    /product-types/:id
DELETE /product-types/:id
```

### Categorie Spese
```
GET    /expense-categories
POST   /expense-categories   → { key, label, icon, color }
PUT    /expense-categories/:id
DELETE /expense-categories/:id
```

### Fornitori
```
GET    /suppliers
POST   /suppliers            → { name, contact?, phone? }
PUT    /suppliers/:id
DELETE /suppliers/:id
```

### Prodotti
```
GET    /products             → lista + filtro ?type=obd&search=scanner
POST   /products             → { sku, name, typeKey, price, cost, stock?, lowStock? }
PUT    /products/:id
DELETE /products/:id
```

### Clienti
```
GET    /customers            → lista + filtro ?search=marco&hasSubscription=true
POST   /customers            → { name, city, phone:{countryCode,number}, address?, cap?, country?, firstChannel? }
PUT    /customers/:id
DELETE /customers/:id
GET    /customers/:id/orders → ordini del cliente
```

### Ordini
```
GET    /orders               → lista + filtro ?status=paid&search=1042
POST   /orders               → { customerId, productId, channelId, total, cogs, status, date, shippingData?, subData? }
PUT    /orders/:id
DELETE /orders/:id
GET    /orders/next-number   → prossimo numero sequenziale
```

**Logica speciale nel POST orders:**
- Se `shippingData` presente → salva campi spedizione
- Se `subData` presente → crea/collega Subscription automaticamente
- Auto-incrementa `customer.ltv` di `total`
- Auto-incrementa `customer.orders` di 1

### Abbonamenti
```
GET    /subscriptions        → lista + filtro ?status=active
POST   /subscriptions        → { customerId, plan, mrr, nextDate, status }
PUT    /subscriptions/:id
DELETE /subscriptions/:id
```

### Acquisti
```
GET    /purchases            → lista + filtro ?status=intransit
POST   /purchases            → { poNumber, supplierId, items, total, status, date, tracking? }
PUT    /purchases/:id
DELETE /purchases/:id
```

### Spese
```
GET    /expenses             → lista + filtro ?cat=marketing&month=2025-05
POST   /expenses             → { catKey, desc, amount, date, channelId? }
PUT    /expenses/:id
DELETE /expenses/:id
```

### Comunicazioni
```
GET    /conversations                    → lista + filtro ?status=new_lead&search=marco
POST   /conversations                    → { contactName, phone, customerId?, status }
PUT    /conversations/:id                → aggiorna status
DELETE /conversations/:id

GET    /conversations/:id/messages       → messaggi della conversazione
POST   /conversations/:id/messages       → { direction, text, auto }

GET    /msg-templates
POST   /msg-templates                    → { label, text }
PUT    /msg-templates/:id
DELETE /msg-templates/:id
```

### Dashboard / Analytics
```
GET    /analytics/overview    → { totalRevenue, totalOrders, avgTicket, totalExpenses, netProfit, mrr }
GET    /analytics/revenue     → serie temporale revenue ?period=7d|30d|90d
GET    /analytics/channels    → breakdown vendite per canale
GET    /analytics/products    → top prodotti per volume/revenue
```

---

## 5. Logica Business da Implementare

### Ordine Creato
1. Incrementa `customer.ltv += order.total`
2. Incrementa `customer.orders += 1`
3. Se prodotto ha `stock` → decrementa `product.stock -= 1`
4. Se toggle abbonamento attivo → crea `Subscription` collegata
5. Genera `orderNumber` sequenziale

### Ordine Eliminato
1. Reverse: decrementa LTV e contatore ordini
2. Ripristina stock se necessario

### Acquisto ricevuto
1. Potenzialmente incrementa stock prodotti (manuale o automatico)

### Conversazione → Ordine (futuro)
1. Quando status = `converted` → possibilità di collegare a ordine creato

---

## 6. Struttura Server Consigliata

```
server/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.ts               ← entry point Express
│   ├── config/
│   │   └── env.ts             ← variabili ambiente
│   ├── middleware/
│   │   ├── auth.ts            ← JWT middleware (fase 2)
│   │   ├── validate.ts        ← Zod validation
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── channels.ts
│   │   ├── productTypes.ts
│   │   ├── expenseCategories.ts
│   │   ├── suppliers.ts
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   ├── orders.ts
│   │   ├── subscriptions.ts
│   │   ├── purchases.ts
│   │   ├── expenses.ts
│   │   ├── conversations.ts
│   │   ├── msgTemplates.ts
│   │   └── analytics.ts
│   ├── services/              ← logica business
│   │   ├── orderService.ts
│   │   ├── subscriptionService.ts
│   │   └── analyticsService.ts
│   └── utils/
│       └── pagination.ts
├── package.json
├── tsconfig.json
└── .env
```

---

## 7. ENV Variables

```env
DATABASE_URL=postgresql://user:pass@neon-host/neondb?sslmode=require
PORT=3001
JWT_SECRET=your-secret-key
WHATSAPP_API_TOKEN=       # fase 3 - integrazione WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID= # fase 3
```

---

## 8. Priorità Implementazione

### Fase 1 — Core CRUD (MVP)
1. Setup Express + Prisma + Neon
2. Seed database con mock data attuali
3. CRUD: Channels, ProductTypes, ExpenseCategories, Suppliers
4. CRUD: Products, Customers
5. CRUD: Orders (con logica LTV/stock)
6. CRUD: Subscriptions, Purchases, Expenses
7. Analytics endpoint (Dashboard)

### Fase 2 — Auth & Security
1. JWT auth con login/register
2. Middleware protezione routes
3. Ruoli (Owner, Manager) con permessi

### Fase 3 — WhatsApp Integration
1. Webhook per ricevere messaggi WhatsApp Business API
2. Endpoint invio messaggi
3. Sync conversazioni
4. Auto-reply con templates
5. Collegamento lead → customer → ordine

---

## 9. Note per il Frontend Integration

Quando il backend è pronto, il frontend richiede queste modifiche in `DataContext.jsx`:

```typescript
// Esempio: sostituire useState con fetch
const [orders, setOrders] = useState([]);
useEffect(() => {
  fetch('/api/v1/orders').then(r => r.json()).then(setOrders);
}, []);

// CRUD diventa:
const createOrder = async (data) => {
  const res = await fetch('/api/v1/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
  const order = await res.json();
  setOrders(prev => [order, ...prev]);
};
```

Il frontend usa queste strutture dati (che corrispondono a quanto definito sopra):

| Campo frontend | Campo DB | Note |
|---|---|---|
| `order.date` | `order.date` (DateTime) | Frontend mostra "18 mag", DB salva ISO |
| `order.shippingData` | campi flat `shippingAddress, shippingCap...` | Frontend manda oggetto, API fa flatten |
| `order.subData` | crea `Subscription` se presente | API gestisce creazione relazione |
| `customer.phone` | JSON field `{countryCode, number}` | Salvato come JSON in Postgres |
| `purchase.supplierId` | FK a `Supplier` | Lookup dalla lista fornitori |

---

## 10. Validazione (Zod schemas)

Consigliato usare Zod per validare i body delle request. Esempio:

```typescript
import { z } from 'zod';

export const CreateOrderSchema = z.object({
  customerId: z.string().cuid(),
  productId: z.string().cuid(),
  channelId: z.string().cuid(),
  total: z.number().positive(),
  cogs: z.number().min(0),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'REFUNDED', 'ACTIVE']),
  date: z.string().datetime(),
  shippingData: z.object({
    address: z.string().min(1),
    civico: z.string().optional(),
    cap: z.string().min(1),
    country: z.string().default('Italia'),
    tracking: z.string().optional(),
    contrassegno: z.boolean().default(false),
  }).optional(),
  subData: z.object({
    planId: z.string().cuid(),
    amount: z.number().positive(),
    startDate: z.string().datetime().optional(),
  }).optional(),
});
```

---

## 11. Seed Script

Creare un file `prisma/seed.ts` che popola il DB con gli stessi dati presenti in `DataContext.jsx` (sezione `INIT_*`). Questo permette di testare l'app con dati coerenti durante lo sviluppo.

---

## 12. CORS & Proxy

Frontend (Vite) gira su `:5173`, backend su `:3001`. Configurare:

**vite.config.js:**
```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3001' }
  }
});
```

**Backend:**
```typescript
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
```

---

## 13. Deployment

- **Frontend:** Cloudflare Pages (già configurato, build: `client/` → `npm run build` → `dist/`)
- **Backend:** Suggerito Railway / Render / Fly.io (supportano Node.js + connessione Neon)
- **Database:** Neon PostgreSQL (serverless, branching per dev/staging)
