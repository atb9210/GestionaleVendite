// Cache modulo-singleton per dati Dashboard.
// Chiavi: '7d' | 'month' | 'q' | 'ytd' → { overview, channels, transactions }
// Pattern Stale-While-Revalidate: chi legge usa subito i dati cached,
// chi scrive aggiorna in background dopo ogni fetch.
export const dashCache = {};

// Invalida tutto (es. dopo mutazioni significative — non usato ancora)
export const invalidateDashboard = () => {
  Object.keys(dashCache).forEach(k => delete dashCache[k]);
};
