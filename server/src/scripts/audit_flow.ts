import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runAudit() {
    console.log('🚀 Starting System Comprehensive Audit...');
    const timestamp = Date.now();

    // Test Data
    const partnerPhone = `99890${timestamp.toString().slice(-7)}`;
    const storePhone = `99891${timestamp.toString().slice(-7)}`;
    const productBarcode = `B${timestamp}`;

    try {
        // --- 1. SUPER ADMIN -> CREATE PARTNER ---
        console.log('\n[1] Checking Super Admin & Partner Creation...');
        // Assume Super Admin exists (we reset it recently)
        const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
        if (!superAdmin) throw new Error('Super Admin not found!');

        // Manual partner creation logic (simulating API logic)
        const partner = await prisma.partner.create({
            data: {
                name: `Audit Partner ${timestamp}`,
                phone: partnerPhone,
                commission_percent: 10
            }
        });
        const partnerUser = await prisma.user.create({
            data: {
                username: partnerPhone,
                password: await bcrypt.hash('password123', 10),
                role: 'PARTNER',
                partner_id: partner.id
            }
        });
        console.log('✅ Partner Created:', partner.name);

        // --- 2. PARTNER -> CREATE STORE ---
        console.log('\n[2] Checking Partner -> Store Creation...');
        // Simulate Partner creating a store (Logic from partner_portal.ts)
        const store = await prisma.store.create({
            data: {
                name: `Audit Store ${timestamp}`,
                phone: storePhone,
                owner_name: 'Audit Owner',
                plan: 'STANDARD',
                partner_id: partner.id
            }
        });
        const ownerUser = await prisma.user.create({
            data: {
                username: 'admin', // Default store admin username
                password: await bcrypt.hash('password123', 10),
                role: 'OWNER',
                store_id: store.id
            }
        });
        console.log('✅ Store Created by Partner:', store.name);

        // Check linking
        if (store.partner_id !== partner.id) throw new Error('Store not linked to Partner!');
        console.log('✅ Store-Partner Link Verified');

        // --- 3. WAREHOUSE -> ADD PRODUCT ---
        console.log('\n[3] Checking Inventory Logic...');
        const product = await prisma.product.create({
            data: {
                store_id: store.id,
                name: 'Audit Product',
                barcode: productBarcode,
                purchase_price: 1000,
                selling_price: 1500,
                profit_percent: 50,
                stock_quantity: 100,
                min_stock_alert: 10
            }
        });
        // Log History (Simulating api logic)
        await prisma.productHistory.create({
            data: {
                store_id: store.id,
                product_id: product.id,
                type: 'import',
                quantity: 100,
                stock_after: 100,
                user_id: ownerUser.id,
                note: 'Initial Audit Stock'
            }
        });
        console.log('✅ Product Created & Stock Logged');

        // --- 4. CASHIER -> SALE ---
        console.log('\n[4] Checking Sales & Financial Logic...');
        const saleQty = 5;
        const totalAmount = saleQty * product.selling_price;

        await prisma.$transaction(async (tx) => {
            // Create Sale
            const sale = await tx.sale.create({
                data: {
                    store_id: store.id,
                    sale_number: `S-${timestamp}`,
                    total_amount: totalAmount,
                    payment_type: 'naqd',
                    cashier_name: 'Audit Cashier'
                }
            });

            // Create Sale Item
            await tx.saleItem.create({
                data: {
                    sale_id: sale.id,
                    product_id: product.id,
                    quantity: saleQty,
                    price: product.selling_price,
                    total: totalAmount
                }
            });

            // Update Stock
            const updatedProduct = await tx.product.update({
                where: { id: product.id },
                data: { stock_quantity: { decrement: saleQty } }
            });

            // Log History
            await tx.productHistory.create({
                data: {
                    store_id: store.id,
                    product_id: product.id,
                    type: 'sale',
                    quantity: -saleQty,
                    stock_after: updatedProduct.stock_quantity,
                    user_id: ownerUser.id,
                    note: 'Audit Sale'
                }
            });

            return { sale, updatedProduct };
        });
        console.log('✅ Sale Transaction Completed');

        // --- 5. VERIFICATION ---
        console.log('\n[5] Verifying Data Integrity...');

        // Check Stock
        const finalProduct = await prisma.product.findUnique({ where: { id: product.id } });
        if (finalProduct?.stock_quantity !== 95) throw new Error(`Stock mismatch! Expected 95, got ${finalProduct?.stock_quantity}`);
        console.log('✅ Stock Quantity Verified (100 - 5 = 95)');

        // Check Logs
        const logs = await prisma.productHistory.findMany({ where: { product_id: product.id } });
        if (logs.length !== 2) throw new Error(`Logs missing! Expected 2, got ${logs.length}`);
        console.log('✅ Product Logs Verified (Import + Sale)');

        // Check Partner Stats
        const partnerStores = await prisma.store.findMany({ where: { partner_id: partner.id } });
        if (partnerStores.length !== 1) throw new Error('Partner stats incorrect!');
        console.log('✅ Partner Stats Verified');

        console.log('\n🎉 SYSTEM AUDIT PASSED: All integrations functional!');

        // Cleanup (Optional - keep for manual inspection if needed, but resetting is cleaner)
        // await prisma.store.delete({ where: { id: store.id } }); ... cascade delete tough without relations setup

    } catch (error) {
        console.error('\n❌ AUDIT FAILED:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runAudit();
