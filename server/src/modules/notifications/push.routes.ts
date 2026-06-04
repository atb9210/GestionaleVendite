import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';

const router = Router();

router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Subscription non valida' });
      return;
    }
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post('/test', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { sendPushToAll } = await import('./push.service');
    await sendPushToAll({ title: '🔔 Test notifica', body: 'Le push funzionano correttamente!' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
