import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        storeId: string | null;
        role: string;
        username: string;
        plan?: 'STANDARD' | 'PREMIUM';
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Authorization token missing' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;


        // Special handling for Super Admin
        if (decoded.role === 'SUPER_ADMIN') {
            req.user = {
                userId: decoded.userId,
                storeId: null,
                role: 'SUPER_ADMIN',
                username: decoded.username
            };
            return next();
        }

        // Special handling for Partner
        if (decoded.role === 'PARTNER') {
            req.user = {
                userId: decoded.userId,
                storeId: null,
                role: 'PARTNER',
                username: decoded.username
            };
            return next();
        }

        // Regular Store Users
        if (!decoded.storeId) {
            return res.status(401).json({ error: 'Invalid token structure' });
        }

        // Check if store active
        const store = await prisma.store.findUnique({ where: { id: decoded.storeId } });
        if (!store) return res.status(403).json({ error: 'Store not found' });

        if (!store.is_active) {
            return res.status(403).json({ error: 'Do\'kon faoliyati to\'xtatilgan (Inactive)' });
        }

        if (store.subscription_ends_at && new Date() > store.subscription_ends_at) {
            return res.status(403).json({ error: 'Obuna muddati tugagan. Iltimos to\'lov qiling.' });
        }

        req.user = {
            userId: decoded.userId,
            storeId: decoded.storeId,
            role: decoded.role,
            username: decoded.username,
            plan: store.plan
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const requirePremium = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'SUPER_ADMIN') return next(); // Super admin bypass? Or not needed.
    if (req.user?.plan !== 'PREMIUM') {
        return res.status(403).json({ error: 'Ushbu funksiya faqat Premium tarifda mavjud' });
    }
    next();
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN')) {
            return res.status(403).json({ error: 'Ruxsat yo\'q' });
        }
        next();
    };
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
