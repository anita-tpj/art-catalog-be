
import prisma from "../prisma";

export async function deactivateAdminUser(
  userId: string,
  currentAdminId: string,
) {
  if (userId === currentAdminId) {
    throw new Error("CANNOT_MODIFY_SELF");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.adminUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("ADMIN_USER_NOT_FOUND");
    }

    if (user.role === "ADMIN") {
      throw new Error("CANNOT_MODIFY_ADMIN");
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
    throw new Error("CANNOT_MODIFY_SELF");
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("ADMIN_USER_NOT_FOUND");
  }

  if (user.role === "ADMIN") {
    throw new Error("CANNOT_MODIFY_ADMIN");
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

export async function deleteAdminUser(
  userId: string,
  currentAdminId: string,
) {
  if (userId === currentAdminId) {
    throw new Error("CANNOT_MODIFY_SELF");
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("ADMIN_USER_NOT_FOUND");
  }

  if (user.role === "ADMIN") {
    throw new Error("CANNOT_MODIFY_ADMIN");
  }

  await prisma.adminUser.delete({
    where: { id: userId },
  });
}
