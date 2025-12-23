/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning database...');

    // Order matters for relational integrity (delete children first)
    await prisma.debtPayment.deleteMany({});
    await prisma.debtSale.deleteMany({});
    await prisma.debt.deleteMany({});

    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});

    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});

    await prisma.bundleItem.deleteMany({});
    await prisma.bundle.deleteMany({});

    await prisma.promotionProduct.deleteMany({});
    await prisma.promotion.deleteMany({});

    await prisma.productHistory.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});

    await prisma.expense.deleteMany({});
    await prisma.customer.deleteMany({});

    // Delete all users except SUPER_ADMIN
    // Assuming Super Admin has role 'SUPER_ADMIN'
    const superAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (superAdmin) {
        console.log('Preserving Super Admin:', superAdmin.username);
        await prisma.user.deleteMany({
            where: {
                id: { not: superAdmin.id }
            }
        });
    } else {
        console.log('Super Admin not found. Deleting all users and creating default.');
        await prisma.user.deleteMany({});
    }

    await prisma.store.deleteMany({});
    await prisma.partner.deleteMany({});

    console.log('Database cleaned.');

    // If Super Admin was missing (or just to ensure password valid), recreate/ensure
    if (!superAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                role: 'SUPER_ADMIN'
            }
        });
        console.log('Default Super Admin created: admin / admin123');
    }

    console.log('Seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
