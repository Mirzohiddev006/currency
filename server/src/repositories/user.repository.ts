// ════════════════════════════════════════════════════════════
// USER REPOSITORY — Database access layer for Telegram users
// ════════════════════════════════════════════════════════════

import prisma from '../config/database';
import { startOfDay, daysAgo } from '../lib/date';

export class UserRepository {
  async getTotalCount() {
    return prisma.telegramUser.count();
  }

  async getActiveCount() {
    return prisma.telegramUser.count({ where: { isActive: true } });
  }

  async getNewTodayCount() {
    return prisma.telegramUser.count({
      where: { subscribedAt: { gte: startOfDay() } },
    });
  }

  async getTodayRequestCount() {
    return prisma.userRequest.count({
      where: { createdAt: { gte: startOfDay() } },
    });
  }

  async getPaginatedUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.telegramUser.findMany({
        skip,
        take: limit,
        orderBy: { subscribedAt: 'desc' },
        include: { _count: { select: { requests: true } } },
      }),
      prisma.telegramUser.count(),
    ]);

    return { users, total };
  }

  async getActiveUsers() {
    return prisma.telegramUser.findMany({ where: { isActive: true } });
  }

  async upsertByTelegramId(data: {
    telegramId: bigint;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    return prisma.telegramUser.upsert({
      where: { telegramId: data.telegramId },
      update: { lastActiveAt: new Date(), isActive: true },
      create: data,
    });
  }

  async setPhone(telegramId: bigint, phone: string) {
    return prisma.telegramUser.update({
      where: { telegramId },
      data: { phone, lastActiveAt: new Date(), isActive: true },
    });
  }

  async findByTelegramId(telegramId: bigint) {
    return prisma.telegramUser.findUnique({ where: { telegramId } });
  }

  async deactivateUser(id: string) {
    return prisma.telegramUser.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async logRequest(userId: string, command: string) {
    return prisma.userRequest.create({ data: { userId, command } });
  }

  async getRequestsSince(since: Date) {
    return prisma.userRequest.findMany({
      where: { createdAt: { gte: since } },
      select: { command: true, createdAt: true },
    });
  }

  async getNewUsersSince(since: Date) {
    return prisma.telegramUser.findMany({
      where: { subscribedAt: { gte: since } },
      select: { subscribedAt: true },
    });
  }
}

export const userRepository = new UserRepository();
