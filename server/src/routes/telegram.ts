import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendMessage } from '../lib/telegram.js';

const prisma = new PrismaClient();
const router = Router();

router.post('/webhook/:storeId', async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const update = req.body;

    // Telegram always sends success even if we fail, to avoid retries
    res.status(200).send('OK');

    try {
        const store = await prisma.store.findUnique({ where: { id: storeId } }) as any;
        if (!store || !store.telegram_bot_token || !store.slug) return;

        if (update.message && update.message.text === '/start') {
            const chatId = update.message.chat.id;
            // LOKALDA TEST QILISH: ngrok ishlatayotgan bo'lsangiz, .env dagi FRONTEND_URL ni ngrok HTTPS manzili bilan almashtiring.
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const shopUrl = `${frontendUrl}/shop/${store.slug}`;

            await sendMessage(store.telegram_bot_token, chatId, `Assalomu alaykum! "${store.name}" do'konimizga xush kelibsiz.`, {
                inline_keyboard: [
                    [
                        {
                            text: "🛍 Do'konni ochish",
                            web_app: { url: shopUrl }
                        }
                    ]
                ]
            });
        }
    } catch (error) {
        console.error('[telegram webhook error]', error);
    }
});

export default router;
