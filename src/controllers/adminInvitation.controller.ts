import type { Request, Response } from "express";
import {
  acceptArtistInvitation,
  createArtistInvitation,
  getArtistCmsAccess,
  getInvitationByToken,
  revokeArtistInvitation,
} from "../services/adminInvitation.service";

import {
  acceptAdminInvitationSchema,
  createAdminInvitationSchema,
} from "../dtos/adminInvitation.dto";

export async function getAdminInvitation(req: Request, res: Response) {
  const token = req.params.token;

  if (!token) {
    return res.status(400).json({
      message: "Invitation token is required",
    });
  }

  try {
    const invitation = await getInvitationByToken(token);

    return res.status(200).json({
      invitation,
    });
  } catch (error: any) {
    if (error?.message === "INVALID_INVITATION") {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (error?.message === "INVITATION_ALREADY_ACCEPTED") {
      return res.status(410).json({
        message: "Invitation has already been accepted",
      });
    }

    if (error?.message === "INVITATION_EXPIRED") {
      return res.status(410).json({
        message: "Invitation has expired",
      });
    }

    console.error("getAdminInvitation error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function postAcceptAdminInvitation(req: Request, res: Response) {
  const parsed = acceptAdminInvitationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid payload",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const user = await acceptArtistInvitation(
      parsed.data.token,
      parsed.data.password,
    );

    return res.status(201).json({
      user,
    });
  } catch (error: any) {
    if (error?.message === "INVALID_INVITATION") {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (error?.message === "INVITATION_ALREADY_ACCEPTED") {
      return res.status(410).json({
        message: "Invitation has already been accepted",
      });
    }

    if (error?.message === "INVITATION_EXPIRED") {
      return res.status(410).json({
        message: "Invitation has expired",
      });
    }

    if (error?.message === "ACCOUNT_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    console.error("postAcceptAdminInvitation error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function postArtistInvitation(req: Request, res: Response) {
  const artistId = Number(req.params.id);

  if (!Number.isInteger(artistId) || artistId <= 0) {
    return res.status(400).json({ message: "Invalid artist ID" });
  }

  const parsed = createAdminInvitationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid payload",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = await createArtistInvitation(artistId, parsed.data.email);

    return res.status(201).json(result);
  } catch (error: any) {
    if (error?.message === "ARTIST_NOT_FOUND") {
      return res.status(404).json({ message: "Artist not found" });
    }

    if (error?.message === "ACCOUNT_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    if (error?.message === "INVITATION_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "An active invitation already exists for this email",
      });
    }

    console.error("postArtistInvitation error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getArtistCmsAccessStatus(req: Request, res: Response) {
  const artistId = Number(req.params.id);

  if (!Number.isInteger(artistId) || artistId <= 0) {
    return res.status(400).json({
      message: "Invalid artist ID",
    });
  }

  try {
    const access = await getArtistCmsAccess(artistId);

    return res.status(200).json(access);
  } catch (error: any) {
    if (error?.message === "ARTIST_NOT_FOUND") {
      return res.status(404).json({
        message: "Artist not found",
      });
    }

    console.error("getArtistCmsAccessStatus error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function deleteArtistInvitation(req: Request, res: Response) {
  const artistId = Number(req.params.id);
  const invitationId = req.params.invitationId;

  if (!Number.isInteger(artistId) || artistId <= 0) {
    return res.status(400).json({
      message: "Invalid artist ID",
    });
  }

  if (!invitationId) {
    return res.status(400).json({
      message: "Invalid invitation ID",
    });
  }

  try {
    await revokeArtistInvitation(artistId, invitationId);

    return res.status(204).send();
  } catch (error: any) {
    if (error?.message === "INVITATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Invitation not found",
      });
    }

    if (error?.message === "INVITATION_ALREADY_ACCEPTED") {
      return res.status(409).json({
        message: "Accepted invitations cannot be revoked",
      });
    }

    console.error("deleteArtistInvitation error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
