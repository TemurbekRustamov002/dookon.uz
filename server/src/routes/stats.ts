import { Router, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  const { period = 'daily' } = req.query as { period?: string };
  const storeId = req.user!.storeId;

  if (!storeId) {
    return res.json({
      sales: 0,
      profit: 0,
      totalDebts: 0,
      lowStockCount: 0,
      oldStockCount: 0,
      pendingOrders: 0,
      totalProducts: 0,
      salesTrend: [],
      topProducts: []
    });
  }

  const now = new Date();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (period === 'weekly') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'monthly') {
    startDate.setMonth(now.getMonth() - 1);
  }
  // 'daily' remains today (00:00)

  const staleDate = new Date();
  staleDate.setDate(now.getDate() - 20);

  // For trend context: always show somewhat relevant history.
  // If daily: show last 7 days.
  // If weekly: show last 30 days.
  // If monthly: show last 3 months? Let's stick to last 30 days for weekly/monthly for now to keep charts readable.
  const trendStartDate = new Date();
  trendStartDate.setDate(now.getDate() - (period === 'daily' ? 7 : 30));
  trendStartDate.setHours(0, 0, 0, 0);

  const [
    sales,
    debtsActiveCount,
    lowStockCount,
    oldStockCount,
    pendingOrdersCount,
    totalProductsCount,
    trendSales,
    topSellingItems
  ] = await Promise.all([
    // Sales for the selected period
    prisma.sale.findMany({
      where: { store_id: storeId, created_at: { gte: startDate } },
      include: { sale_items: true }
    }),
    prisma.debt.aggregate({ _sum: { remaining_amount: true }, where: { store_id: storeId, status: 'active' } }),
    prisma.product.count({ where: { store_id: storeId, stock_quantity: { lte: 10 } } }),
    // Old stock: created_at < 20 days ago AND stock > 0
    prisma.product.count({
      where: {
        store_id: storeId,
        stock_quantity: { gt: 0 },
        created_at: { lt: staleDate }
      }
    }),
    prisma.order.count({ where: { store_id: storeId, status: 'pending' } }),
    prisma.product.count({ where: { store_id: storeId } }),
    // Trend data
    prisma.sale.findMany({
      where: { store_id: storeId, created_at: { gte: trendStartDate } },
      select: { created_at: true, total_amount: true }
    }),
    // Top selling items in the selected period
    prisma.saleItem.findMany({
      where: { sale: { store_id: storeId, created_at: { gte: startDate } } },
      include: { product: true }
    })
  ]);

  const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);

  // Compute profit
  let totalProfit = 0;
  for (const sale of sales) {
    for (const item of sale.sale_items) {
      const product = await prisma.product.findUnique({ where: { id: item.product_id } });
      if (product) {
        totalProfit += (item.price - product.purchase_price) * item.quantity;
      }
    }
  }

  // Compute Sales Trend
  const salesTrendMap: Record<string, number> = {};
  const daysToGraph = period === 'daily' ? 7 : 30;

  for (let i = 0; i < daysToGraph; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    salesTrendMap[dateStr] = 0;
  }

  trendSales.forEach(s => {
    const dateStr = s.created_at.toISOString().split('T')[0];
    if (salesTrendMap[dateStr] !== undefined) {
      salesTrendMap[dateStr] += s.total_amount;
    }
  });

  const salesTrend = Object.entries(salesTrendMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date, amount }));

  // Compute Top Products
  const productSalesMap: Record<string, { name: string, quantity: number }> = {};
  topSellingItems.forEach(item => {
    if (!productSalesMap[item.product_id]) {
      productSalesMap[item.product_id] = { name: item.product?.name || 'Unknown', quantity: 0 };
    }
    productSalesMap[item.product_id].quantity += item.quantity;
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  res.json({
    sales: totalSales,
    salesCount: sales.length, // Added transaction count
    profit: totalProfit,
    totalDebts: debtsActiveCount._sum.remaining_amount ?? 0,
    lowStockCount,
    oldStockCount,
    pendingOrders: pendingOrdersCount,
    totalProducts: totalProductsCount,
    salesTrend,
    topProducts
  });
});

export default router;
