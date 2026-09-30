import type { Request, Response } from "express";
import {
  createInquirySchema,
  InquiryListQuerySchema,
  UpdateInquirySchema,
} from "../dtos/inquiry.dto";
import type { AdminRequest } from "../middlewares/requireAdmin";
import * as inquiriesService from "../services/inquiries.service";

function parseId(req: Request) {
  const id = Number(req.params.id);
  return Number.isFinite(id) ? id : null;
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

  if (!id) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const inquiry = await inquiriesService.getInquiryById(id, {
    artistId: req.admin!.artistId,
  });

  if (!inquiry) {
    return res.status(404).json({ message: "Not found" });
  }

  return res.json(inquiry);
}

export async function createInquiry(req: Request, res: Response) {
  const parsed = createInquirySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation error",
      issues: parsed.error.issues,
    });
  }

  const inquiry = await inquiriesService.createInquiry(parsed.data);

  return res.status(201).json(inquiry);
}

export async function updateInquiry(req: AdminRequest, res: Response) {
  const id = parseId(req);

  if (!id) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const parsed = UpdateInquirySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation error",
      issues: parsed.error.issues,
    });
  }

  const updated = await inquiriesService.updateInquiry(id, parsed.data, {
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
