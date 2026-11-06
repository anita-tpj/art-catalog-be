import type { Request, Response } from "express";
import { getAdminDashboardStats } from "../services/adminDashboard.service";

export async function getAdminDashboard(_req: Request, res: Response) {
  const stats = await getAdminDashboardStats();

  return res.status(200).json(stats);
}
