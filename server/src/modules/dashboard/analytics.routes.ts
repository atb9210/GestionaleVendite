import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';

const router = Router();

router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [orders, expenses, subscriptions] = await Promise.all([
      prisma.order.findMany({ where: { status: { in: ['PAID', 'SHIPPED', 'ACTIVE'] } } }),
      prisma.expense.findMany(),
      prisma.subscription.findMany({ where: { status: 'ACTIVE' } }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCogs = orders.reduce((sum, o) => sum + o.cogs, 0);
    const netProfit = totalRevenue - totalExpenses - totalCogs;
    const mrr = subscriptions.reduce((sum, s) => sum + s.mrr, 0);

    res.json({ totalRevenue, totalOrders, avgTicket, totalExpenses, netProfit, mrr });
  } catch (err) { next(err); }
});

router.get('/revenue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || '30d';
    const days = parseInt(period) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        date: { gte: since },
        status: { in: ['PAID', 'SHIPPED', 'ACTIVE'] },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    orders.forEach(o => {
      const key = o.date.toISOString().split('T')[0];
      grouped[key] = (grouped[key] || 0) + o.total;
    });

    const series = Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
    res.json(series);
  } catch (err) { next(err); }
});

router.get('/channels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['PAID', 'SHIPPED', 'ACTIVE'] } },
      include: { channel: true },
    });

    const channelMap: Record<string, { name: string; color: string; revenue: number; orders: number }> = {};
    orders.forEach(o => {
      if (!channelMap[o.channelId]) {
        channelMap[o.channelId] = { name: o.channel.name, color: o.channel.color, revenue: 0, orders: 0 };
      }
      channelMap[o.channelId].revenue += o.total;
      channelMap[o.channelId].orders += 1;
    });

    res.json(Object.values(channelMap));
  } catch (err) { next(err); }
});

router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['PAID', 'SHIPPED', 'ACTIVE'] } },
      include: { product: true },
    });

    const productMap: Record<string, { name: string; revenue: number; volume: number }> = {};
    orders.forEach(o => {
      if (!productMap[o.productId]) {
        productMap[o.productId] = { name: o.product.name, revenue: 0, volume: 0 };
      }
      productMap[o.productId].revenue += o.total;
      productMap[o.productId].volume += 1;
    });

    const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    res.json(sorted);
  } catch (err) { next(err); }
});

export default router;
