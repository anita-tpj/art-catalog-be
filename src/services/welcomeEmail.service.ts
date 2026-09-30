import { sendEmail } from "./email.service";

type SendWelcomeEmailParams = {
  email: string;
  artistName: string;
};

function getFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  return frontendUrl.replace(/\/$/, "");
}

export async function sendWelcomeEmail({
  email,
  artistName,
}: SendWelcomeEmailParams) {
  const loginUrl = `${getFrontendUrl()}/admin/login`;

  return sendEmail({
    to: email,
    subject: "Welcome to Creative Atlas",
    html: `
      <h1>Welcome to Creative Atlas</h1>

      <p>
        Your CMS account for <strong>${artistName}</strong> is ready.
      </p>

      <p>
        You can now manage your artist profile, artworks, and inquiries.
      </p>

      <p>
        <a href="${loginUrl}">
          Sign in to Creative Atlas
        </a>
      </p>
    `,
  });
}