import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const CustomerSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  phone: z.object({
    countryCode: z.string().default('IT'),
    number: z.string().min(1),
  }).nullable().optional(),
  address: z.string().optional(),
  cap: z.string().optional(),
  country: z.string().default('Italia'),
  firstChannel: z.string().nullable().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, hasSubscription } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (hasSubscription === 'true') {
      where.subscriptions = { some: {} };
    }

    const customers = await prisma.customer.findMany({
      where,
      include: { channel: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(customers);
  } catch (err) { next(err); }
});

router.post('/', validate(CustomerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.create({
      data: req.body,
      include: { channel: true },
    });
    res.status(201).json(customer);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
      include: { channel: true },
    });
    res.json(customer);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

router.get('/:id/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.params.id },
      include: { product: true, channel: true },
      orderBy: { date: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

export default router;
