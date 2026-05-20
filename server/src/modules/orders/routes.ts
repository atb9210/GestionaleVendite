import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const OrderSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  channelId: z.string().min(1),
  total: z.number().min(0),
  cogs: z.number().min(0),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'REFUNDED', 'ACTIVE']).default('PENDING'),
  date: z.string().transform(s => new Date(s)),
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
      include: { customer: true, product: true, channel: true, subscription: true },
      orderBy: { date: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

router.post('/', validate(OrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shippingData, subData, ...orderData } = req.body;

    // Generate order number
    const lastOrder = await prisma.order.findFirst({ orderBy: { orderNumber: 'desc' } });
    const lastNum = lastOrder ? parseInt(lastOrder.orderNumber.replace('#', '')) : 1000;
    const orderNumber = `#${lastNum + 1}`;

    // Handle subscription creation if subData present
    let subscriptionId: string | undefined;
    if (subData) {
      const sub = await prisma.subscription.create({
        data: {
          customerId: orderData.customerId,
          plan: subData.plan,
          mrr: subData.mrr,
          nextDate: subData.nextDate,
          status: 'ACTIVE',
        },
      });
      subscriptionId = sub.id;
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        ...orderData,
        orderNumber,
        subscriptionId,
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
      include: { customer: true, product: true, channel: true, subscription: true },
    });

    // Update customer LTV and ordersCount
    await prisma.customer.update({
      where: { id: orderData.customerId },
      data: {
        ltv: { increment: orderData.total },
        ordersCount: { increment: 1 },
        lastOrderDate: orderData.date,
      },
    });

    // Decrement product stock if applicable
    const product = await prisma.product.findUnique({ where: { id: orderData.productId } });
    if (product && product.stock !== null) {
      await prisma.product.update({
        where: { id: orderData.productId },
        data: { stock: { decrement: 1 } },
      });
    }

    res.status(201).json(order);
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shippingData, subData, ...updateData } = req.body;

    const data: any = { ...updateData };
    if (data.date) data.date = new Date(data.date);
    if (shippingData) {
      data.shippingAddress = shippingData.address;
      data.shippingCivico = shippingData.civico;
      data.shippingCap = shippingData.cap;
      data.shippingCountry = shippingData.country;
      data.shippingTracking = shippingData.tracking;
      data.shippingPhone = shippingData.phone ?? null;
      data.contrassegno = shippingData.contrassegno || false;
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data,
      include: { customer: true, product: true, channel: true, subscription: true },
    });
    res.json(order);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

    // Reverse customer LTV and ordersCount
    await prisma.customer.update({
      where: { id: order.customerId },
      data: {
        ltv: { decrement: order.total },
        ordersCount: { decrement: 1 },
      },
    });

    // Restore product stock if applicable
    const product = await prisma.product.findUnique({ where: { id: order.productId } });
    if (product && product.stock !== null) {
      await prisma.product.update({
        where: { id: order.productId },
        data: { stock: { increment: 1 } },
      });
    }

    await prisma.order.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
