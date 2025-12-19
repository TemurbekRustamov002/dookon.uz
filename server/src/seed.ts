import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Default Store
  const storePhone = '991234567';
  let store = await prisma.store.findUnique({ where: { phone: storePhone } });

  if (!store) {
    console.log('Creating default store...');
    store = await prisma.store.create({
      data: {
        name: 'Demo Do\'kon',
        phone: storePhone,
        plan: 'PREMIUM',
        is_active: true,
      }
    });
  }

  // 2. Create Default Admin User
  const adminUsername = 'admin';
  const existingUser = await prisma.user.findFirst({
    where: { store_id: store.id, username: adminUsername }
  });

  if (!existingUser) {
    console.log('Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin', 10);
    await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        role: 'ADMIN',
        store_id: store.id
      }
    });
  }

  // 3. Upsert categories for this store
  const cats = ['Ichimliklar', 'Shirinliklar', 'Nonushta'];
  const categories = [] as any[];
  for (const name of cats) {
    const existing = await prisma.category.findFirst({
      where: { store_id: store.id, name }
    });
    const c = existing ?? await prisma.category.create({
      data: { name, store_id: store.id }
    });
    categories.push(c);
  }

  // 4. Create some products if none exists for this store
  const count = await prisma.product.count({ where: { store_id: store.id } });
  if (count === 0) {
    const [c1, c2] = categories;
    await prisma.product.createMany({
      data: [
        { name: 'Coca Cola 1L', barcode: '5901234123457', category_id: c1.id, purchase_price: 6000, profit_percent: 25, selling_price: 7500, discount_percent: 0, stock_quantity: 50, min_stock_alert: 10, store_id: store.id },
        { name: 'Pepsi 1L', barcode: '5901234123458', category_id: c1.id, purchase_price: 5500, profit_percent: 27, selling_price: 6990, discount_percent: 10, stock_quantity: 40, min_stock_alert: 10, store_id: store.id },
        { name: 'KitKat', barcode: '5901234123459', category_id: c2.id, purchase_price: 4000, profit_percent: 30, selling_price: 5200, discount_percent: 0, stock_quantity: 30, min_stock_alert: 5, store_id: store.id },
      ]
    });
  }

  // 5. Create a demo promotion if none exists
  const promoCount = await prisma.promotion.count({ where: { store_id: store.id } });
  if (promoCount === 0) {
    const anyProduct = await prisma.product.findFirst({ where: { store_id: store.id } });
    if (anyProduct) {
      const promo = await prisma.promotion.create({
        data: {
          name: 'Demo Aksiya',
          discount_type: 'percent',
          discount_value: 15,
          active: true,
          store_id: store.id
        }
      });
      await prisma.promotionProduct.create({
        data: { promotion_id: promo.id, product_id: anyProduct.id }
      });
    }
  }

  console.log('Seed completed properly.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
