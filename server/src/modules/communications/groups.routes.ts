import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const GroupSchema = z.object({
  name:  z.string().min(1),
  icon:  z.string().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
});

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await prisma.conversationGroup.findMany({ orderBy: { order: 'asc' } });
    res.json(groups);
  } catch (err) { next(err); }
});

router.post('/', validate(GroupSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maxOrder = await prisma.conversationGroup.aggregate({ _max: { order: true } });
    const group = await prisma.conversationGroup.create({
      data: { ...req.body, order: req.body.order ?? (maxOrder._max.order ?? 0) + 1 },
    });
    res.status(201).json(group);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.conversationGroup.findUnique({ where: { id } });
    if (existing?.isDefault) return res.status(403).json({ error: 'Gruppo di default non modificabile' });
    const group = await prisma.conversationGroup.update({ where: { id }, data: req.body });
    res.json(group);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.conversationGroup.findUnique({ where: { id } });
    if (existing?.isDefault) return res.status(403).json({ error: 'Gruppo di default non eliminabile' });
    await prisma.conversationGroup.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
