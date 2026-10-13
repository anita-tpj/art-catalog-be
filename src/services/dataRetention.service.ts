
import prisma from "../prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

export async function runDataRetentionCleanup(dryRun = true) {
  const inquiryCutoff = daysAgo(365);
  const invitationCutoff = daysAgo(30);
  const sessionCutoff = daysAgo(30);

  const inquiryWhere = {
    updatedAt: { lt: inquiryCutoff },
  };

  const expiredInvitationWhere = {
    acceptedAt: null,
    expiresAt: { lt: invitationCutoff },
  };

  const acceptedInvitationWhere = {
    acceptedAt: { lt: invitationCutoff },
  };

  const sessionWhere = {
    OR: [
      { revokedAt: { lt: sessionCutoff } },
      { expiresAt: { lt: sessionCutoff } },
    ],
  };

  if (dryRun) {
    const [
      inquiries,
      expiredInvitations,
      acceptedInvitations,
      sessions,
    ] = await Promise.all([
      prisma.inquiry.count({ where: inquiryWhere }),
      prisma.adminInvitation.count({
        where: expiredInvitationWhere,
      }),
      prisma.adminInvitation.count({
        where: acceptedInvitationWhere,
      }),
      prisma.adminSession.count({ where: sessionWhere }),
    ]);

    return {
      dryRun: true,
      inquiries,
      expiredInvitations,
      acceptedInvitations,
      sessions,
    };
  }

  const [
    inquiries,
    expiredInvitations,
    acceptedInvitations,
    sessions,
  ] = await prisma.$transaction([
    prisma.inquiry.deleteMany({ where: inquiryWhere }),
    prisma.adminInvitation.deleteMany({
      where: expiredInvitationWhere,
    }),
    prisma.adminInvitation.deleteMany({
      where: acceptedInvitationWhere,
    }),
    prisma.adminSession.deleteMany({ where: sessionWhere }),
  ]);

  return {
    dryRun: false,
    inquiries: inquiries.count,
    expiredInvitations: expiredInvitations.count,
    acceptedInvitations: acceptedInvitations.count,
    sessions: sessions.count,
  };
}
