// ════════════════════════════════════════════════════════════
// ADMIN CONTROLLER — Thin controllers for admin endpoints
// ════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';

export async function getUsers(req: Request, res: Response) {
  const { page, limit } = req.query as any;
  const { users, total } = await adminService.getUsers(page, limit);

  return res.json({
    success: true,
    data: users,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

export async function getBanks(_req: Request, res: Response) {
  const banks = await adminService.getBanks();
  return res.json({ success: true, data: banks });
}

export async function toggleBank(req: Request, res: Response) {
  const { id } = req.params;
  const updated = await adminService.toggleBank(id);
  return res.json({ success: true, data: updated });
}

export async function getScrapeLogs(req: Request, res: Response) {
  const limit = (req.query as any).limit || 50;
  const logs = await adminService.getScrapeLogs(limit);
  return res.json({ success: true, data: logs });
}

export async function getAnalytics(req: Request, res: Response) {
  const days = (req.query as any).days || 7;
  const data = await adminService.getAnalytics(days);
  return res.json({ success: true, data });
}
