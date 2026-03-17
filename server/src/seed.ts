import bcrypt from 'bcryptjs';
import prisma from './config/database';
import { logger } from './config/logger';
import { env } from './config/env';
import { adminRepository } from './repositories';
import { ratesService } from './services/rates.service';

async function seed() {
  logger.info('Seeding database...');

  const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await adminRepository.upsert({
    email: env.ADMIN_EMAIL,
    password: hashedPassword,
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
  });
  logger.info(`Admin synced: ${env.ADMIN_EMAIL}`);

  await ratesService.ensureBanksExist();

  logger.info('Seeding complete');
  await prisma.$disconnect();
  process.exit(0);
}

seed().catch(async (error) => {
  logger.error('Seed error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
