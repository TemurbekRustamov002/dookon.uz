import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { type AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Enforce that only Owner or Store Admin can manage users
router.use(requireRole(['OWNER', 'ADMIN']));

const userSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(4),
    role: z.enum(['ADMIN', 'CASHIER', 'WAREHOUSE', 'DELIVERY', 'OWNER']),
});

const updateUserSchema = z.object({
    username: z.string().min(3).optional(),
    password: z.string().min(4).optional(),
    role: z.enum(['ADMIN', 'CASHIER', 'WAREHOUSE', 'DELIVERY', 'OWNER']).optional(),
});

// GET /api/users - List all employees
router.get('/', async (req: AuthRequest, res: Response) => {
    const storeId = req.user!.storeId;
    const users = await prisma.user.findMany({
        where: { store_id: storeId },
        select: { id: true, username: true, role: true, created_at: true } // Don't return password
    });
    res.json(users);
});

// POST /api/users - Create new employee
router.post('/', async (req: AuthRequest, res: Response) => {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const storeId = req.user!.storeId;

    // Check if username exists in store
    const existing = await prisma.user.findFirst({
        where: { store_id: storeId, username: parsed.data.username }
    });

    if (existing) {
        return res.status(400).json({ error: 'Bu foydalanuvchi nomi band' });
    }

    try {
        const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
        const newUser = await prisma.user.create({
            data: {
                store_id: storeId!,
                username: parsed.data.username,
                password: hashedPassword,
                role: parsed.data.role
            },
            select: { id: true, username: true, role: true, created_at: true }
        });
        res.status(201).json(newUser);
    } catch (e: any) {
        res.status(500).json({ error: 'Xatolik yuz berdi: ' + e.message });
    }
});

// PUT /api/users/:id - Update employee
router.put('/:id', async (req: AuthRequest, res: Response) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const storeId = req.user!.storeId;
    const { id } = req.params;

    // Prevent self-demotion or lockout if needed, but let's just allow updates
    // Only check if user belongs to store
    const targetUser = await prisma.user.findFirst({
        where: { id, store_id: storeId }
    });

    if (!targetUser) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const data: any = {};
    if (parsed.data.username) data.username = parsed.data.username;
    if (parsed.data.role) data.role = parsed.data.role;
    if (parsed.data.password) {
        data.password = await bcrypt.hash(parsed.data.password, 10);
    }

    try {
        const updated = await prisma.user.update({
            where: { id },
            data,
            select: { id: true, username: true, role: true }
        });
        res.json(updated);
    } catch (e: any) {
        res.status(500).json({ error: 'Xatolik: ' + e.message });
    }
});

// DELETE /api/users/:id - Delete employee
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    const storeId = req.user!.storeId;
    const { id } = req.params;

    if (id === req.user!.userId) {
        return res.status(400).json({ error: 'O\'z hisobingizni o\'chira olmaysiz' });
    }

    try {
        const result = await prisma.user.deleteMany({
            where: { id, store_id: storeId }
        });

        if (result.count === 0) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

        res.json({ message: 'O\'chirildi' });
    } catch (e: any) {
        res.status(500).json({ error: 'Xatolik: ' + e.message });
    }
});

export default router;
