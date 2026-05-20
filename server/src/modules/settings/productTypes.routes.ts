import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const ProductTypeSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().min(1),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await prisma.productType.findMany({ orderBy: { label: 'asc' } });
    res.json(types);
  } catch (err) { next(err); }
});

router.post('/', validate(ProductTypeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = await prisma.productType.create({ data: req.body });
    res.status(201).json(type);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = await prisma.productType.update({ where: { id: req.params.id }, data: req.body });
    res.json(type);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.productType.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
