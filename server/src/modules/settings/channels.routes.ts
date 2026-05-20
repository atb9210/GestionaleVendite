import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const ChannelSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channels = await prisma.channel.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(channels);
  } catch (err) { next(err); }
});

router.post('/', validate(ChannelSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await prisma.channel.create({ data: req.body });
    res.status(201).json(channel);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await prisma.channel.update({ where: { id: (req.params.id as string) }, data: req.body });
    res.json(channel);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.channel.delete({ where: { id: (req.params.id as string) } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
