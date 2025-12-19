import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Middleware to resolve store by slug
const resolveStore = async (req: Request, res: Response, next: any) => {
    const { slug } = req.params;

    if (!slug) return res.status(400).json({ error: 'Store slug required' });

    try {
        const store = await prisma.store.findFirst({
            where: { slug: slug, is_active: true }
        });

        if (!store) {
            return res.status(404).json({ error: 'Do\'kon topilmadi yoki faol emas', code: 'STORE_NOT_FOUND' });
        }

        (req as any).store = store;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Public Endpoints ---

// 1. Get Store Info
router.get('/:slug', resolveStore, async (req: Request, res: Response) => {
    const store = (req as any).store;
    res.json({
        id: store.id,
        name: store.name,
        phone: store.phone,
        slug: store.slug,
        telegram_bot_username: store.telegram_bot_username
    });
});

// 2. Get Products
router.get('/:slug/products', resolveStore, async (req: Request, res: Response) => {
    const store = (req as any).store;
    const { category_id, search } = req.query;

    const where: any = {
        store_id: store.id,
        active: true,
        stock_quantity: { gt: 0 } // Only in-stock
    };

    if (category_id) {
        where.category_id = String(category_id);
    }

    if (search) {
        where.OR = [
            { name: { contains: String(search), mode: 'insensitive' } }
        ];
    }

    const products = await prisma.product.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: { category: true }
    });

    res.json(products);
});

// 3. Get Categories
router.get('/:slug/categories', resolveStore, async (req: Request, res: Response) => {
    const store = (req as any).store;
    const categories = await prisma.category.findMany({
        where: { store_id: store.id },
        orderBy: { name: 'asc' }
    });
    res.json(categories);
});

// 4. Get Promotions
router.get('/:slug/promotions', resolveStore, async (req: Request, res: Response) => {
    const store = (req as any).store;
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
        where: {
            store_id: store.id,
            active: true,
            OR: [
                { end_at: null },
                { end_at: { gt: now } }
            ]
        },
        include: { products: true }
    });
    res.json(promotions);
});

// 5. Get Bundles
router.get('/:slug/bundles', resolveStore, async (req: Request, res: Response) => {
    const store = (req as any).store;
    const bundles = await prisma.bundle.findMany({
        where: {
            store_id: store.id,
            active: true
        },
        include: { items: true }
    });
    res.json(bundles);
});

// 4. Place Order (Simple version)
const orderItemSchema = z.object({
    product_id: z.string(),
    quantity: z.number().min(1),
});

const telegramOrderSchema = z.object({
    customer: z.object({
        name: z.string(),
        phone: z.string(),
        address: z.string().optional(),
        telegram_id: z.number().optional()
    }),
    items: z.array(orderItemSchema),
    notes: z.string().optional()
});

router.post('/:slug/orders', resolveStore, async (req: Request, res: Response) => {
    const store = (req as any).store;
    const parsed = telegramOrderSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    try {
        const { customer: customerData, items, notes } = parsed.data;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Calculate totals and verify stock
            let totalAmount = 0;
            const orderItemsData = [];

            for (const item of items) {
                const product = await tx.product.findFirst({
                    where: { id: item.product_id, store_id: store.id }
                });

                if (!product || !product.active) {
                    throw new Error(`Mahsulot topilmadi: ${item.product_id}`);
                }
                if (product.stock_quantity < item.quantity) {
                    throw new Error(`Omborda yetarli emas: ${product.name}`);
                }

                const lineTotal = product.selling_price * item.quantity;
                totalAmount += lineTotal;

                orderItemsData.push({
                    product_id: product.id,
                    quantity: item.quantity,
                    price: product.selling_price,
                    total: lineTotal
                });
            }

            // 2. Find or Create Customer
            // For Telegram users, we might want to store telegram_id potentially
            const customer = await tx.customer.upsert({
                where: {
                    store_id_phone: {
                        store_id: store.id,
                        phone: customerData.phone
                    }
                },
                update: { name: customerData.name },
                create: {
                    store_id: store.id,
                    name: customerData.name,
                    phone: customerData.phone
                }
            });

            // 3. Create Order
            const order = await tx.order.create({
                data: {
                    store_id: store.id,
                    customer_id: customer.id,
                    customer_name: customerData.name,
                    customer_phone: customerData.phone,
                    customer_address: customerData.address,
                    total_amount: totalAmount,
                    status: 'pending', // Default for telegram orders
                    notes: notes ? `[Telegram] ${notes}` : '[Telegram Web App]',
                    order_items: {
                        create: orderItemsData
                    }
                }
            });

            return order;
        });

        res.status(201).json(result);

    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Buyurtma yaratishda xatolik' });
    }
});

export default router;
