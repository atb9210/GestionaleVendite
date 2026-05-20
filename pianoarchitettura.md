Piano Architettura
Frontend: React + Vite (veloce, moderno, ES6+) Backend: Express.js con TypeScript Database: Neon (PostgreSQL serverless) ORM: Prisma (type-safe, ottimo con Neon) Styling: Tailwind CSS (moderno, compatto) State: React Context API o Zustand Routing: React Router Charts: Recharts o Chart.js

Struttura Progetto
GestionaleVendite/
├── client/          # React + Vite
├── server/          # Express + Prisma
└── README.md
Step-by-Step
Setup progetto: Inizializza frontend (Vite + React) e backend (Express + TypeScript)
Database: Schema Prisma con tutte le tabelle (orders, customers, products, subscriptions, expenses, purchases)
Backend API: Routes CRUD per ogni entità + endpoints analytics
Frontend layout: Componenti Sidebar, TopNav, Layout riutilizzabili
Pagine principali: Dashboard, Ordini, Clienti (con dati reali dal backend)
Pagine secondarie: Prodotti, Abbonamenti, Acquisti, Spese
Analytics: Report con charts
Settings: Configurazione goals, canali, categorie
Volevo iniziare con lo step 1 (inizializzazione progetto)? Creerò:

Frontend React con Vite + Tailwind
Backend Express con TypeScript + Prisma
File di configurazione base

---

## Stato avanzamento

- [x] Step 1: Setup progetto (client + server)
- [x] Step 2: Schema Prisma + seed (12 entità)
- [x] Step 3: Backend API CRUD (tutte le entità)
- [x] Step 4: Frontend layout (Sidebar, TopNav, Layout)
- [x] Step 5–6: Pagine collegate al backend via DataContext
- [x] Step 7: Integrazione end-to-end (POST/PUT/DELETE persistono nel DB)
- [x] Step 8: UI reattiva con Optimistic Updates
- [x] Step 8.5: Refactor backend → struttura `modules/` mirror pagine frontend
- [ ] **Step 9: Dashboard con analytics reali** ← in corso
- [ ] Step 10: Reports page con charts
- [ ] Step 11: Settings completo (goals, canali, categorie)

## Step 9 — Dashboard reale (in corso)

**A. Backend (`modules/dashboard/analytics.routes.ts`)**:
- Helper `periodToRange('7d'|'month'|'q'|'ytd')` con periodo precedente per delta %
- `GET /overview?period=` → `{ period, activity, financial, compare }`
- `GET /channels?period=` → filtrato
- `GET /recent-transactions?limit=6` → mix orders + expenses ordinati per data

**B. Frontend (`pages/Dashboard.jsx`)**:
- Rimuovo mock `periodData`
- `useEffect([period])` fetcha overview + channels + transactions
- Alert low-stock derivato da `useData().products`
- Goal mensile hardcoded 4000 € (da migrare in Settings)

## Step 8.5 — Backend modulare (fatto)

Riorganizzato `server/src/` per rispecchiare l'organizzazione del frontend.

```
server/src/
├── modules/                      ← 1 modulo ≈ 1 pagina frontend
│   ├── customers/routes.ts
│   ├── orders/routes.ts
│   ├── products/routes.ts
│   ├── subscriptions/routes.ts
│   ├── purchases/routes.ts
│   ├── expenses/routes.ts
│   ├── communications/
│   │   ├── conversations.routes.ts
│   │   └── msgTemplates.routes.ts
│   ├── settings/
│   │   ├── channels.routes.ts
│   │   ├── suppliers.routes.ts
│   │   ├── productTypes.routes.ts
│   │   └── expenseCategories.routes.ts
│   └── dashboard/analytics.routes.ts
├── middleware/                   ← errorHandler, validate
├── config/                       ← env, prisma client
├── utils/                        ← pagination
└── index.ts                      ← bootstrap Express
```

Spostamenti fatti con `git mv` (history preservata). Import aggiornati `../` → `../../`.
Endpoint testati post-refactor: tutti OK.

## Step 8 — Optimistic UI (in corso)

**Problema misurato**: POST /api/v1/customers = 1.26s, GET = 0.4-2s (Neon serverless remoto).
Risultato: dopo il click su "Salva" il modal si chiude subito ma la riga compare solo dopo ~1.3s.

**Soluzione**: pattern *Optimistic Update* nel `DataContext`.
1. Aggiungo subito la riga in state con id temporaneo (`_temp_xxx`)
2. La Promise si risolve istantaneamente (la pagina può continuare)
3. In background: chiamata API → sostituisco temp con dati reali (o rollback + toast d'errore)

**Scope**: solo `client/src/context/DataContext.jsx`. Le 8 pagine non cambiano.