import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  const storeId = req.user!.storeId!;
  const customers = await prisma.customer.findMany({
    where: { store_id: storeId },
    orderBy: { created_at: 'desc' }
  });
  res.json(customers);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ name: z.string().min(1), phone: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;

  // Check unique phone within store
  const existing = await prisma.customer.findFirst({
    where: { store_id: storeId, phone: parsed.data.phone }
  });
  if (existing) return res.status(400).json({ error: 'Bu telefon raqam allaqachon mavjud' });

  const created = await prisma.customer.create({
    data: { ...parsed.data, store_id: storeId }
  });
  res.status(201).json(created);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ name: z.string().min(1).optional(), phone: z.string().min(3).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;

  try {
    const existing = await prisma.customer.findFirst({ where: { id: req.params.id, store_id: storeId } });
    if (!existing) return res.status(404).json({ error: 'Mijoz topilmadi' });

    const updated = await prisma.customer.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Xatolik' });
  }
});

// Merge two customers (by targetId keeps, sourceId merges debts/orders)
router.post('/merge', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ sourceId: z.string().uuid(), targetId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find both in STORE
      const source = await tx.customer.findFirst({ where: { id: parsed.data.sourceId, store_id: storeId } });
      const target = await tx.customer.findFirst({ where: { id: parsed.data.targetId, store_id: storeId } });

      if (!source || !target) throw new Error('Mijoz topilmadi');

      await tx.debt.updateMany({
        where: { customer_id: source.id }, // Debts already belong to store because customer does
        data: { customer_id: target.id, customer_name: target.name, customer_phone: target.phone }
      });
      await tx.order.updateMany({
        where: { customer_id: source.id },
        data: { customer_id: target.id, customer_name: target.name, customer_phone: target.phone }
      });

      await tx.customer.delete({ where: { id: source.id } });

      return target;
    });

    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
