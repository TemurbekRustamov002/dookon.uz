import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

const saleItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

const saleSchema = z.object({
  sale_number: z.string(),
  total_amount: z.number().nonnegative(),
  payment_type: z.enum(['naqd', 'karta', 'qarz']),
  cashier_name: z.string(),
  items: z.array(saleItemSchema),
  debt: z.object({
    customer_name: z.string(),
    customer_phone: z.string(),
  }).optional()
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = saleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const storeId = req.user!.storeId!;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          store_id: storeId,
          sale_number: parsed.data.sale_number,
          total_amount: parsed.data.total_amount,
          payment_type: parsed.data.payment_type, // Fixed enum value if needed?? No, schema is string. But prisma enum might be used? 
          // Schema says String for payment_type, so we are good.
          cashier_name: parsed.data.cashier_name,
        }
      });

      // 2. Process Items
      for (const item of parsed.data.items) {
        // Validate product ownership and stock
        const product = await tx.product.findFirst({
          where: { id: item.product_id, store_id: storeId }
        });

        if (!product) throw new Error(`Product not found or not in store: ${item.product_id}`);

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
        }

        // Create SaleItem
        await tx.saleItem.create({ data: { ...item, sale_id: sale.id } });

        // Update Stock (Atomic Decrement)
        const updatedProduct = await tx.product.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.quantity } },
        });

        // Log History
        await tx.productHistory.create({
          data: {
            store_id: storeId,
            product_id: item.product_id,
            user_id: req.user!.userId,
            type: 'sale',
            quantity: -item.quantity,
            stock_after: updatedProduct.stock_quantity,
            note: `Sotuv: #${sale.sale_number}`
          }
        });
      }

      // 3. Process Debt
      if (parsed.data.payment_type === 'qarz' && parsed.data.debt) {
        // Upsert Customer (Scoped to store)
        // Unique constraint is [store_id, phone]
        const customer = await tx.customer.upsert({
          where: {
            store_id_phone: {
              store_id: storeId,
              phone: parsed.data.debt.customer_phone
            }
          },
          update: { name: parsed.data.debt.customer_name },
          create: {
            store_id: storeId,
            phone: parsed.data.debt.customer_phone,
            name: parsed.data.debt.customer_name
          },
        });

        // Find active debt for this customer in this store
        let debt = await tx.debt.findFirst({
          where: {
            store_id: storeId,
            customer_id: customer.id, // Better to rely on ID relation
            status: 'active'
          },
        });

        if (debt) {
          // Update existing debt
          debt = await tx.debt.update({
            where: { id: debt.id },
            data: {
              total_amount: { increment: parsed.data.total_amount },
              remaining_amount: { increment: parsed.data.total_amount },
            }
          });
        } else {
          // Create new debt
          debt = await tx.debt.create({
            data: {
              store_id: storeId,
              customer_name: parsed.data.debt.customer_name,
              customer_phone: parsed.data.debt.customer_phone,
              customer_id: customer.id,
              total_amount: parsed.data.total_amount,
              paid_amount: 0,
              remaining_amount: parsed.data.total_amount,
              status: 'active',
            }
          });
        }

        // Link
        await tx.debtSale.create({ data: { debt_id: debt.id, sale_id: sale.id } });
      }

      return sale;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Sale creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
