import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const SubscriptionSchema = z.object({
  customerId: z.string().min(1),
  plan: z.string().min(1),
  mrr: z.number().positive(),
  nextDate: z.string().transform(s => new Date(s)),
  status: z.enum(['ACTIVE', 'EXPIRING', 'CANCELLED']).default('ACTIVE'),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = (status as string).toUpperCase();

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: { customer: true },
      orderBy: { nextDate: 'asc' },
    });
    res.json(subscriptions);
  } catch (err) { next(err); }
});

router.post('/', validate(SubscriptionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await prisma.subscription.create({
      data: req.body,
      include: { customer: true },
    });
    res.status(201).json(subscription);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.nextDate && typeof req.body.nextDate === 'string') {
      req.body.nextDate = new Date(req.body.nextDate);
    }
    const subscription = await prisma.subscription.update({
      where: { id: (req.params.id as string) },
      data: req.body,
      include: { customer: true },
    });
    res.json(subscription);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.subscription.delete({ where: { id: (req.params.id as string) } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
