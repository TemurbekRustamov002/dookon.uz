import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const storeId = "336e9962-6295-4d0d-a373-7f710c474610"; // Sadiyaxonim
    const products = await prisma.product.findMany({ where: { store_id: storeId } });
    console.log('Products:', JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
