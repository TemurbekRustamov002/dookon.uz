import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  const storeId = req.user?.storeId;
  if (!storeId) return res.json([]);

  try {
    const categories = await prisma.category.findMany({
      where: { store_id: storeId },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Categories Error' });
  }
});

const categorySchema = z.object({ name: z.string().min(1) });

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;

  // Check valid unique name
  const existing = await prisma.category.findFirst({
    where: { store_id: storeId, name: parsed.data.name }
  });
  if (existing) return res.status(400).json({ error: 'Bu kategoriya mavjud' });

  const created = await prisma.category.create({
    data: { ...parsed.data, store_id: storeId }
  });
  res.status(201).json(created);
});

export default router;
