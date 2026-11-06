import type { Request, Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import {
  createInquirySchema,
  InquiryListQuerySchema,
  UpdateInquirySchema,
} from "../dtos/inquiry.dto";
import type { AdminRequest } from "../middlewares/requireAdmin";
import * as inquiriesService from "../services/inquiries.service";
import { AppError } from "../utils/AppError";

function parseId(req: Request): number {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(ERROR_CODES.INVALID_INQUIRY_ID, 400);
  }

  return id;
}

export async function getAllInquiries(req: AdminRequest, res: Response) {
  const inquiries = await inquiriesService.getAllInquiries({
    artistId: req.admin!.artistId,
  });

  res.json(inquiries);
}

export async function getPaginatedInquiries(req: AdminRequest, res: Response) {
  const query = InquiryListQuerySchema.parse(req.query);

  const { items, total } = await inquiriesService.getPaginatedInquiries(query, {
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

export async function getInquiry(req: AdminRequest, res: Response) {
  const id = parseId(req);

  const inquiry = await inquiriesService.getInquiryById(id, {
    artistId: req.admin!.artistId,
  });

  if (!inquiry) {
    throw new AppError(ERROR_CODES.INQUIRY_NOT_FOUND, 404);
  }

  return res.json(inquiry);
}

export async function createInquiry(req: Request, res: Response) {
  const payload = createInquirySchema.parse(req.body);

  const inquiry = await inquiriesService.createInquiry(payload);

  return res.status(201).json(inquiry);
}

export async function updateInquiry(req: AdminRequest, res: Response) {
  const id = parseId(req);
  const payload = UpdateInquirySchema.parse(req.body);

  const updated = await inquiriesService.updateInquiry(id, payload, {
    artistId: req.admin!.artistId,
  });

  return res.json(updated);
}

export async function getInquiriesStats(req: AdminRequest, res: Response) {
  const stats = await inquiriesService.getInquiryStats({
    artistId: req.admin!.artistId,
  });

  return res.json(stats);
}

export async function deleteInquiry(req: AdminRequest, res: Response) {
  const id = parseId(req);

  const deleted = await inquiriesService.deleteInquiry(id);

  if (!deleted) {
    throw new AppError(ERROR_CODES.INQUIRY_NOT_FOUND, 404);
  }

  return res.status(204).send();
}
