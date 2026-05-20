import { Router, Request, Response } from 'express';
import express from 'express';
import { WasenderWebhookEventType, type MessagesUpsertData } from 'wasenderapi';
import wasender from '../../config/wasender';
import prisma from '../../config/prisma';

const router = Router();

// Needs raw body for signature verification — registered BEFORE express.json() in index.ts
router.post('/webhook', express.raw({ type: '*/*' }), async (req: Request, res: Response) => {
  try {
    const rawBody = (req.body as Buffer).toString('utf8');

    const adapter = {
      getHeader: (name: string) => (req.headers[name.toLowerCase()] as string) || '',
      getRawBody: () => rawBody,
    };

    const event = await wasender.handleWebhookEvent(adapter);

    if (event.event === WasenderWebhookEventType.MessagesUpsert) {
      const dataArr: MessagesUpsertData[] = Array.isArray(event.data) ? event.data : [event.data];

      for (const msgData of dataArr) {
        if (msgData.key.fromMe) continue;

        const remoteJid: string = msgData.key.remoteJid ?? '';
        const phoneRaw = remoteJid.split('@')[0];
        if (!phoneRaw) continue;

        const text =
          msgData.message?.conversation ||
          msgData.message?.extendedTextMessage?.text ||
          '';
        if (!text) continue;

        const conversation = await prisma.conversation.findFirst({
          where: { phone: { contains: phoneRaw } },
        });

        if (conversation) {
          await prisma.message.create({
            data: { conversationId: conversation.id, direction: 'IN', text, auto: false },
          });
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Wasender webhook error:', err);
    res.sendStatus(400);
  }
});

export default router;
