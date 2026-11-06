import { ERROR_CODES } from "../constants/errorCodes";
import prisma from "../prisma";
import { AppError } from "../utils/AppError";

export async function deactivateAdminUser(
  userId: string,
  currentAdminId: string,
) {
  if (userId === currentAdminId) {
    throw new AppError(
      ERROR_CODES.CANNOT_MODIFY_SELF,
      403,
      "You cannot modify your own account.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.adminUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(
        ERROR_CODES.ADMIN_USER_NOT_FOUND,
        404,
        "Admin user not found.",
      );
    }

    if (user.role === "ADMIN") {
      throw new AppError(
        ERROR_CODES.CANNOT_MODIFY_ADMIN,
        403,
        "You cannot modify another administrator account.",
      );
    }

    const updatedUser = await tx.adminUser.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await tx.adminSession.updateMany({
      where: {
        adminUserId: userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return updatedUser;
  });
}

export async function activateAdminUser(
  userId: string,
  currentAdminId: string,
) {
  if (userId === currentAdminId) {
    throw new AppError(
      ERROR_CODES.CANNOT_MODIFY_SELF,
      403,
      "You cannot modify your own account.",
    );
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(
      ERROR_CODES.ADMIN_USER_NOT_FOUND,
      404,
      "Admin user not found.",
    );
  }

  if (user.role === "ADMIN") {
    throw new AppError(
      ERROR_CODES.CANNOT_MODIFY_ADMIN,
      403,
      "You cannot modify another administrator account.",
    );
  }

  return prisma.adminUser.update({
    where: { id: userId },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
}

export async function deleteAdminUser(userId: string, currentAdminId: string) {
  if (userId === currentAdminId) {
    throw new AppError(
      ERROR_CODES.CANNOT_MODIFY_SELF,
      403,
      "You cannot modify your own account.",
    );
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(
      ERROR_CODES.ADMIN_USER_NOT_FOUND,
      404,
      "Admin user not found.",
    );
  }

  if (user.role === "ADMIN") {
    throw new AppError(
      ERROR_CODES.CANNOT_MODIFY_ADMIN,
      403,
      "You cannot modify another administrator account.",
    );
  }

  await prisma.adminUser.delete({
    where: { id: userId },
  });
}
