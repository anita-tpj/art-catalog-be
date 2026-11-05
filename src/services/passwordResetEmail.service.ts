
import { escapeHtml } from "../utils/escapeHtml";
import { sendEmail } from "./email.service";

type SendPasswordResetEmailParams = {
  email: string;
  token: string;
};

function getFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  return frontendUrl.replace(/\/$/, "");
}

export async function sendPasswordResetEmail({
  email,
  token,
}: SendPasswordResetEmailParams) {
  const resetUrl =
    `${getFrontendUrl()}/admin/reset-password` +
    `?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: "Reset your Creative Atlas password",
    html: `
      <h1>Reset your password</h1>

      <p>
        We received a request to reset the password
        for your Creative Atlas CMS account.
      </p>

      <p>
        <a href="${escapeHtml(resetUrl)}">
          Reset your password
        </a>
      </p>

      <p>This link expires in 30 minutes.</p>

      <p>
        If you didn't request a password reset,
        you can safely ignore this email.
      </p>
    `,
  });
}
