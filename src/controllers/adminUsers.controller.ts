
import type { Response } from "express";
import type { AdminRequest } from "../middlewares/requireAdmin";
import * as adminUsersService from "../services/adminUsers.service";

function handleError(error: unknown, res: Response) {
  if (error instanceof Error) {
    switch (error.message) {
      case "CANNOT_MODIFY_SELF":
        return res.status(403).json({
          message: "You cannot modify your own account.",
        });

      case "CANNOT_MODIFY_ADMIN":
        return res.status(403).json({
          message: "You cannot modify another administrator account.",
        });

      case "ADMIN_USER_NOT_FOUND":
        return res.status(404).json({
          message: "Admin user not found.",
        });
    }
  }

  console.error("Admin users error:", error);

  return res.status(500).json({
    message: "Internal server error",
  });
}

export async function deactivateAdminUser(
  req: AdminRequest,
  res: Response,
) {
  try {
    const userId = String(req.params.id);
    const currentAdminId = req.admin!.id;

    const user = await adminUsersService.deactivateAdminUser(
      userId,
      currentAdminId,
    );

    return res.json(user);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function activateAdminUser(
  req: AdminRequest,
  res: Response,
) {
  try {
    const userId = String(req.params.id);
    const currentAdminId = req.admin!.id;

    const user = await adminUsersService.activateAdminUser(
      userId,
      currentAdminId,
    );

    return res.json(user);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteAdminUser(
  req: AdminRequest,
  res: Response,
) {
  try {
    const userId = String(req.params.id);
    const currentAdminId = req.admin!.id;

    await adminUsersService.deleteAdminUser(userId, currentAdminId);

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
}
