import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { getWasender } from '../../config/wasender';
import { normalizePhone } from '../../lib/phone';

const router = Router();

const CONV_INCLUDE = {
  customer: true,
  messages: { orderBy: { createdAt: 'asc' as const } },
  activities: { orderBy: { createdAt: 'desc' as const } },
};

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

const ActivitySchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'STATUS_CHANGE', 'MESSAGE']),
  text: z.string().min(1),
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
      include: CONV_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(conversations);
  } catch (err) { next(err); }
});

router.post('/', validate(ConversationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await prisma.conversation.create({
      data: { ...req.body, phone: normalizePhone(req.body.phone) },
      include: CONV_INCLUDE,
    });
    res.status(201).json(conversation);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status: newStatus, ...rest } = req.body;

    if (newStatus) {
      const current = await prisma.conversation.findUnique({ where: { id }, select: { status: true } });
      if (current && current.status !== newStatus) {
        const LABELS: Record<string, string> = {
          NEW_LEAD: 'Nuovo lead', CONTACTED: 'Contattato',
          LINK_SENT: 'Link inviato', CONVERTED: 'Convertito', LOST: 'Perso',
        };
        await prisma.conversationActivity.create({
          data: {
            conversationId: id,
            type: 'STATUS_CHANGE',
            text: `${LABELS[current.status] || current.status} → ${LABELS[newStatus] || newStatus}`,
          },
        });
      }
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { ...(newStatus ? { status: newStatus } : {}), ...rest },
      include: CONV_INCLUDE,
    });
    res.json(conversation);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.conversation.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// Messages
router.get('/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id as string },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (err) { next(err); }
});

router.post('/:id/messages', validate(MessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversationId = req.params.id as string;
    const message = await prisma.message.create({ data: { ...req.body, conversationId } });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

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

// Activities
router.post('/:id/activities', validate(ActivitySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await prisma.conversationActivity.create({
      data: { ...req.body, conversationId: req.params.id as string },
    });
    res.status(201).json(activity);
  } catch (err) { next(err); }
});

router.delete('/:id/activities/:actId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.conversationActivity.delete({ where: { id: req.params.actId as string } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
