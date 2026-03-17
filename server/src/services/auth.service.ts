// ════════════════════════════════════════════════════════════
// AUTH SERVICE — Authentication business logic
// ════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { adminRepository } from '../repositories';
import { UnauthorizedError, NotFoundError } from '../lib/errors';
import { JwtPayload } from '../types';

export class AuthService {
  async login(email: string, password: string) {
    const admin = await adminRepository.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedError("Email yoki parol noto'g'ri");
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Email yoki parol noto'g'ri");
    }

    const payload: JwtPayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async getProfile(adminId: string) {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new NotFoundError('Admin');
    }
    return admin;
  }
}

export const authService = new AuthService();
