import { sendEmail } from "./email.service";

type SendArtistInvitationEmailParams = {
  email: string;
  artistName: string;
  token: string;
};

function getFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  return frontendUrl.replace(/\/$/, "");
}

export async function sendArtistInvitationEmail({
  email,
  artistName,
  token,
}: SendArtistInvitationEmailParams) {
  const invitationUrl =
    `${getFrontendUrl()}/admin/invitations/accept` +
    `?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: "You're invited to Creative Atlas",
    html: `
      <h1>Welcome to Creative Atlas</h1>

      <p>
        You've been invited to manage the CMS profile for
        <strong>${artistName}</strong>.
      </p>

      <p>
        <a href="${invitationUrl}">
          Create your CMS account
        </a>
      </p>

      <p>This invitation expires in 48 hours.</p>

      <p>
        If you weren't expecting this invitation, you can ignore this email.
      </p>
    `,
  });
}