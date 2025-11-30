import { Request, Response } from "express";
import * as artworkService from "../services/artwork.service";
import { ArtworkListQuerySchema } from "../dtos/artwork.dto";

// export async function getArtworks(req: Request, res: Response) {
//   const artworks = await artworkService.getAllArtworks();
//   res.json(artworks);
// }

export async function getArtworks(req: Request, res: Response) {
  const query = ArtworkListQuerySchema.parse(req.query);

  const { items, total } = await artworkService.getPaginatedArtworks(query);

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

export async function getArtwork(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  const artwork = await artworkService.getArtworkById(id);

  if (!artwork) {
    const error: any = new Error("Art work not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(artwork);
}

export async function createArtwork(req: Request, res: Response) {
  const artwork = await artworkService.createArtwork(req.body);
  res.status(201).json(artwork);
}

export async function updateArtwork(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  const existing = await artworkService.getArtworkById(id);

  if (!existing) {
    const error: any = new Error("Art work not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await artworkService.updateArtwork(id, req.body);

  res.json(updated);
}

export async function deleteArtwork(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  const existing = await artworkService.getArtworkById(id);

  if (!existing) {
    const error: any = new Error("Art work not found");
    error.statusCode = 404;
    throw error;
  }
  await artworkService.deleteArtwork(id);
  res.status(204).send();
}
