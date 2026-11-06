
import type { Request, Response } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import {
  acceptAdminInvitationSchema,
  createAdminInvitationSchema,
} from "../dtos/adminInvitation.dto";
import {
  acceptArtistInvitation,
  createArtistInvitation,
  getArtistCmsAccess,
  getInvitationByToken,
  revokeArtistInvitation,
} from "../services/adminInvitation.service";
import { AppError } from "../utils/AppError";

export async function getAdminInvitation(req: Request, res: Response) {
  const token = req.params.token;

  if (!token) {
    throw new AppError(
      ERROR_CODES.INVALID_INVITATION,
      400,
      "Invitation token is required",
    );
  }

  const invitation = await getInvitationByToken(token);

  return res.status(200).json({ invitation });
}

export async function postAcceptAdminInvitation(
  req: Request,
  res: Response,
) {
  const data = acceptAdminInvitationSchema.parse(req.body);

  const user = await acceptArtistInvitation(
    data.token,
    data.password,
    data.termsAccepted,
  );

  return res.status(201).json({ user });
}

export async function postArtistInvitation(req: Request, res: Response) {
  const artistId = Number(req.params.id);

  if (!Number.isInteger(artistId) || artistId <= 0) {
    throw new AppError(
      ERROR_CODES.INVALID_ARTIST_ID,
      400,
      "Invalid artist ID",
    );
  }

  const data = createAdminInvitationSchema.parse(req.body);

  const result = await createArtistInvitation(artistId, data.email);

  return res.status(201).json(result);
}

export async function getArtistCmsAccessStatus(
  req: Request,
  res: Response,
) {
  const artistId = Number(req.params.id);

  if (!Number.isInteger(artistId) || artistId <= 0) {
    throw new AppError(
      ERROR_CODES.INVALID_ARTIST_ID,
      400,
      "Invalid artist ID",
    );
  }

  const access = await getArtistCmsAccess(artistId);

  return res.status(200).json(access);
}

export async function deleteArtistInvitation(
  req: Request,
  res: Response,
) {
  const artistId = Number(req.params.id);
  const invitationId = req.params.invitationId;

  if (!Number.isInteger(artistId) || artistId <= 0) {
    throw new AppError(
      ERROR_CODES.INVALID_ARTIST_ID,
      400,
      "Invalid artist ID",
    );
  }

  if (!invitationId) {
    throw new AppError(
      ERROR_CODES.INVALID_INVITATION_ID,
      400,
      "Invalid invitation ID",
    );
  }

  await revokeArtistInvitation(artistId, invitationId);

  return res.status(204).send();
}
