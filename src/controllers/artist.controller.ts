import { Request, Response } from "express";
import * as artistService from "../services/artist.service";

// export async function getArtists(req: Request, res: Response) {
//   const artists = await artistService.getAllArtists();
//   res.json(artists);
// }

export async function getArtists(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;

  const safePage = page < 1 ? 1 : page;
  const safePageSize = pageSize < 1 ? 10 : pageSize;

  const { items, total } = await artistService.getPaginatedArtists(
    safePage,
    safePageSize
  );

  res.json({
    items,
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.ceil(total / safePageSize),
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
  const artist = await artistService.createArtist(req.body);
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
