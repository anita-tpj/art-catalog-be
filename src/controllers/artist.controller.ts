import { Request, Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import {
  ArtistListQuerySchema,
  createArtistSchema,
  updateArtistSchema,
} from "../dtos/artist.dto";
import { AdminRequest } from "../middlewares/requireAdmin";
import * as artistService from "../services/artist.service";
import { AppError } from "../utils/AppError";

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
    throw new AppError(ERROR_CODES.INVALID_ARTIST_ID, 400);
  }

  const artist = await artistService.getPublishedArtistById(id);

  if (!artist) {
    throw new AppError(ERROR_CODES.ARTIST_NOT_FOUND, 404);
  }

  res.json(artist);
}

export async function getPublishedArtistBySlug(req: Request, res: Response) {
  const slug = req.params.slug;

  if (!slug) {
    throw new AppError(ERROR_CODES.INVALID_ARTIST_SLUG, 400);
  }

  const artist = await artistService.getPublishedArtistBySlug(slug);

  if (!artist) {
    throw new AppError(ERROR_CODES.ARTIST_NOT_FOUND, 404);
  }

  res.json(artist);
}

export async function getArtist(req: AdminRequest, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(ERROR_CODES.INVALID_ARTIST_ID, 400);
  }

  const artist = await artistService.getArtistById(id, {
    artistId: req.admin!.artistId,
  });

  if (!artist) {
    throw new AppError(ERROR_CODES.ARTIST_NOT_FOUND, 404);
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
    throw new AppError(ERROR_CODES.INVALID_ARTIST_ID, 400);
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
    throw new AppError(ERROR_CODES.INVALID_ARTIST_ID, 400);
  }

  await artistService.deleteArtist(id);

  return res.status(204).send();
}
