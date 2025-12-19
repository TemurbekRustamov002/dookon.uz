import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { type AuthRequest, requirePremium } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
console.log('[router] bundles loaded');

router.use(requirePremium as any);

const bundleSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  active: z.boolean().optional(),
});

router.get('/_health', (_req: any, res: Response) => res.json({ ok: true }));

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const bundles = await prisma.bundle.findMany({
      where: { store_id: storeId },
      include: { items: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(bundles);
  } catch (e) {
    console.error("Bundles GET Error:", e);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = bundleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const storeId = req.user!.storeId!;
    const created = await prisma.bundle.create({
      data: { ...parsed.data, store_id: storeId }
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("Bundles Create Error:", e);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = bundleSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;
  const existing = await prisma.bundle.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existing) return res.status(404).json({ error: 'To\'plam topilmadi' });

  const updated = await prisma.bundle.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});

// Manage items
const itemSchema = z.object({ product_id: z.string().uuid(), quantity: z.number().min(0.001) });

router.post('/:id/items', async (req: AuthRequest, res: Response) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;
  const existingBundle = await prisma.bundle.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existingBundle) return res.status(404).json({ error: 'To\'plam topilmadi' });

  // Verify product
  const product = await prisma.product.findFirst({ where: { id: parsed.data.product_id, store_id: storeId } });
  if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });

  const created = await prisma.bundleItem.create({ data: { bundle_id: req.params.id, product_id: parsed.data.product_id, quantity: parsed.data.quantity } });
  res.status(201).json(created);
});

router.put('/:id/items/:productId', async (req: AuthRequest, res: Response) => {
  const q = z.object({ quantity: z.number().min(0.001) }).safeParse(req.body);
  if (!q.success) return res.status(400).json(q.error.flatten());

  const storeId = req.user!.storeId!;
  const existingBundle = await prisma.bundle.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existingBundle) return res.status(404).json({ error: 'To\'plam topilmadi' });

  await prisma.bundleItem.updateMany({
    where: { bundle_id: req.params.id, product_id: req.params.productId },
    data: { quantity: q.data.quantity }
  });

  // Return updated item or success
  res.json({ success: true });
});

router.delete('/:id/items/:productId', async (req: AuthRequest, res: Response) => {
  const storeId = req.user!.storeId!;
  const existingBundle = await prisma.bundle.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existingBundle) return res.status(404).json({ error: 'To\'plam topilmadi' });

  await prisma.bundleItem.deleteMany({
    where: {
      bundle_id: req.params.id,
      product_id: req.params.productId
    }
  });
  res.status(204).send();
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const storeId = req.user!.storeId!;
  const existing = await prisma.bundle.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existing) return res.status(404).json({ error: 'To\'plam topilmadi' });

  await prisma.bundle.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
