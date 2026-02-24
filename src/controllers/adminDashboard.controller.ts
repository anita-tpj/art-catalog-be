import type { Request, Response } from "express";
import { getAdminDashboardStats } from "../services/adminDashboard.service";

export async function getAdminDashboard(_req: Request, res: Response) {
  try {
    const stats = await getAdminDashboardStats();
    return res.status(200).json(stats);
  } catch (err) {
    console.error("getAdminDashboard error:", err);
    return res.status(500).json({ message: "Failed to load dashboard stats" });
  }
}
