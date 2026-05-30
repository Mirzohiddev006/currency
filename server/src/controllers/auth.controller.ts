// ════════════════════════════════════════════════════════════
// AUTH CONTROLLER — Clean, thin controller layer
// ════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return res.json({ success: true, ...result });
}

export async function getMe(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const admin = await authService.getProfile(authReq.admin!.id);
  return res.json({ success: true, admin });
}
