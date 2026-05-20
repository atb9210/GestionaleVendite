import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const ProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  typeKey: z.string().min(1),
  price: z.number().min(0),
  cost: z.number().min(0),
  stock: z.number().int().nullable().optional(),
  lowStock: z.number().int().nullable().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, search } = req.query;
    const where: any = {};
    if (type) where.typeKey = type as string;
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const products = await prisma.product.findMany({
      where,
      include: { type: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (err) { next(err); }
});

router.post('/', validate(ProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.create({
      data: req.body,
      include: { type: true },
    });
    res.status(201).json(product);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
      include: { type: true },
    });
    res.json(product);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
