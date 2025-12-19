import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { type AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const storeSettingsSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(), // This acts as login too? If so, need to handle carefully or block if critical
    // Receipt settings
    receipt_header: z.string().optional(),
    receipt_footer: z.string().optional(),
    address: z.string().optional(),
    // Online store settings
    slug: z.string().optional(),
    telegram_bot_token: z.string().optional(),
});

import { setWebhook } from '../lib/telegram.js';

// ... (existing imports)

// Update Store Settings (Owner only)
router.put('/', requireRole(['OWNER']), async (req: AuthRequest, res: Response) => {
    const storeId = req.user!.storeId!;
    const parsed = storeSettingsSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    try {
        const data = parsed.data;

        // Use unchecked update? No, simple update is fine.
        const updated = await prisma.store.update({
            where: { id: storeId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.slug && { slug: data.slug }),
                ...(data.address && { address: data.address }),
                ...(data.receipt_header && { receipt_header: data.receipt_header }),
                ...(data.receipt_footer && { receipt_footer: data.receipt_footer }),
                ...(data.telegram_bot_token && { telegram_bot_token: data.telegram_bot_token }),
            }
        });

        // Activate Webhook if token provided
        if (data.telegram_bot_token) {
            const serverUrl = process.env.SERVER_URL || 'http://localhost:4000'; // Needs public URL for prod
            const webhookUrl = `${serverUrl}/api/telegram/webhook/${storeId}`;
            await setWebhook(data.telegram_bot_token, webhookUrl);
            console.log(`Webhook set for store ${storeId}: ${webhookUrl}`);
        }

        res.json(updated);
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Sozlamalarni saqlashda xatolik' });
    }
});


// Get Store Settings
router.get('/', requireRole(['OWNER', 'ADMIN', 'CASHIER']), async (req: AuthRequest, res: Response) => {
    const storeId = req.user!.storeId!;
    const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
            name: true, phone: true, slug: true,
            address: true, receipt_header: true, receipt_footer: true,
            telegram_bot_token: true, telegram_bot_username: true,
            subscription_ends_at: true, plan: true, is_active: true
        }
    });
    res.json(store);
});

export default router;

