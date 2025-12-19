import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/response.js';

const prisma = new PrismaClient();

export class AdminService {
    /**
     * Tizimning umumiy statistikasini olish
     * SaaS Growth Metricslari: MRR (Monthly Recurring Revenue), Churn Rate, Active Stores
     */
    async getGlobalStats() {
        const [totalStores, totalPartners, storePlans, activeStores] = await Promise.all([
            prisma.store.count(),
            prisma.partner.count(),
            prisma.store.groupBy({
                by: ['plan'],
                _count: { plan: true }
            }),
            prisma.store.count({ where: { is_active: true } })
        ]);

        // Calculate simulated MRR (Monthly Recurring Revenue) based on plans
        // STANDARD: $10 (approx 120,000 UZS), PREMIUM: $20 (approx 250,000 UZS) - Example values
        const standardCount = storePlans.find(p => p.plan === 'STANDARD')?._count.plan || 0;
        const premiumCount = storePlans.find(p => p.plan === 'PREMIUM')?._count.plan || 0;

        // SaaS Metrics
        const mrr = (standardCount * 120000) + (premiumCount * 250000);
        const activeRate = totalStores > 0 ? (activeStores / totalStores) * 100 : 0;

        return {
            totalStores,
            totalPartners,
            activeStores,
            mrr,
            activeRate: activeRate.toFixed(1),
            breakdown: storePlans
        };
    }

    /**
     * Hamkor yaratish va unga User akkaunt ochish
     * Transaction orqali ma'lumotlar butunligini ta'minlash
     */
    async createPartner(data: { name: string; phone: string; password: string; commission_percent: number }) {
        const { name, phone, password, commission_percent } = data;

        const existingUser = await prisma.user.findFirst({ where: { username: phone } });
        if (existingUser) {
            throw new AppError('Bu telefon raqam allaqachon band', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to ensure atomic creation
        return await prisma.$transaction(async (tx) => {
            const partner = await tx.partner.create({
                data: {
                    name,
                    phone,
                    commission_percent: commission_percent || 0
                }
            });

            const user = await tx.user.create({
                data: {
                    username: phone,
                    password: hashedPassword,
                    role: 'PARTNER',
                    partner_id: partner.id,
                    store_id: null
                }
            });

            return { partner, user };
        });
    }

    /**
     * Barcha hamkorlar ro'yxatini olish (KPI lari bilan)
     */
    async getPartners() {
        return await prisma.partner.findMany({
            include: {
                _count: { select: { stores: true } }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    /**
     * Do'kon ma'lumotlarini yangilash (Admin tomonidan)
     * Audit log yozish mumkin (kelajakda)
     */
    async updateStore(id: string, data: any) {
        // Validate if store exists
        const store = await prisma.store.findUnique({ where: { id } });
        if (!store) throw new AppError('Do\'kon topilmadi', 404);

        return await prisma.store.update({
            where: { id },
            data: {
                ...data,
                subscription_ends_at: data.subscription_ends_at ? new Date(data.subscription_ends_at) : undefined
            }
        });
    }

    /**
     * Hamkor ma'lumotlarini yangilash
     */
    async updatePartner(id: string, data: { name?: string; phone?: string; commission_percent?: number; password?: string }) {
        const { name, phone, commission_percent, password } = data;

        const partner = await prisma.partner.findUnique({ where: { id } });
        if (!partner) throw new AppError('Hamkor topilmadi', 404);

        // Transaction updates both Partner and User (if phone/password changes)
        return await prisma.$transaction(async (tx) => {
            const updatedPartner = await tx.partner.update({
                where: { id },
                data: {
                    name,
                    phone,
                    commission_percent
                }
            });

            if (phone || password) {
                const userUpdateData: any = {};
                if (phone) userUpdateData.username = phone;
                if (password) userUpdateData.password = await bcrypt.hash(password, 10);

                // Find user associated with this partner
                const user = await tx.user.findFirst({ where: { partner_id: id } });
                if (user) {
                    await tx.user.update({
                        where: { id: user.id },
                        data: userUpdateData
                    });
                }
            }

            return updatedPartner;
        });
    }

    /**
     * Hamkorni o'chirish (Soft delete or Hard delete logic depend on business rule, here Hard delete is implemented with checks)
     * Agar hamkorda do'konlar bo'lsa o'chirish mumkin emas.
     */
    async deletePartner(id: string) {
        const partner = await prisma.partner.findUnique({
            where: { id },
            include: { _count: { select: { stores: true } } }
        });

        if (!partner) throw new AppError('Hamkor topilmadi', 404);
        if (partner._count.stores > 0) throw new AppError('Hamkorda biriktirilgan do\'konlar mavjud. Avval ularni boshqa hamkorga o\'tkazing yoki o\'chiring.', 400);

        return await prisma.$transaction(async (tx) => {
            // Delete associated user first
            await tx.user.deleteMany({ where: { partner_id: id } });
            // Delete partner
            return await tx.partner.delete({ where: { id } });
        });
    }
}
