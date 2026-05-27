// Endpoint analytics per Dashboard + Reports
import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';

const router = Router();

// Stati ordine considerati "fatturato" (escludono PENDING/REFUNDED)
const SUCCESS = ['PAID', 'SHIPPED', 'ACTIVE'] as const;

// Mappa un period name (dal frontend) → range corrente + range precedente per delta %
function periodToRange(period: string) {
  const now = new Date();
  let from: Date, prevFrom: Date, prevTo: Date;

  switch (period) {
    case '7d': {
      from = new Date(now); from.setDate(from.getDate() - 7);
      prevTo = new Date(from);
      prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - 7);
      break;
    }
    case 'q': {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      from = new Date(now.getFullYear(), qStart, 1);
      prevFrom = new Date(now.getFullYear(), qStart - 3, 1);
      prevTo = from;
      break;
    }
    case 'ytd': {
      from = new Date(now.getFullYear(), 0, 1);
      prevFrom = new Date(now.getFullYear() - 1, 0, 1);
      prevTo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    }
    case 'month':
    default: {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevTo = from;
      break;
    }
  }
  return { from, to: now, prevFrom, prevTo };
}

// Variazione % (cur vs prev). Ritorna null se non comparabile.
const pctDelta = (cur: number, prev: number) => prev > 0 ? ((cur - prev) / prev) * 100 : null;
const sumKey = <T,>(arr: T[], key: keyof T) => arr.reduce((s, x) => s + (Number(x[key]) || 0), 0);

// ─── /overview?period=month ───
// Restituisce activity, financial, compare per il periodo richiesto.
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month';
    const { from, to, prevFrom, prevTo } = periodToRange(period);

    const [orders, prevOrders, expenses, newCustomers, activeSubs] = await Promise.all([
      prisma.order.findMany({ where: { status: { in: [...SUCCESS] }, date: { gte: from, lte: to } } }),
      prisma.order.findMany({ where: { status: { in: [...SUCCESS] }, date: { gte: prevFrom, lt: prevTo } } }),
      prisma.expense.findMany({ where: { date: { gte: from, lte: to } } }),
      prisma.customer.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE', createdAt: { gte: from, lte: to } } }),
    ]);

    const totalRevenue = sumKey(orders, 'total');
    const totalCogs    = sumKey(orders, 'cogs');
    const totalExpenses= sumKey(expenses, 'amount');
    const netProfit    = totalRevenue - totalCogs - totalExpenses;
    const margin       = totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0;

    // Periodo precedente: solo orders (le spese ci sono ma cambiamo poco la firma)
    const prevRevenue = sumKey(prevOrders, 'total');
    const prevCogs    = sumKey(prevOrders, 'cogs');
    const prevProfit  = prevRevenue - prevCogs;

    res.json({
      period: { key: period, from, to },
      activity: {
        orders: orders.length,
        subscriptions: activeSubs,
        newCustomers,
      },
      financial: {
        totalRevenue, totalCogs, totalExpenses, netProfit, margin,
      },
      compare: {
        revenueDelta: pctDelta(totalRevenue, prevRevenue),
        ordersDelta:  pctDelta(orders.length, prevOrders.length),
        profitDelta:  pctDelta(netProfit, prevProfit),
      },
    });
  } catch (err) { next(err); }
});

// ─── /revenue?period=30d ───
// Serie temporale ricavi giornalieri (per charts futuri).
router.get('/revenue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || '30d';
    const days = parseInt(period) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await prisma.order.findMany({
      where: { date: { gte: since }, status: { in: [...SUCCESS] } },
      orderBy: { date: 'asc' },
    });

    const grouped: Record<string, number> = {};
    orders.forEach(o => {
      const key = o.date.toISOString().split('T')[0];
      grouped[key] = (grouped[key] || 0) + o.total;
    });
    res.json(Object.entries(grouped).map(([date, revenue]) => ({ date, revenue })));
  } catch (err) { next(err); }
});

// ─── /channels?period=month ───
// Aggregato per canale: revenue e numero ordini nel periodo.
router.get('/channels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month';
    const { from, to } = periodToRange(period);

    const orders = await prisma.order.findMany({
      where: { status: { in: [...SUCCESS] }, date: { gte: from, lte: to } },
      include: { channel: true },
    });

    const map: Record<string, { name: string; color: string; revenue: number; orders: number }> = {};
    orders.forEach(o => {
      const id = o.channelId;
      if (!map[id]) map[id] = { name: o.channel.name, color: o.channel.color, revenue: 0, orders: 0 };
      map[id].revenue += o.total;
      map[id].orders  += 1;
    });
    // Ordina per revenue desc
    res.json(Object.values(map).sort((a, b) => b.revenue - a.revenue));
  } catch (err) { next(err); }
});

// ─── /products?period=month ───
// Top prodotti per revenue (per Reports page futura).
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month';
    const { from, to } = periodToRange(period);

    const items = await prisma.orderItem.findMany({
      where: { order: { status: { in: [...SUCCESS] }, date: { gte: from, lte: to } } },
      include: { product: true },
    });

    const map: Record<string, { name: string; revenue: number; volume: number }> = {};
    items.forEach(item => {
      const pid = item.productId;
      const pname = item.product.name;
      if (!map[pid]) map[pid] = { name: pname, revenue: 0, volume: 0 };
      map[pid].revenue += item.unitPrice * item.quantity;
      map[pid].volume  += item.quantity;
    });
    res.json(Object.values(map).sort((a, b) => b.revenue - a.revenue));
  } catch (err) { next(err); }
});

// ─── /recent-transactions?limit=6 ───
// Mix di ultimi ordini (entrate) e spese (uscite), ordinati per data desc.
router.get('/recent-transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 6, 50);

    const [orders, expenses] = await Promise.all([
      prisma.order.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        include: { customer: true, product: true, channel: true },
      }),
      prisma.expense.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        include: { channel: true },
      }),
    ]);

    const txs = [
      ...orders.map(o => ({
        id: `o_${o.id}`,
        kind: 'income' as const,
        date: o.date,
        amount: o.total,
        name: `${o.product?.name || '—'} — ${o.customer?.name || '—'}`,
        meta: o.channel?.name || 'Diretto',
      })),
      ...expenses.map(e => ({
        id: `e_${e.id}`,
        kind: 'expense' as const,
        date: e.date,
        amount: -e.amount,
        name: e.desc,
        meta: e.channel?.name || 'Spesa operativa',
      })),
    ];

    txs.sort((a, b) => b.date.getTime() - a.date.getTime());
    res.json(txs.slice(0, limit));
  } catch (err) { next(err); }
});

export default router;
