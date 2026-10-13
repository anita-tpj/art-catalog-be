import { Request, Response } from "express";
import { ArtistListQuerySchema, createArtistSchema, updateArtistSchema } from "../dtos/artist.dto";
import { AdminRequest } from "../middlewares/requireAdmin";
import * as artistService from "../services/artist.service";

export async function getAllArtists(req: AdminRequest, res: Response) {
  const artists = await artistService.getAllArtists({
    artistId: req.admin!.artistId,
  });

  res.json(artists);
}

export async function getFeaturedArtists(req: Request, res: Response) {
  const artists = await artistService.getFeaturedArtists();
  res.json(artists);
}

export async function getPaginatedArtists(req: AdminRequest, res: Response) {
  const query = ArtistListQuerySchema.parse(req.query);

  const { items, total } = await artistService.getPaginatedArtists(query, {
    artistId: req.admin!.artistId,
  });

  res.json({
    items,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  });
}

export async function getAllPublishedArtists(req: Request, res: Response) {
  const artists = await artistService.getPublishedArtists();
  res.json(artists);
}

export async function getPaginatedPublishedArtists(
  req: Request,
  res: Response,
) {
  const query = ArtistListQuerySchema.parse(req.query);

  const { items, total } =
    await artistService.getPaginatedPublishedArtists(query);

  res.json({
    items,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  });
}

export async function getPublishedArtist(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid artist id");
    error.statusCode = 400;
    throw error;
  }

  const artist = await artistService.getPublishedArtistById(id);

  if (!artist) {
    const error: any = new Error("Artist not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(artist);
}

export async function getPublishedArtistBySlug(req: Request, res: Response) {
  const slug = req.params.slug;

  if (!slug) {
    const error: any = new Error("Invalid artist slug");
    error.statusCode = 400;
    throw error;
  }

  const artist = await artistService.getPublishedArtistBySlug(slug);

  if (!artist) {
    const error: any = new Error("Artist not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(artist);
}

export async function getArtist(req: AdminRequest, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid artist id");
    error.statusCode = 400;
    throw error;
  }

  const artist = await artistService.getArtistById(id, {
    artistId: req.admin!.artistId,
  });

  if (!artist) {
    const error: any = new Error("Artist not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(artist);
}

export async function createArtist(req: AdminRequest, res: Response) {
  const payload = createArtistSchema.parse(req.body);

  const artist = await artistService.createArtist(payload, {
    artistId: req.admin!.artistId,
    role: req.admin!.role,
  });

  res.status(201).json(artist);
}

export async function updateArtist(req: AdminRequest, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid artist id");
    error.statusCode = 400;
    throw error;
  }

  const payload = updateArtistSchema.parse(req.body);

  const updated = await artistService.updateArtist(id, payload, {
    artistId: req.admin!.artistId,
    role: req.admin!.role,
  });

  res.json(updated);
}

export async function deleteArtist(req: AdminRequest, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid artist ID",
    });
  }

  try {
    await artistService.deleteArtist(id);

    return res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "ARTIST_NOT_FOUND":
          return res.status(404).json({
            message: "Artist not found.",
          });

        case "ARTIST_HAS_ARTWORKS":
          return res.status(409).json({
            message:
              "Cannot delete this artist because they have artworks. Remove the artworks first.",
          });

        case "ARTIST_HAS_CMS_ACCOUNTS":
          return res.status(409).json({
            message:
              "Cannot delete this artist because they have CMS accounts. Remove the CMS accounts first.",
          });

        case "ARTIST_HAS_INVITATIONS":
          return res.status(409).json({
            message:
              "Cannot delete this artist because they have CMS invitations. Revoke the invitations first.",
          });
      }
    }

    console.error("deleteArtist error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
