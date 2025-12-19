import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

// --- Login for Store Users ---
const loginSchema = z.object({
    storePhone: z.string().optional(), // Optional for Super Admin
    username: z.string(),
    password: z.string(),
    isSuperAdmin: z.boolean().optional(),
    isPartner: z.boolean().optional()
});

router.post('/login', async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const { storePhone, username, password, isSuperAdmin, isPartner } = parsed.data;

    let user, store;

    if (isSuperAdmin) {
        // --- Super Admin Login ---
        user = await prisma.user.findFirst({
            where: { store_id: null, username, role: 'SUPER_ADMIN' }
        });

        if (!user) return res.status(401).json({ error: 'Super Admin topilmadi' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Parol xato' });

        store = { id: 'super-admin', name: 'System Admin', plan: 'PREMIUM' };

    } else if (isPartner) {
        // --- Partner Login ---
        user = await prisma.user.findFirst({
            where: {
                role: 'PARTNER',
                username
            },
            include: { partner: true }
        });

        if (!user || !user.partner) return res.status(401).json({ error: 'Hamkor topilmadi' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Parol xato' });

        store = { id: 'partner', name: user.partner.name, plan: 'PARTNER' }; // Dummy store object for consistent response

    } else {
        // --- Regular Store Login ---
        if (!storePhone) return res.status(400).json({ error: 'Do\'kon telefon raqami kiritilmadi' });

        // 1. Find Store
        const foundStore = await prisma.store.findUnique({ where: { phone: storePhone } });
        if (!foundStore) return res.status(401).json({ error: 'Do\'kon topilmadi' });
        if (!foundStore.is_active) return res.status(403).json({ error: 'Do\'kon faol emas' });
        store = foundStore;

        // 2. Find User in Store
        user = await prisma.user.findFirst({
            where: { store_id: store.id, username }
        });

        if (!user) return res.status(401).json({ error: 'Login yoki parol xato' });

        // 3. Check Password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Login yoki parol xato' });
    }

    // 4. Generate Token
    const token = jwt.sign(
        {
            userId: user.id,
            storeId: store.id === 'super-admin' ? null : store.id,
            role: user.role,
            username: user.username,
            plan: (store as any).plan
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    // Set HttpOnly Cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
        message: 'Muvaffaqiyatli kirildi',
        user: { id: user.id, username: user.username, role: user.role },
        store: { id: store.id, name: store.name, plan: (store as any).plan }
    });
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Chiqildi' });
});

// --- Register New Store ---
const registerStoreSchema = z.object({
    name: z.string().min(3),
    phone: z.string().min(9),
    password: z.string().min(6),
    ownerName: z.string(),
    partnerLogin: z.string().optional(), // Changed from partnerId to partnerLogin
});

router.post('/register', async (req: Request, res: Response) => {
    try {
        const parsed = registerStoreSchema.safeParse(req.body);
        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            const firstErrorKey = Object.keys(fieldErrors)[0] as keyof typeof fieldErrors;
            const firstErrorMessage = fieldErrors[firstErrorKey]?.[0] || 'Validatsiya xatosi';
            return res.status(400).json({ error: `${firstErrorKey}: ${firstErrorMessage}` });
        }

        const { name, phone, password, ownerName, partnerLogin } = parsed.data;

        let finalPartnerId: string | null = null;

        // Resolve Partner Login
        if (partnerLogin && partnerLogin.trim().length > 0) {
            const login = partnerLogin.trim();

            // 1. Try finding by User username (most likely)
            const partnerUser = await prisma.user.findFirst({
                where: { username: login, role: 'PARTNER' },
                include: { partner: true }
            });

            if (partnerUser && partnerUser.partner) {
                finalPartnerId = partnerUser.partner.id;
            } else {
                // 2. Try finding by Partner phone number directly
                const partnerByPhone = await prisma.partner.findUnique({
                    where: { phone: login }
                });

                if (partnerByPhone) {
                    finalPartnerId = partnerByPhone.id;
                } else {
                    return res.status(400).json({ error: 'Hamkor topilmadi (Login noto\'g\'ri)' });
                }
            }
        }

        const existing = await prisma.store.findUnique({ where: { phone } });
        if (existing) return res.status(400).json({ error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Store and Owner User Transaction
        const result = await prisma.$transaction(async (tx) => {
            const store = await tx.store.create({
                data: {
                    name,
                    phone,
                    owner_name: ownerName,
                    plan: 'STANDARD',
                    partner_id: finalPartnerId,
                    is_active: true
                }
            });

            const user = await tx.user.create({
                data: {
                    username: 'admin', // Default admin user
                    password: hashedPassword,
                    role: 'OWNER',
                    store_id: store.id
                }
            });

            return { store, user };
        });

        res.status(201).json({ message: 'Do\'kon muvaffaqiyatli ochildi', storeId: result.store.id });

    } catch (e: any) {
        console.error('Register Error:', e);
        res.status(500).json({ error: 'Xatolik yuz berdi: ' + e.message });
    }
});

export default router;
