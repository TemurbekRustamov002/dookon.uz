import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const router = Router();

// --- 1. Get Partner Stats ---
router.get('/stats', async (req: AuthRequest, res: Response) => {
    // Expect partner_id in req.user (we need to ensure it's added in auth middleware or here)
    // Wait, auth middleware puts everything in req.user.
    // However, our JWT payload only has { userId, storeId, role, username }.
    // We need to fetch the partnerId from user.

    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { partner: true }
    });

    if (!user || user.role !== 'PARTNER' || !user.partner_id) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
    }

    const partnerId = user.partner_id;

    // Calculate detailed stats
    const stores = await prisma.store.findMany({
        where: { partner_id: partnerId },
        include: {
            _count: { select: { sales: true } }
        }
    });

    const activeStores = stores.filter(s => s.is_active).length;
    const totalStores = stores.length;

    // Calculate total revenue from all stores (optional, heavy query)
    // Or just rely on pre-calculated `total_earnings` in Partner model if we update it periodically.
    // For now, let's trust the Partner model field.
    const partner = user.partner!;

    res.json({
        totalStores,
        activeStores,
        totalEarnings: partner.total_earnings,
        commissionPercent: partner.commission_percent,
        storesList: stores.map(s => ({
            id: s.id,
            name: s.name,
            ownerName: s.owner_name, // Added owner name
            phone: s.phone,
            plan: s.plan,
            isActive: s.is_active,
            subscriptionEndsAt: s.subscription_ends_at, // Useful to see
            salesCount: s._count.sales,
            joinedAt: s.created_at
        }))
    });
});

// --- 2. Update Partner Settings (Password) ---
const updateSchema = z.object({
    password: z.string().min(6).optional(),
    currentPassword: z.string().optional()
});

router.put('/settings', async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const parsed = updateSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { password, currentPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    if (password) {
        if (!currentPassword) return res.status(400).json({ error: 'Joriy parol kiritilmadi' });
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(400).json({ error: 'Joriy parol xato' });

        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed }
        });
    }

    res.json({ message: 'Sozlamalar yangilandi' });
});

// --- 3. Create Store (Partner Onboarding) ---
const createStoreSchema = z.object({
    name: z.string().min(3),
    phone: z.string().min(9),
    password: z.string().min(6),
    ownerName: z.string(),
});

router.post('/stores', async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { partner: true } });

    if (!user || user.role !== 'PARTNER' || !user.partner_id) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
    }

    const partnerId = user.partner_id;
    const parsed = createStoreSchema.safeParse(req.body);

    if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const firstErrorKey = Object.keys(fieldErrors)[0] as keyof typeof fieldErrors;
        const firstErrorMessage = fieldErrors[firstErrorKey]?.[0] || 'Validatsiya xatosi';
        return res.status(400).json({ error: `${firstErrorKey}: ${firstErrorMessage}` });
    }
    const { name, phone, password, ownerName } = parsed.data;

    const existing = await prisma.store.findUnique({ where: { phone } });
    if (existing) return res.status(400).json({ error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const store = await tx.store.create({
                data: {
                    name,
                    phone,
                    owner_name: ownerName,
                    plan: 'STANDARD',
                    partner_id: partnerId, // Linked to this partner
                }
            });

            const newUser = await tx.user.create({
                data: {
                    username: 'admin', // Default admin login for the store
                    password: hashedPassword,
                    role: 'OWNER',
                    store_id: store.id
                }
            });

            return store;
        });

        res.status(201).json({ message: 'Do\'kon muvaffaqiyatli ochildi', storeId: result.id });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Do\'kon ochishda xatolik' });
    }
});

// --- 4. Update Store (Reset Password / Logic / Plan) ---
router.put('/stores/:id', async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const storeId = req.params.id;
    const { password, name, phone, plan, subscriptionEndsAt, isActive } = req.body;

    // 1. Verify Partner
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { partner: true } });
    if (!user || user.role !== 'PARTNER' || !user.partner_id) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
    }

    // 2. Verify Store belongs to Partner
    const store = await prisma.store.findFirst({
        where: { id: storeId, partner_id: user.partner_id }
    });

    if (!store) return res.status(404).json({ error: 'Do\'kon topilmadi yoki sizga tegishli emas' });

    // 3. Update
    try {
        await prisma.$transaction(async (tx) => {
            // Update Store details
            const updateData: any = {};
            if (name) updateData.name = name;
            if (phone) updateData.phone = phone;
            if (plan) updateData.plan = plan; // 'STANDARD' | 'PREMIUM'
            if (isActive !== undefined) updateData.is_active = Boolean(isActive);
            if (subscriptionEndsAt) updateData.subscription_ends_at = new Date(subscriptionEndsAt);

            if (Object.keys(updateData).length > 0) {
                await tx.store.update({
                    where: { id: storeId },
                    data: updateData
                });
            }

            // Update Owner Password if provided
            if (password && password.length >= 6) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await tx.user.updateMany({
                    where: { store_id: storeId, role: 'OWNER' },
                    data: { password: hashedPassword }
                });
            }
        });
        res.json({ message: 'Do\'kon ma\'lumotlari yangilandi' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Yangilashda xatolik' });
    }
});

export default router;
