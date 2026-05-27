# Integrazione WhatsApp API
**Data:** 2026-05-21  
**Branch:** `wasender-api-integration`

---

## Obiettivo

Collegare la pagina Comunicazioni del gestionale a WhatsApp, in modo che:
- I messaggi inviati dall'interfaccia arrivino davvero su WhatsApp
- I messaggi ricevuti su WhatsApp appaiano in tempo reale senza ricaricare la pagina

---

## Libreria utilizzata

**[Wasender](https://wasenderapi.com)** — servizio che espone le API WhatsApp via HTTP. Si usa con l'SDK npm `wasenderapi`.

Wasender funziona come intermediario: connette un numero WhatsApp reale al nostro server e ci permette di mandare/ricevere messaggi tramite API REST + webhook.

---

## Architettura

### Messaggi in uscita (noi → WhatsApp)

```
UI digita messaggio → POST /api/v1/conversations/:id/messages
  → salva in DB
  → chiama wasender.sendText() in fire-and-forget
  → messaggio arriva su WhatsApp del contatto
```

### Messaggi in entrata (WhatsApp → noi)

```
Contatto risponde su WhatsApp
  → Wasender manda POST al nostro webhook /api/wasender/webhook
  → webhook deduplicato e salvato in DB
  → server manda evento SSE al browser
  → UI ricarica le conversazioni istantaneamente
```

---

## File creati / modificati

| File | Cosa fa |
|------|---------|
| `server/src/config/wasender.ts` | Inizializza il client Wasender (lazy) |
| `server/src/modules/communications/wasender.routes.ts` | Gestisce il webhook in entrata |
| `server/src/modules/communications/conversations.routes.ts` | Aggiunto invio WhatsApp su messaggi OUT |
| `server/src/lib/sse.ts` | Gestione connessioni SSE server → browser |
| `server/src/index.ts` | Registrazione routes SSE e webhook |
| `docker-compose.yml` | Aggiunte env var Wasender |
| `client/src/context/DataContext.jsx` | Esportata `refreshConversations` |
| `client/src/pages/Communications.jsx` | SSE listener, mobile UX, scroll fix |
| `client/src/styles/dashboard.css` | Layout mobile chat |

---

## Variabili d'ambiente necessarie

```env
WASENDER_API_KEY=...          # chiave API del pannello Wasender
WASENDER_WEBHOOK_SECRET=...   # secret per verificare firma webhook (opzionale ma consigliato)
```

Su Dokploy queste si aggiungono nella sezione Environment del servizio. Devono anche essere elencate nel `docker-compose.yml` (altrimenti Dokploy non le inietta nel container).

---

## Come configurare il webhook su Wasender

Nel pannello Wasender, impostare come Webhook URL:

```
https://tuo-dominio.com/api/wasender/webhook
```

Tipi di evento da abilitare:
- `messages.upsert`
- `messages-personal.received`
- `messages.received`

---

## Problemi reali affrontati (e come li abbiamo risolti)

### 1. Il server crashava all'avvio senza la chiave API

**Problema:** `createWasender()` dell'SDK lanciava un'eccezione al momento dell'import se `WASENDER_API_KEY` era undefined. Il server non partiva.

**Soluzione:** Inizializzazione lazy — il client viene creato solo quando serve, non all'avvio. Se la chiave manca, `getWasender()` ritorna `null` e il resto del codice lo gestisce senza crashare.

```ts
// server/src/config/wasender.ts
let _wasender = null;
export function getWasender() {
  if (_wasender) return _wasender;
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) return null;
  _wasender = createWasender(apiKey, ...);
  return _wasender;
}
```

---

### 2. Le env var non arrivavano al container Docker

**Problema:** `WASENDER_API_KEY` era impostata su Dokploy ma il server non la vedeva. Dokploy inietta solo le variabili esplicitamente elencate nel `docker-compose.yml`.

**Soluzione:** Aggiungere le variabili alla sezione `environment:` del compose.

```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - WASENDER_API_KEY=${WASENDER_API_KEY}
  - WASENDER_WEBHOOK_SECRET=${WASENDER_WEBHOOK_SECRET}
```

---

### 3. Il webhook riceveva l'evento ma non trovava il numero di telefono

**Problema:** I tipi TypeScript dell'SDK non corrispondevano alla struttura reale del payload. In particolare:
- Il payload reale wrappa il messaggio sotto `{ messages: { key, message, ... } }` (non direttamente)
- `remoteJid` è in formato LID (`53665733816503@lid`), **non** un numero di telefono leggibile
- Il numero reale è in `cleanedSenderPn` (es. `393519615376`)

**Soluzione:** Ignorare i tipi dell'SDK e lavorare con l'interfaccia reale del payload:

```ts
interface WasenderMsgPayload {
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
    senderPn?: string;
    cleanedSenderPn?: string; // ← numero reale da usare
  };
  messageBody?: string;
  message?: { conversation?: string; extendedTextMessage?: { text?: string } };
}

// Estrazione numero
const phoneRaw = msg.key.cleanedSenderPn
  || msg.key.senderPn?.split('@')[0]
  || msg.key.remoteJid.split('@')[0];
```

---

### 4. Ogni messaggio veniva salvato tre volte

**Problema:** Wasender manda tre eventi distinti per ogni messaggio ricevuto (`messages.upsert`, `messages-personal.received`, `messages.received`). Risultato: ogni messaggio appariva triplicato in chat.

**Soluzione:** Deduplicazione in memoria tramite un `Set` degli ID già processati. Se un ID è già nel Set, il messaggio viene scartato.

```ts
const processedIds = new Set<string>();
function isDuplicate(id: string): boolean {
  if (processedIds.has(id)) return true;
  processedIds.add(id);
  // limite a 500 ID per non far crescere la memoria
  if (processedIds.size > 500) {
    const first = processedIds.values().next().value;
    if (first) processedIds.delete(first);
  }
  return false;
}
```

---

### 5. Il webhook deve ricevere il body grezzo (non JSON parsato)

**Problema:** Wasender verifica la firma del webhook usando il body grezzo della richiesta. Se Express ha già parsato il JSON, la firma non combacia e il webhook rifiuta la richiesta.

**Soluzione:** Registrare la route Wasender **prima** di `express.json()` nel middleware, con `express.raw()` dedicato.

```ts
// server/src/index.ts — l'ordine è importante
app.use('/api/wasender', wasenderRouter);  // raw body
app.use(express.json());                   // tutto il resto
```

---

### 6. I messaggi in entrata non aggiornano l'UI senza ricaricare

**Problema:** Il frontend non sapeva quando arrivava un nuovo messaggio. Avremmo potuto fare polling ogni N secondi, ma è inefficiente e introduce latenza.

**Soluzione:** SSE (Server-Sent Events) — connessione persistente server → browser. Quando arriva un messaggio, il server notifica il browser che ricarica le conversazioni in tempo reale.

```
browser apre GET /api/events  →  connessione SSE aperta
webhook salva messaggio       →  broadcastSSE('new-message', { conversationId })
browser riceve evento         →  refreshConversations()
```

Un problema secondario: `refreshConversations` era definita nel `DataContext` ma non inserita nell'oggetto `value` esportato — risultava `undefined` nel componente. Aggiungendola al `value` il problema è sparito.

---

### 7. Traefik chiudeva le connessioni SSE inattive

**Problema:** Traefik (il reverse proxy di Dokploy) chiude le connessioni HTTP inattive dopo un timeout. Le SSE senza traffico venivano interrotte.

**Soluzione:** Due misure insieme:
- Header `X-Accel-Buffering: no` per disabilitare il buffering del proxy
- Keepalive ogni 30 secondi: `res.write(': ping\n\n')` (riga che inizia con `:` è un commento SSE, ignorata dal browser)

---

### 8. Scroll alla chat: effetto visibile dello scorrimento

**Problema:** Aprendo una chat con molti messaggi, il browser partiva dall'inizio e scorreva verso il basso in modo visibile. Brutto da vedere.

**Soluzione:** Distinguere due scenari:
- **Apertura chat** → `scrollIntoView({ behavior: 'instant' })` — salta direttamente in fondo
- **Nuovo messaggio in arrivo** → `scrollIntoView({ behavior: 'smooth' })` — scorrimento fluido

Un bug sottile: il `ref` che teneva traccia dell'ID conversazione precedente veniva aggiornato **dopo** il controllo `if (!chatEndRef.current) return`. Quando si tornava alla lista (activeId = null, ref = null), il ref non si azzerava. La riapertura della stessa chat sembrava una continuazione, non una nuova apertura, e usava lo scroll smooth invece di instant.

**Fix:** spostare l'aggiornamento del ref **prima** del controllo null.

---

## Note per il futuro

- **Nessun webhook = nessun messaggio in entrata.** Se i messaggi smettono di arrivare, verificare prima che l'URL webhook su Wasender punti all'URL di produzione corretto.
- **Il dedup è in memoria.** Se il server si riavvia, il Set si svuota — nella finestra di riavvio è possibile (raro) che un messaggio venga salvato due volte.
- **Wasender non garantisce l'ordine degli eventi.** Il timestamp `createdAt` del DB è il riferimento per l'ordinamento, non l'ordine di arrivo degli eventi.
