import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  const storeId = req.user!.storeId!;
  const where: any = { store_id: storeId };

  if (status && status !== 'all') {
    where.status = String(status);
  }

  const debts = await prisma.debt.findMany({
    where,
    orderBy: { created_at: 'desc' }
  });
  res.json(debts);
});

router.get('/:id/payments', async (req: AuthRequest, res: Response) => {
  // Check ownership
  const storeId = req.user!.storeId!;
  const debt = await prisma.debt.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!debt) return res.status(404).json({ error: "Qarz topilmadi" });

  const payments = await prisma.debtPayment.findMany({
    where: { debt_id: req.params.id },
    orderBy: { payment_date: 'desc' }
  });
  res.json(payments);
});

router.get('/:id/details', async (req: AuthRequest, res: Response) => {
  const storeId = req.user!.storeId!;
  const debt = await prisma.debt.findFirst({
    where: { id: req.params.id, store_id: storeId },
    include: {
      payments: { orderBy: { payment_date: 'desc' } },
      sales_links: {
        include: {
          sale: {
            include: {
              sale_items: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!debt) return res.status(404).json({ error: "Qarz topilmadi" });
  res.json(debt);
});

const paymentSchema = z.object({ amount: z.number().positive() });

router.post('/:id/payments', async (req: AuthRequest, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find existing debt within store
      const debt = await tx.debt.findFirst({
        where: { id: req.params.id, store_id: storeId }
      });

      if (!debt) throw new Error('Debt not found');
      if (parsed.data.amount > debt.remaining_amount) throw new Error('Amount exceeds remaining');

      await tx.debtPayment.create({ data: { debt_id: req.params.id, amount: parsed.data.amount } });

      const updated = await tx.debt.update({
        where: { id: req.params.id },
        data: {
          paid_amount: { increment: parsed.data.amount },
          remaining_amount: { decrement: parsed.data.amount },
        }
      });

      if (updated.remaining_amount <= 0 && updated.status !== 'paid') {
        await tx.debt.update({
          where: { id: req.params.id },
          data: { status: 'paid' }
        });
        updated.status = 'paid';
      }

      return updated;
    });

    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
