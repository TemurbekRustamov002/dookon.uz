import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { type AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/logs
router.get('/', async (req: AuthRequest, res: Response) => {
    const storeId = req.user!.storeId!;
    const { product_id, from, to, limit } = req.query as { product_id?: string; from?: string; to?: string; limit?: string };

    const where: any = { store_id: storeId };

    if (product_id) where.product_id = product_id;
    if (from || to) {
        where.created_at = {};
        if (from) where.created_at.gte = new Date(from);
        if (to) where.created_at.lte = new Date(to);
    }

    try {
        const logs = await prisma.productHistory.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: limit ? parseInt(limit) : 50,
            include: {
                product: { select: { name: true } },
                user: { select: { username: true } }
            }
        });
        res.json(logs);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
