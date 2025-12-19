import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const slug = "Sadiyaxonim";
    const store = await prisma.store.findFirst({ where: { slug } });
    if (!store) {
        console.log('Store not found');
        return;
    }

    const promos = await prisma.promotion.findMany({ where: { store_id: store.id } });
    const bundles = await prisma.bundle.findMany({ where: { store_id: store.id } });

    console.log('Promotions:', JSON.stringify(promos, null, 2));
    console.log('Bundles:', JSON.stringify(bundles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
