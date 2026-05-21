import { Router, Request, Response } from 'express';
import express from 'express';
import {
  WasenderWebhookEventType,
  type MessagesUpsertData,
  type PersonalMessageData,
  type GenericMessageData,
  type MessageContent,
} from 'wasenderapi';
import { getWasender } from '../../config/wasender';
import prisma from '../../config/prisma';

const router = Router();

async function saveIncomingMessage(remoteJid: string, message: MessageContent) {
  const phoneRaw = remoteJid.split('@')[0];
  if (!phoneRaw) return;

  const text =
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    '';
  if (!text) return;

  const conversation = await prisma.conversation.findFirst({
    where: { phone: { contains: phoneRaw } },
  });

  if (!conversation) {
    console.log(`[wasender] Nessuna conversazione trovata per phone: ${phoneRaw}`);
    return;
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, direction: 'IN', text, auto: false },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });
  console.log(`[wasender] Messaggio IN salvato per conversazione ${conversation.id}`);
}

// Needs raw body for signature verification — registered BEFORE express.json() in index.ts
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
    console.log(`[wasender] webhook ricevuto: event=${event.event}`);

    // messages.upsert — formato array, può contenere messaggi IN e OUT
    if (event.event === WasenderWebhookEventType.MessagesUpsert) {
      const dataArr: MessagesUpsertData[] = Array.isArray(event.data) ? event.data : [event.data];
      for (const msgData of dataArr) {
        if (msgData.key.fromMe) continue;
        if (msgData.message) {
          await saveIncomingMessage(msgData.key.remoteJid, msgData.message);
        }
      }
    }

    // messages-personal.received — messaggio personale in entrata
    if (event.event === WasenderWebhookEventType.MessagesPersonalReceived) {
      const dataArr: PersonalMessageData[] = Array.isArray(event.data) ? event.data : [event.data];
      for (const msgData of dataArr) {
        if (msgData.key.fromMe) continue;
        await saveIncomingMessage(msgData.key.remoteJid, msgData.message);
      }
    }

    // messages.received — evento generico messaggi
    if (event.event === WasenderWebhookEventType.MessagesReceived) {
      const dataArr: GenericMessageData[] = Array.isArray(event.data) ? event.data : [event.data];
      for (const msgData of dataArr) {
        if (msgData.key.fromMe) continue;
        await saveIncomingMessage(msgData.key.remoteJid, msgData.message);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[wasender] webhook error:', err);
    res.sendStatus(400);
  }
});

export default router;
