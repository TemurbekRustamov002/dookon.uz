import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService.js';

const adminService = new AdminService();

export class AdminController {

    getStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await adminService.getGlobalStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    };

    createPartner = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body.name || !req.body.phone || !req.body.password) {
                return res.status(400).json({ error: 'Barcha maydonlar majburiy' });
            }
            await adminService.createPartner(req.body);
            res.status(201).json({ message: 'Hamkor muvaffaqiyatli yaratildi' });
        } catch (error) {
            next(error);
        }
    };

    getPartners = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const partners = await adminService.getPartners();
            res.json(partners);
        } catch (error) {
            next(error);
        }
    };

    updateStore = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updated = await adminService.updateStore(req.params.id, req.body);
            res.json(updated);
        } catch (error) {
            next(error);
        }
    };

    updatePartner = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updated = await adminService.updatePartner(req.params.id, req.body);
            res.json(updated);
        } catch (error) {
            next(error);
        }
    };

    deletePartner = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await adminService.deletePartner(req.params.id);
            res.json({ message: 'Hamkor o\'chirildi' });
        } catch (error) {
            next(error);
        }
    };
}
