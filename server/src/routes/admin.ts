import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { AdminController } from '../controllers/AdminController.js';

const router = Router();
const prisma = new PrismaClient();
const adminController = new AdminController();

// --- Setup (Legacy / Dev) ---
router.post('/setup', async (req, res) => {
    const { username, password, secret } = req.body;

    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ error: 'Invalid secret' });
    }

    try {
        const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
        if (existing) {
            return res.status(400).json({ error: 'Super Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                store_id: null
            }
        });

        res.json({ message: 'Super Admin created', userId: user.id });
    } catch (e) {
        res.status(500).json({ error: 'Setup failed', details: e });
    }
});

// --- Protected Routes (Architecture Layered) ---
router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/stats', adminController.getStats);
router.get('/partners', adminController.getPartners);
router.post('/partners', adminController.createPartner);
router.put('/partners/:id', adminController.updatePartner);
router.delete('/partners/:id', adminController.deletePartner);

// Stores (Partially migrated, keep explicit route for now or move to controller entirely)
// I will move updateStore to controller, but getStores logic is simple enough to be in controller too.
// Let's create getStores in controller.
import { setWebhook } from '../lib/telegram.js';

// Old logic for getStores kept in controller? No, I need to add it to Service/Controller.
// I will keep getStores inline for a moment or update Controller to include it.
// Actually, let's keep it clean. I will update AdminService/Controller to include getStores.

// router.get('/stores', ... ) -> adminController.getStores (Need to implement)

// For now, let's keep the existing Stores logic inline until next step to avoid breaking too much at once.
router.get('/stores', async (req, res) => {
    try {
        const stores = await prisma.store.findMany({
            include: {
                partner: { select: { name: true, phone: true } },
                _count: { select: { orders: true, products: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(stores);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});

// Update Store (uses Controller for update logic, but webhook handling is specific)
// I will keep the webhook logic here or move it to service. Ideally service.
// Let's look at the controller updateStore implementation. It does updates but not webhook.
// I will re-implement the webhook logic in the Service layer next turn.
// For now, keep the old update route to ensure webhooks work.
router.put('/stores/:id', async (req, res) => {
    const { id } = req.params;
    const { plan, is_active, subscription_ends_at, slug, telegram_bot_token, telegram_bot_username } = req.body;

    try {
        const updated = await prisma.store.update({
            where: { id },
            data: {
                ...(plan && { plan }),
                ...(is_active !== undefined && { is_active }),
                ...(subscription_ends_at !== undefined && { subscription_ends_at: subscription_ends_at ? new Date(subscription_ends_at) : null }),
                ...(slug !== undefined && { slug }),
                ...(telegram_bot_token !== undefined && { telegram_bot_token }),
                ...(telegram_bot_username !== undefined && { telegram_bot_username })
            }
        });

        if (telegram_bot_token) {
            const serverUrl = process.env.SERVER_URL || 'http://localhost:4000';
            const webhookUrl = `${serverUrl}/api/telegram/webhook/${id}`;
            await setWebhook(telegram_bot_token, webhookUrl).catch(e => console.error('Failed to set webhook:', e));
        }

        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
});

export default router;
