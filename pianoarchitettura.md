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