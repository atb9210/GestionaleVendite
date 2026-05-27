import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const ItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  unitCost: z.number().min(0),
});

const OrderSchema = z.object({
  customerId: z.string().min(1),
  channelId: z.string().min(1),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'REFUNDED', 'ACTIVE']).default('PENDING'),
  date: z.string().transform(s => new Date(s)),
  items: z.array(ItemSchema).min(1),
  shippingData: z.object({
    address: z.string().min(1),
    civico: z.string().optional(),
    cap: z.string().optional(),
    country: z.string().default('Italia'),
    tracking: z.string().optional(),
    contrassegno: z.boolean().default(false),
    phone: z.object({ countryCode: z.string().default('IT'), number: z.string() }).optional(),
  }).optional(),
  subData: z.object({
    plan: z.string().min(1),
    mrr: z.number().positive(),
    nextDate: z.string().transform(s => new Date(s)),
  }).optional(),
});

router.get('/next-number', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastOrder = await prisma.order.findFirst({ orderBy: { orderNumber: 'desc' } });
    const lastNum = lastOrder ? parseInt(lastOrder.orderNumber.replace('#', '')) : 1000;
    res.json({ nextNumber: `#${lastNum + 1}` });
  } catch (err) { next(err); }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    if (status) where.status = (status as string).toUpperCase();
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { customer: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }
    const orders = await prisma.order.findMany({
      where,
      include: { customer: true, product: true, channel: true, subscription: true, orderItems: { include: { product: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

router.post('/', validate(OrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, shippingData, subData, ...orderData } = req.body;

    const total = items.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0);
    const cogs  = items.reduce((s: number, i: any) => s + i.unitCost  * i.quantity, 0);

    const lastOrder = await prisma.order.findFirst({ orderBy: { orderNumber: 'desc' } });
    const lastNum = lastOrder ? parseInt(lastOrder.orderNumber.replace('#', '')) : 1000;
    const orderNumber = `#${lastNum + 1}`;

    let subscriptionId: string | undefined;
    if (subData) {
      const sub = await prisma.subscription.create({
        data: { customerId: orderData.customerId, plan: subData.plan, mrr: subData.mrr, nextDate: subData.nextDate, status: 'ACTIVE' },
      });
      subscriptionId = sub.id;
    }

    const order = await prisma.order.create({
      data: {
        ...orderData,
        orderNumber,
        total,
        cogs,
        productId: items[0].productId,
        subscriptionId,
        orderItems: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, unitCost: i.unitCost })) },
        ...(shippingData && {
          shippingAddress: shippingData.address,
          shippingCivico: shippingData.civico,
          shippingCap: shippingData.cap,
          shippingCountry: shippingData.country,
          shippingTracking: shippingData.tracking,
          shippingPhone: shippingData.phone ?? null,
          contrassegno: shippingData.contrassegno || false,
        }),
      },
      include: { customer: true, product: true, channel: true, subscription: true, orderItems: { include: { product: true } } },
    });

    await prisma.customer.update({
      where: { id: orderData.customerId },
      data: { ltv: { increment: total }, ordersCount: { increment: 1 }, lastOrderDate: orderData.date },
    });

    // Decrement stock per ogni item
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product?.stock !== null && product?.stock !== undefined) {
        await prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
    }

    res.status(201).json(order);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, shippingData, ...updateData } = req.body;
    const orderId = req.params.id as string;

    const data: any = { ...updateData };
    if (data.date) data.date = new Date(data.date);

    if (items && items.length > 0) {
      data.total = items.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0);
      data.cogs  = items.reduce((s: number, i: any) => s + i.unitCost  * i.quantity, 0);
      data.productId = items[0].productId;
      // Sostituisce tutti gli items
      await prisma.orderItem.deleteMany({ where: { orderId } });
      data.orderItems = { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, unitCost: i.unitCost })) };
    }

    if (shippingData) {
      data.shippingAddress = shippingData.address;
      data.shippingCivico  = shippingData.civico;
      data.shippingCap     = shippingData.cap;
      data.shippingCountry = shippingData.country;
      data.shippingTracking = shippingData.tracking;
      data.shippingPhone   = shippingData.phone ?? null;
      data.contrassegno    = shippingData.contrassegno || false;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data,
      include: { customer: true, product: true, channel: true, subscription: true, orderItems: { include: { product: true } } },
    });
    res.json(order);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id as string },
      include: { orderItems: true },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

    await prisma.customer.update({
      where: { id: order.customerId },
      data: { ltv: { decrement: order.total }, ordersCount: { decrement: 1 } },
    });

    // Ripristina stock per ogni item
    for (const item of order.orderItems) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product?.stock !== null && product?.stock !== undefined) {
        await prisma.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
    }

    await prisma.order.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
