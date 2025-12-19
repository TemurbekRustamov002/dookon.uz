import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { type AuthRequest, requirePremium } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
console.log('[router] promotions loaded');

// Premium Feature
router.use(requirePremium as any);

const basePromotionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.number().nonnegative(),
  start_at: z.string().optional().nullable(),
  end_at: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

const promotionSchema = basePromotionSchema.refine((data) => data.discount_type !== 'percent' || (data.discount_value >= 0 && data.discount_value <= 100), {
  message: 'Percent discount 0..100 bo\'lishi kerak',
  path: ['discount_value']
});

router.get('/_health', (_req: any, res: Response) => res.json({ ok: true }));

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const promotions = await prisma.promotion.findMany({
      where: { store_id: storeId },
      include: { products: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(promotions);
  } catch (e) {
    console.error("Promotions GET Error:", e);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = promotionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { start_at, end_at, ...rest } = parsed.data;

    const storeId = req.user!.storeId!;

    const created = await prisma.promotion.create({
      data: {
        store: { connect: { id: storeId } },
        ...rest,
        start_at: start_at ? new Date(start_at) : null,
        end_at: end_at ? new Date(end_at) : null,
      }
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("Promotions Create Error:", e);
    res.status(500).json({ error: "Server Error" });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = basePromotionSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { start_at, end_at, ...rest } = parsed.data;

  const storeId = req.user!.storeId!;
  const existing = await prisma.promotion.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existing) return res.status(404).json({ error: 'Aksiya topilmadi' });

  const data: any = { ...rest };
  if (start_at !== undefined) data.start_at = start_at ? new Date(start_at) : null;
  if (end_at !== undefined) data.end_at = end_at ? new Date(end_at) : null;

  const updated = await prisma.promotion.update({
    where: { id: req.params.id },
    data
  });
  res.json(updated);
});

// Attach or detach products to promotion
const linkSchema = z.object({ product_id: z.string().uuid(), override_discount_type: z.enum(['percent', 'fixed']).optional().nullable(), override_discount_value: z.number().nonnegative().optional().nullable() });

router.post('/:id/products', async (req: AuthRequest, res: Response) => {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;
  const existingPromo = await prisma.promotion.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existingPromo) return res.status(404).json({ error: 'Aksiya topilmadi' });

  // Ensure product belongs to store
  const existingProduct = await prisma.product.findFirst({ where: { id: parsed.data.product_id, store_id: storeId } });
  if (!existingProduct) return res.status(404).json({ error: 'Mahsulot topilmadi' });

  const created = await prisma.promotionProduct.create({
    data: { promotion_id: req.params.id, product_id: parsed.data.product_id, override_discount_type: parsed.data.override_discount_type ?? null, override_discount_value: parsed.data.override_discount_value ?? null }
  });
  res.status(201).json(created);
});

router.delete('/:id/products/:productId', async (req: AuthRequest, res: Response) => {
  const storeId = req.user!.storeId!;
  // Verify ownership via promotion
  const existingPromo = await prisma.promotion.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existingPromo) return res.status(404).json({ error: 'Aksiya topilmadi' });

  await prisma.promotionProduct.deleteMany({
    where: {
      promotion_id: req.params.id,
      product_id: req.params.productId
    }
  });
  res.status(204).send();
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const storeId = req.user!.storeId!;
  const promotion = await prisma.promotion.findFirst({
    where: { id: req.params.id, store_id: storeId },
    include: { products: true }
  });
  if (!promotion) return res.status(404).json({ message: 'Not found' });
  res.json(promotion);
});

router.patch('/:id/active', async (req: AuthRequest, res: Response) => {
  const body = z.object({ active: z.boolean() }).safeParse(req.body);
  if (!body.success) return res.status(400).json(body.error.flatten());

  const storeId = req.user!.storeId!;
  const existing = await prisma.promotion.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existing) return res.status(404).json({ error: 'Aksiya topilmadi' });

  const updated = await prisma.promotion.update({ where: { id: req.params.id }, data: { active: body.data.active } });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const storeId = req.user!.storeId!;
  const existing = await prisma.promotion.findFirst({ where: { id: req.params.id, store_id: storeId } });
  if (!existing) return res.status(404).json({ error: 'Aksiya topilmadi' });

  await prisma.promotion.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
