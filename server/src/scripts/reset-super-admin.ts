import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetSuperAdmin() {
    const username = 'temur';
    const password = '66068926Aa';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Delete existing super admin if exists (optional cleanup)
        // await prisma.user.deleteMany({ where: { role: 'SUPER_ADMIN' } });

        const existing = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' } // Find ANY super admin to update, or create specific
        });

        if (existing) {
            console.log('Updating existing Super Admin...');
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    username: username,
                    password: hashedPassword
                }
            });
        } else {
            console.log('Creating new Super Admin...');
            await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    role: 'SUPER_ADMIN',
                    store_id: null
                }
            });
        }

        console.log('Super Admin credentials updated:');
        console.log('Username:', username);
        console.log('Password:', password);

    } catch (error) {
        console.error('Error resetting Super Admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetSuperAdmin();
