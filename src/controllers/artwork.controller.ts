import { Request, Response } from "express";
import * as artWorkService from "../services/artwork.service";

export async function getArtWorks(req: Request, res: Response) {
  const artWorks = await artWorkService.getAllArtWorks();
  res.json(artWorks);
}

export async function getArtWork(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  const artWork = await artWorkService.getArtWorkById(id);

  if (!artWork) {
    const error: any = new Error("Art work not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(artWork);
}

export async function createArtWork(req: Request, res: Response) {
  const artWork = await artWorkService.createArtWork(req.body);
  res.status(201).json(artWork);
}

export async function updateArtWork(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  const existing = await artWorkService.getArtWorkById(id);

  if (!existing) {
    const error: any = new Error("Art work not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await artWorkService.updateArtWork(id, req.body);

  res.json(updated);
}

export async function deleteArtWork(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    const error: any = new Error("Invalid art work ID");
    error.statusCode = 400;
    throw error;
  }

  const existing = await artWorkService.getArtWorkById(id);

  if (!existing) {
    const error: any = new Error("Art work not found");
    error.statusCode = 404;
    throw error;
  }
  await artWorkService.deleteArtWork(id);
  res.status(204).send();
}
