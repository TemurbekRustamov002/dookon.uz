import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { type AuthRequest, requirePremium } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// Orders (Online Shop) is a PREMIUM feature
router.use(requirePremium as any);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  const storeId = req.user!.storeId!;

  const where: any = { store_id: storeId };
  if (status && status !== 'all') {
    where.status = String(status);
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { order_items: { include: { product: true } } }
  });
  res.json(orders);
});

const orderItem = z.object({
  product_id: z.string(),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  total: z.number().nonnegative(),
});
const orderSchema = z.object({
  customer_name: z.string(),
  customer_phone: z.string(),
  customer_address: z.string().optional().nullable(),
  total_amount: z.number().nonnegative(),
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']).default('pending'),
  notes: z.string().optional().nullable(),
  items: z.array(orderItem),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;

  // ensure customer exists and link (Scoped to store)
  const customer = await prisma.customer.upsert({
    where: {
      store_id_phone: {
        store_id: storeId,
        phone: parsed.data.customer_phone
      }
    },
    update: { name: parsed.data.customer_name },
    create: {
      store_id: storeId,
      phone: parsed.data.customer_phone,
      name: parsed.data.customer_name
    },
  });

  const order = await prisma.order.create({
    data: {
      store_id: storeId,
      customer_name: parsed.data.customer_name,
      customer_phone: parsed.data.customer_phone,
      customer_id: customer.id,
      customer_address: parsed.data.customer_address ?? null,
      total_amount: parsed.data.total_amount,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      order_items: { create: parsed.data.items.map(i => ({ ...i })) }
    }
  });

  res.status(201).json(order);
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const statusSchema = z.object({ status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']) });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;
  const newStatus = parsed.data.status;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current order with items
      const existing = await tx.order.findFirst({
        where: { id: req.params.id, store_id: storeId },
        include: { order_items: true }
      });

      if (!existing) throw new Error('Buyurtma topilmadi');

      // Prevent duplicate processing if already delivered
      if (existing.status === 'delivered' && newStatus === 'delivered') {
        return existing;
      }

      // 2. Update status
      const updatedOrder = await tx.order.update({
        where: { id: req.params.id },
        data: { status: newStatus }
      });

      // 3. If status changed to 'delivered', process sale and stock
      if (newStatus === 'delivered' && existing.status !== 'delivered') {
        const saleNumber = `ONL-${existing.id.substring(0, 8).toUpperCase()}`;

        const sale = await tx.sale.create({
          data: {
            store_id: storeId,
            sale_number: saleNumber,
            total_amount: existing.total_amount,
            payment_type: 'naqd',
            cashier_name: 'Online: ' + existing.customer_name,
            created_at: new Date()
          }
        });

        for (const item of existing.order_items) {
          const product = await tx.product.findUnique({ where: { id: item.product_id } });
          if (!product) throw new Error(`Mahsulot topilmadi: ${item.product_id}`);

          if (product.stock_quantity < item.quantity) {
            throw new Error(`Omborda yetarli mahsulot yo'q: ${product.name}`);
          }

          await tx.product.update({
            where: { id: item.product_id },
            data: { stock_quantity: product.stock_quantity - item.quantity }
          });

          await tx.saleItem.create({
            data: {
              sale_id: sale.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              total: item.total
            }
          });
        }
      }

      return updatedOrder;
    });

    res.json(result);

  } catch (error: any) {
    console.error('Order update error:', error);
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi' });
  }
});

export default router;
