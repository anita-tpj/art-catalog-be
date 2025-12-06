import { Request, Response } from "express";
import * as artistService from "../services/artist.service";
import { ArtistListQuerySchema, createArtistSchema } from "../dtos/artist.dto";

// export async function getArtists(req: Request, res: Response) {
//   const artists = await artistService.getAllArtists();
//   res.json(artists);
// }

export async function getArtists(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const query = ArtistListQuerySchema.parse(req.query);

  const { items, total } = await artistService.getPaginatedArtists(query);

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

export async function getArtist(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid artist id");
    error.statusCode = 400;
    throw error;
  }

  const artist = await artistService.getArtistById(id);

  if (!artist) {
    const error: any = new Error("Artist not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(artist);
}

export async function createArtist(req: Request, res: Response) {
  const payload = createArtistSchema.parse(req.body);

  const artist = await artistService.createArtist(payload);
  res.status(201).json(artist);
}

export async function updateArtist(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid artist id");
    error.statusCode = 400;
    throw error;
  }

  const existing = await artistService.getArtistById(id);

  if (!existing) {
    const error: any = new Error("Artist not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await artistService.updateArtist(id, req.body);
  res.json(updated);
}

export async function deleteArtist(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid artist id");
    error.statusCode = 400;
    throw error;
  }

  const existing = await artistService.getArtistById(id);
  if (!existing) {
    const error: any = new Error("Artist not found");
    error.statusCode = 404;
    throw error;
  }

  await artistService.deleteArtist(id);
  res.status(204).send();
}
