import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { type AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const expenseSchema = z.object({
    name: z.string().min(1),
    amount: z.number().positive(),
    type: z.enum(['rent', 'salary', 'utility', 'other', 'tax', 'maintenance']), // Expanded types
    description: z.string().optional(),
    date: z.string().optional() // ISO date string
});

// GET /api/expenses
router.get('/', async (req: AuthRequest, res: Response) => {
    const storeId = req.user!.storeId!;
    const { from, to } = req.query as { from?: string; to?: string };

    const where: any = { store_id: storeId };

    if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(from);
        if (to) where.date.lte = new Date(to);
    }

    const expenses = await prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' }
    });
    res.json(expenses);
});

// POST /api/expenses
router.post('/', requireRole(['OWNER', 'ADMIN', 'CASHIER']), async (req: AuthRequest, res: Response) => {
    const storeId = req.user!.storeId!;
    const parsed = expenseSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    try {
        const expense = await prisma.expense.create({
            data: {
                store_id: storeId,
                name: parsed.data.name,
                amount: parsed.data.amount,
                type: parsed.data.type,
                description: parsed.data.description,
                date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
            }
        });
        res.status(201).json(expense);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', requireRole(['OWNER', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    const storeId = req.user!.storeId!;
    try {
        await prisma.expense.deleteMany({
            where: { id: req.params.id, store_id: storeId }
        });
        res.json({ message: 'Deleted' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
