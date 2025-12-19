import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const productSchema = z.object({
  name: z.string(),
  barcode: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  purchase_price: z.number(),
  profit_percent: z.number(),
  selling_price: z.number(),
  stock_quantity: z.number(),
  min_stock_alert: z.number(),
  image_url: z.string().optional().nullable(),
  unit: z.string().optional().default('dona'),
  active: z.boolean().optional().default(true),
});

// GET /products
router.get('/', async (req: AuthRequest, res: Response) => {
  const { inStock, search } = req.query;
  const storeId = req.user?.storeId;

  if (!storeId) {
    return res.json([]);
  }

  const where: any = {
    store_id: storeId,
    active: true,
  };

  if (inStock === 'true') {
    where.stock_quantity = { gt: 0 };
  }

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { barcode: { contains: String(search) } },
    ];
  }

  try {
    const products = await prisma.product.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { category: true }
    });
    res.json(products);
  } catch (error) {
    console.error("Products List Error:", error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /products/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        store_id: req.user!.storeId!,
        active: true
      },
      include: { category: true }
    });
    if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// POST /products
router.post('/', async (req: AuthRequest, res: Response) => {
  const result = productSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(result.error);
  }

  const storeId = req.user!.storeId!;

  // Check barcode uniqueness WITHIN store
  if (result.data.barcode) {
    const existing = await prisma.product.findFirst({
      where: {
        store_id: storeId,
        barcode: result.data.barcode
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Bu shtrix-kod allaqachon mavjud' });
    }
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: { ...result.data, store_id: storeId },
        include: { category: true }
      });

      // Log initial stock
      if (newProduct.stock_quantity > 0) {
        await tx.productHistory.create({
          data: {
            store_id: storeId,
            product_id: newProduct.id,
            user_id: req.user!.userId,
            type: 'import',
            quantity: newProduct.stock_quantity,
            stock_after: newProduct.stock_quantity,
            note: 'Dastlabki kiritish'
          }
        });
      }
      return newProduct;
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Yaratishda xatolik' });
  }
});

// PUT /products/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const result = productSchema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const storeId = req.user!.storeId!;

  try {
    // Check ownership first
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, store_id: storeId }
    });
    if (!existing) return res.status(404).json({ error: 'Mahsulot topilmadi' });

    const product = await prisma.$transaction(async (tx) => {
      const updateData = result.data;
      const updated = await tx.product.update({
        where: { id: req.params.id },
        data: updateData,
      });

      // Log if stock changed
      if (updateData.stock_quantity !== undefined && updateData.stock_quantity !== existing.stock_quantity) {
        const diff = updateData.stock_quantity - existing.stock_quantity;
        await tx.productHistory.create({
          data: {
            store_id: storeId,
            product_id: updated.id,
            user_id: req.user!.userId,
            type: 'edit',
            quantity: diff,
            stock_after: updated.stock_quantity,
            note: 'Tahrirlash orqali o\'zgartirildi'
          }
        });
      }
      return updated;
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Yangilashda xatolik' });
  }
});

// DELETE /products/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;

    // Check ownership
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, store_id: storeId }
    });
    if (!existing) return res.status(404).json({ error: 'Mahsulot topilmadi' });

    // Soft delete
    await prisma.product.update({
      where: { id: req.params.id },
      data: { active: false }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "O'chirishda xatolik yuz berdi" });
  }
});

export default router;
