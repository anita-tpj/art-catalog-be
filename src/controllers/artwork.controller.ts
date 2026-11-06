import { Request, Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import {
  ArtworkListQuerySchema,
  createArtworkSchema,
  updateArtworkSchema,
} from "../dtos/artwork.dto";
import { AdminRequest } from "../middlewares/requireAdmin";
import * as artworkService from "../services/artwork.service";
import { AppError } from "../utils/AppError";

export async function getAllArtworks(req: AdminRequest, res: Response) {
  const artworks = await artworkService.getAllArtworks({
    artistId: req.admin!.artistId,
  });

  res.json(artworks);
}

export async function getFeaturedArtworks(req: Request, res: Response) {
  const artworks = await artworkService.getFeaturedArtworks();
  res.json(artworks);
}

export async function getPaginatedArtworks(req: AdminRequest, res: Response) {
  const query = ArtworkListQuerySchema.parse(req.query);

  const { items, total } = await artworkService.getPaginatedArtworks(query, {
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

export async function getArtwork(req: AdminRequest, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(ERROR_CODES.INVALID_ARTWORK_ID, 400);
  }

  const artwork = await artworkService.getArtworkById(id, {
    artistId: req.admin!.artistId,
  });

  if (!artwork) {
    throw new AppError(ERROR_CODES.ARTWORK_NOT_FOUND, 404);
  }

  res.json(artwork);
}

export async function getAllPublishedArtworks(req: Request, res: Response) {
  const artworks = await artworkService.getAllPublishedArtworks();

  res.json(artworks);
}

export async function getPaginatedPublishedArtworks(
  req: Request,
  res: Response,
) {
  const query = ArtworkListQuerySchema.parse(req.query);

  const { items, total } =
    await artworkService.getPaginatedPublishedArtworks(query);

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

export async function getPublishedArtwork(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(ERROR_CODES.INVALID_ARTWORK_ID, 400);
  }

  const artwork = await artworkService.getPublishedArtworkById(id);

  if (!artwork) {
    throw new AppError(ERROR_CODES.ARTWORK_NOT_FOUND, 404);
  }

  res.json(artwork);
}

export async function createArtwork(req: AdminRequest, res: Response) {
  const payload = createArtworkSchema.parse(req.body);

  const artwork = await artworkService.createArtwork(payload, {
    artistId: req.admin!.artistId,
    adminId: req.admin!.id,
    role: req.admin!.role,
  });

  res.status(201).json(artwork);
}

export async function updateArtwork(req: AdminRequest, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(ERROR_CODES.INVALID_ARTWORK_ID, 400);
  }

  const payload = updateArtworkSchema.parse(req.body);

  const updated = await artworkService.updateArtwork(id, payload, {
    artistId: req.admin!.artistId,
    role: req.admin!.role,
  });

  res.json(updated);
}

export async function deleteArtwork(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(ERROR_CODES.INVALID_ARTWORK_ID, 400);
  }

  await artworkService.deleteArtwork(id);

  res.status(204).send();
}
