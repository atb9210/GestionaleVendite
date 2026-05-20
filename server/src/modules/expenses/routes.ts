import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const ExpenseSchema = z.object({
  catKey: z.string().min(1),
  desc: z.string().min(1),
  amount: z.number().min(0),
  date: z.string().transform(s => new Date(s)),
  channelId: z.string().nullable().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cat, month } = req.query;
    const where: any = {};
    if (cat) where.catKey = cat as string;
    if (month) {
      const [year, m] = (month as string).split('-').map(Number);
      where.date = {
        gte: new Date(year, m - 1, 1),
        lt: new Date(year, m, 1),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true, channel: true },
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (err) { next(err); }
});

router.post('/', validate(ExpenseSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await prisma.expense.create({
      data: req.body,
      include: { category: true, channel: true },
    });
    res.status(201).json(expense);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.date && typeof req.body.date === 'string') {
      req.body.date = new Date(req.body.date);
    }
    const expense = await prisma.expense.update({
      where: { id: (req.params.id as string) },
      data: req.body,
      include: { category: true, channel: true },
    });
    res.json(expense);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.expense.delete({ where: { id: (req.params.id as string) } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
