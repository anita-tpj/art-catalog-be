import prisma from "../prisma";

export type AdminDashboardStats = {
  artworksCount: number;
  artistsCount: number;

  inquiriesNewCount: number;
  inquiriesAllCount: number;

  lastInquiryAt: string | null;

  lastArtworks: {
    id: number;
    title: string;
    createdAt: string;
    imageUrl: string | null;
    artistName: string;
  }[];

  lastArtists: {
    id: number;
    name: string;
    createdAt: string;
    avatarUrl: string | null;
  }[];

  latestNewInquiries: {
    id: number;
    name: string;
    createdAt: string;
    regarding: string;
    status: string;
  }[];
};

type GroupByStatusRow = {
  status: string;
  _count: { _all: number };
};

function buildRegarding(i: {
  artwork?: { title: string } | null;
  artist?: { name: string } | null;
  artworkId?: number | null;
  artistId?: number | null;
}) {
  if (i.artwork?.title) return `Artwork: ${i.artwork.title}`;
  if (i.artist?.name) return `Artist: ${i.artist.name}`;
  if (i.artworkId) return `Artwork ID: ${i.artworkId}`;
  if (i.artistId) return `Artist ID: ${i.artistId}`;
  return "—";
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    artworksCount,
    artistsCount,
    grouped,
    lastInquiry,
    lastArtworks,
    lastArtists,
    latestNewInquiries,
  ] = await Promise.all([
    prisma.artwork.count(),
    prisma.artist.count(),
    prisma.inquiry.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.inquiry.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),

    // last 3 artworks
    prisma.artwork.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        createdAt: true,
        imageUrl: true,
        artist: { select: { name: true } },
      },
    }),

    // last 3 artists
    prisma.artist.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        name: true,
        createdAt: true,
        avatarUrl: true,
      },
    }),

    // last 3 NEW inquiries
    prisma.inquiry.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        artworkId: true,
        artistId: true,
        artwork: { select: { title: true } },
        artist: { select: { name: true } },
      },
    }),
  ]);

  const rows = grouped as unknown as GroupByStatusRow[];
  const byStatus: Record<string, number> = {};
  for (const r of rows) byStatus[r.status] = r._count._all;

  const inquiriesNewCount = byStatus["NEW"] ?? 0;
  const inquiriesAllCount = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return {
    artworksCount,
    artistsCount,
    inquiriesNewCount,
    inquiriesAllCount,
    lastInquiryAt: lastInquiry?.createdAt
      ? lastInquiry.createdAt.toISOString()
      : null,

    lastArtworks: lastArtworks.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt.toISOString(),
      imageUrl: a.imageUrl ?? null,
      artistName: a.artist.name,
    })),

    lastArtists: lastArtists.map((a) => ({
      id: a.id,
      name: a.name,
      createdAt: a.createdAt.toISOString(),
      avatarUrl: a.avatarUrl ?? null,
    })),

    latestNewInquiries: latestNewInquiries.map((i) => ({
      id: i.id,
      name: i.name,
      status: i.status,
      createdAt: i.createdAt.toISOString(),
      regarding: buildRegarding(i),
    })),
  };
}
