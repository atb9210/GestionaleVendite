import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const MsgTemplateSchema = z.object({
  label: z.string().min(1),
  text: z.string().min(1),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.msgTemplate.findMany();
    res.json(templates);
  } catch (err) { next(err); }
});

router.post('/', validate(MsgTemplateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await prisma.msgTemplate.create({ data: req.body });
    res.status(201).json(template);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await prisma.msgTemplate.update({ where: { id: req.params.id }, data: req.body });
    res.json(template);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.msgTemplate.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
