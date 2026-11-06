import type { Response } from "express";
import type { AdminRequest } from "../middlewares/requireAdmin";
import * as adminUsersService from "../services/adminUsers.service";

export async function deactivateAdminUser(req: AdminRequest, res: Response) {
  const userId = String(req.params.id);
  const currentAdminId = req.admin!.id;

  const user = await adminUsersService.deactivateAdminUser(
    userId,
    currentAdminId,
  );

  return res.json(user);
}

export async function activateAdminUser(req: AdminRequest, res: Response) {
  const userId = String(req.params.id);
  const currentAdminId = req.admin!.id;

  const user = await adminUsersService.activateAdminUser(
    userId,
    currentAdminId,
  );

  return res.json(user);
}

export async function deleteAdminUser(req: AdminRequest, res: Response) {
  const userId = String(req.params.id);
  const currentAdminId = req.admin!.id;

  await adminUsersService.deleteAdminUser(userId, currentAdminId);

  return res.status(204).send();
}
