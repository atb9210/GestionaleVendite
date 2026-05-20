import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const PurchaseSchema = z.object({
  poNumber: z.string().min(1),
  supplierId: z.string().min(1),
  items: z.string().min(1),
  total: z.number().min(0),
  status: z.enum(['INTRANSIT', 'RECEIVED', 'TOPAY']).default('INTRANSIT'),
  date: z.string().transform(s => new Date(s)),
  tracking: z.string().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = (status as string).toUpperCase();

    const purchases = await prisma.purchase.findMany({
      where,
      include: { supplier: true },
      orderBy: { date: 'desc' },
    });
    res.json(purchases);
  } catch (err) { next(err); }
});

router.post('/', validate(PurchaseSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const purchase = await prisma.purchase.create({
      data: req.body,
      include: { supplier: true },
    });
    res.status(201).json(purchase);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.date && typeof req.body.date === 'string') {
      req.body.date = new Date(req.body.date);
    }
    const purchase = await prisma.purchase.update({
      where: { id: (req.params.id as string) },
      data: req.body,
      include: { supplier: true },
    });
    res.json(purchase);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.purchase.delete({ where: { id: (req.params.id as string) } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
