import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { getWasender } from '../../config/wasender';

const router = Router();

const ConversationSchema = z.object({
  contactName: z.string().min(1),
  phone: z.string().min(1),
  customerId: z.string().nullable().optional(),
  status: z.enum(['NEW_LEAD', 'CONTACTED', 'LINK_SENT', 'CONVERTED', 'LOST']).default('NEW_LEAD'),
});

const MessageSchema = z.object({
  direction: z.enum(['IN', 'OUT']),
  text: z.string().min(1),
  auto: z.boolean().default(false),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    if (status) where.status = (status as string).toUpperCase();
    if (search) {
      where.OR = [
        { contactName: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: { customer: true, messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(conversations);
  } catch (err) { next(err); }
});

router.post('/', validate(ConversationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await prisma.conversation.create({
      data: req.body,
      include: { customer: true, messages: true },
    });
    res.status(201).json(conversation);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await prisma.conversation.update({
      where: { id: (req.params.id as string) },
      data: req.body,
      include: { customer: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
    res.json(conversation);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.conversation.delete({ where: { id: (req.params.id as string) } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// Messages
router.get('/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: (req.params.id as string) },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (err) { next(err); }
});

router.post('/:id/messages', validate(MessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversationId = req.params.id as string;
    const message = await prisma.message.create({
      data: { ...req.body, conversationId },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Fire-and-forget WhatsApp send for outgoing messages
    if (req.body.direction === 'OUT') {
      const wasender = getWasender();
      if (wasender) {
        const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (conv?.phone) {
          wasender.sendText({ to: conv.phone, text: req.body.text }).catch((err: unknown) => {
            console.error('Wasender sendText error:', err);
          });
        }
      }
    }

    res.status(201).json(message);
  } catch (err) { next(err); }
});

export default router;
