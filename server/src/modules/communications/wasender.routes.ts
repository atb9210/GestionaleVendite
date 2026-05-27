import { Router, Request, Response } from 'express';
import express from 'express';
import { WasenderWebhookEventType } from 'wasenderapi';
import { getWasender } from '../../config/wasender';
import { broadcastSSE } from '../../lib/sse';
import prisma from '../../config/prisma';

const router = Router();

// Ultimo stato sessione WhatsApp noto — inviato ai nuovi client SSE al connect
export let lastWaStatus = 'unknown';

// Dedup: evita di salvare lo stesso messaggio WhatsApp 3 volte (upsert + personal + received)
const processedIds = new Set<string>();
function isDuplicate(id: string): boolean {
  if (processedIds.has(id)) return true;
  processedIds.add(id);
  if (processedIds.size > 500) {
    const first = processedIds.values().next().value;
    if (first) processedIds.delete(first);
  }
  return false;
}

// Actual runtime shape from Wasender (differs from SDK TypeScript types)
interface WasenderMsgPayload {
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
    senderPn?: string;
    cleanedSenderPn?: string;
  };
  message?: { conversation?: string; extendedTextMessage?: { text?: string } };
  messageBody?: string;
}

function extractMsgPayload(data: unknown): WasenderMsgPayload | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  // Real Wasender payload wraps the message under { messages: { key, message, ... } }
  const inner = (d.messages ?? d) as WasenderMsgPayload;
  if (!inner?.key) return null;
  return inner;
}

async function saveIncomingMessage(msg: WasenderMsgPayload) {
  if (msg.key.fromMe) return;

  // Use cleanedSenderPn (plain number) when available; remoteJid may be LID format
  const phoneRaw = msg.key.cleanedSenderPn || msg.key.senderPn?.split('@')[0] || msg.key.remoteJid.split('@')[0];

  const text =
    msg.messageBody ||
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    '';

  if (!text) return;

  let conversation = await prisma.conversation.findFirst({
    where: { phone: { contains: phoneRaw } },
  });

  // Auto-create conversation for unknown senders so no message is ever lost
  if (!conversation) {
    console.log(`[wasender] sconosciuto ${phoneRaw} — creo conversazione automaticamente`);
    conversation = await prisma.conversation.create({
      data: { contactName: phoneRaw, phone: phoneRaw, status: 'NEW_LEAD' },
    });
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, direction: 'IN', text, auto: false },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date(), unreadCount: { increment: 1 } },
  });
  broadcastSSE('new-message', { conversationId: conversation.id });
  console.log(`[wasender] messaggio IN salvato — conv: ${conversation.id}, text: "${text}"`);
}

// Registered BEFORE express.json() in index.ts — needs raw body for signature verification
router.post('/webhook', express.raw({ type: '*/*' }), async (req: Request, res: Response) => {
  try {
    const rawBody = (req.body as Buffer).toString('utf8');

    const adapter = {
      getHeader: (name: string) => (req.headers[name.toLowerCase()] as string) || '',
      getRawBody: () => rawBody,
    };

    const wasender = getWasender();
    if (!wasender) { res.sendStatus(503); return; }

    const event = await wasender.handleWebhookEvent(adapter);
    console.log(`[wasender] event: ${event.event}`);

    const incomingTypes = [
      WasenderWebhookEventType.MessagesUpsert,
      WasenderWebhookEventType.MessagesPersonalReceived,
      WasenderWebhookEventType.MessagesReceived,
    ] as string[];

    if (incomingTypes.includes(event.event)) {
      const msg = extractMsgPayload(event.data);
      if (msg && !isDuplicate(msg.key.id)) await saveIncomingMessage(msg);
    }

    // Stato connessione sessione WhatsApp
    if (event.event === 'session.status') {
      const data = event.data as unknown as { status: string };
      lastWaStatus = data?.status || 'unknown';
      broadcastSSE('session-status', { status: lastWaStatus });
    }

    // Conferma/errore invio messaggio
    if (event.event === 'message.sent') {
      const data = event.data as unknown as { success: boolean; error?: string };
      if (data?.success === false) {
        broadcastSSE('message-failed', { error: data.error || 'Invio fallito' });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[wasender] webhook error:', err);
    res.sendStatus(400);
  }
});

export default router;
