// ════════════════════════════════════════════════════════════
// ADMIN REPOSITORY — Database access layer for admin users
// ════════════════════════════════════════════════════════════

import prisma from '../config/database';

export class AdminRepository {
  async findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.admin.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  async upsert(data: {
    email: string;
    password: string;
    name: string;
    role: 'SUPER_ADMIN' | 'ADMIN';
  }) {
    return prisma.admin.upsert({
      where: { email: data.email },
      update: {
        password: data.password,
        name: data.name,
        role: data.role,
      },
      create: data,
    });
  }
}

export const adminRepository = new AdminRepository();
