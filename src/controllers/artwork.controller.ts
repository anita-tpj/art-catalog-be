import { Request, Response } from "express";
import {
  ArtworkListQuerySchema,
  createArtworkSchema,
  updateArtworkSchema,
} from "../dtos/artwork.dto";
import { AdminRequest } from "../middlewares/requireAdmin";
import * as artworkService from "../services/artwork.service";

export async function getAllArtworks(req: AdminRequest, res: Response) {
  const artworks = await artworkService.getAllArtworks({
    artistId: req.admin!.artistId,
  });

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
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  const artwork = await artworkService.getArtworkById(id, {
    artistId: req.admin!.artistId,
  });

  if (!artwork) {
    const error: any = new Error("Art work not found");
    error.statusCode = 404;
    throw error;
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
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  const artwork = await artworkService.getPublishedArtworkById(id);

  if (!artwork) {
    const error: any = new Error("Art work not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(artwork);
}

export async function createArtwork(req: AdminRequest, res: Response) {
  const payload = createArtworkSchema.parse(req.body);

  const artwork = await artworkService.createArtwork(payload, {
    artistId: req.admin!.artistId,
  });

  res.status(201).json(artwork);
}

export async function updateArtwork(req: AdminRequest, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  const payload = updateArtworkSchema.parse(req.body);

  const updated = await artworkService.updateArtwork(id, payload, {
    artistId: req.admin!.artistId,
  });

  res.json(updated);
}

export async function deleteArtwork(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  await artworkService.deleteArtwork(id);

  res.status(204).send();
}
