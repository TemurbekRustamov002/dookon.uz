import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import salesRouter from './routes/sales.js';
import debtsRouter from './routes/debts.js';
import ordersRouter from './routes/orders.js';
import statsRouter from './routes/stats.js';
import promotionsRouter from './routes/promotions.js';
import bundlesRouter from './routes/bundles.js';
import customersRouter from './routes/customers.js';
import adminRouter from './routes/admin.js';
import usersRouter from './routes/users.js';

import authRouter from './routes/auth.js';
import { authenticate } from './middleware/auth.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

// Update CORS to support multiple local origins for development and credentials
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://dookon.uz',
  'https://www.dookon.uz',
  'https://admin.dookon.uz',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://192.168.')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.on('join_scanner_session', (sessionId) => {
    socket.join(sessionId);
  });

  socket.on('remote_scan', ({ sessionId, barcode }) => {
    io.to(sessionId).emit('barcode_scanned', barcode);
  });
});

const prisma = new PrismaClient();

// Security Middleware
app.use(helmet());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2000, // Relaxed heavily for development

  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);


app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://192.168.')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.get('/health', async (_req: Request, res: Response) => {
  const now = await prisma.$queryRaw`SELECT NOW()`;
  res.json({ status: 'ok', now });
});

// --- SEO & Bots ---
app.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const stores = await prisma.store.findMany({
      where: { is_active: true, slug: { not: null } },
      select: { slug: true, created_at: true }
    });

    const baseUrl = 'https://dookon.uz';
    const urls = [
      { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/login`, priority: '0.8', changefreq: 'monthly' }
    ];

    stores.forEach(store => {
      if (store.slug) {
        urls.push({
          loc: `${baseUrl}/shop/${store.slug}`,
          priority: '0.9',
          changefreq: 'weekly'
        });
      }
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (e) {
    console.error("Sitemap gen error", e);
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /checkout/

Sitemap: https://dookon.uz/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});
// -----------------

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

import shopRouter from './routes/shop.js';
app.use('/api/shop', shopRouter);

import telegramRouter from './routes/telegram.js';
import partnerPortalRouter from './routes/partner_portal.js';

app.use('/api/partner/portal', authenticate, partnerPortalRouter);
app.use('/api/telegram', telegramRouter);

// Protect all other API routes
app.use('/api', authenticate as any); // Cast to any to avoid strict type issues with express

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/debts', debtsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);
console.log('[mount] /api/promotions');
app.use('/api/promotions', promotionsRouter);
console.log('[mount] /api/bundles');
app.use('/api/bundles', bundlesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/users', usersRouter);

import settingsRouter from './routes/settings.js';
app.use('/api/settings', settingsRouter);

import expensesRouter from './routes/expenses.js';
app.use('/api/expenses', expensesRouter);

import logsRouter from './routes/logs.js';
app.use('/api/logs', logsRouter);

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[server error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const port = Number(process.env.PORT || 4000);
httpServer.listen(port, () => { // listen on all interfaces
  console.log(`Server running on http://0.0.0.0:${port}`);
});

// Global Process Error Handlers to prevent crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Ideally, restart process here via PM2 or Docker, but for now log it.
});
