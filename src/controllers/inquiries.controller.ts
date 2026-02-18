import type { Request, Response } from "express";
import * as inquiriesService from "../services/inquiries.service";
import {
  createInquirySchema,
  InquiryListQuerySchema,
  UpdateInquirySchema,
} from "../dtos/inquiry.dto";

function parseId(req: Request) {
  const id = Number(req.params.id);
  return Number.isFinite(id) ? id : null;
}

export async function getAllInquiries(req: Request, res: Response) {
  const inquiries = await inquiriesService.getAllInquiries();
  res.json(inquiries);
}

export async function getPaginatedInquiries(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const query = InquiryListQuerySchema.parse(req.query);

  const { items, total } = await inquiriesService.getPaginatedInquiries(query);

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

export async function getInquiry(req: Request, res: Response) {
  const id = parseId(req);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  const inquiry = await inquiriesService.getInquiryById(id);
  if (!inquiry) return res.status(404).json({ message: "Not found" });

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

export async function updateInquiry(req: Request, res: Response) {
  const id = parseId(req);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  const parsed = UpdateInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation error", issues: parsed.error.issues });
  }

  const updated = await inquiriesService.updateInquiry(id, parsed.data);
  return res.json(updated);
}

export async function getInquiriesStats(req: Request, res: Response) {
  const stats = await inquiriesService.getInquiryStats();
  return res.json(stats);
}
