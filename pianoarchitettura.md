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
- [ ] **Step 8: UI reattiva con Optimistic Updates** ← prossimo
- [ ] Step 9: Analytics reali in Dashboard
- [ ] Step 10: Settings completo (goals, canali, categorie)

## Step 8 — Optimistic UI (in corso)

**Problema misurato**: POST /api/v1/customers = 1.26s, GET = 0.4-2s (Neon serverless remoto).
Risultato: dopo il click su "Salva" il modal si chiude subito ma la riga compare solo dopo ~1.3s.

**Soluzione**: pattern *Optimistic Update* nel `DataContext`.
1. Aggiungo subito la riga in state con id temporaneo (`_temp_xxx`)
2. La Promise si risolve istantaneamente (la pagina può continuare)
3. In background: chiamata API → sostituisco temp con dati reali (o rollback + toast d'errore)

**Scope**: solo `client/src/context/DataContext.jsx`. Le 8 pagine non cambiano.