import { sendEmail } from "./email.service";

type SendInquiryNotificationEmailParams = {
  to: string;
  senderName: string;
  artistName: string;
  inquiryId: number;
  artworkTitle?: string | null | undefined;
};

function getFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  return frontendUrl.replace(/\/$/, "");
}

export async function sendInquiryNotificationEmail({
  to,
  senderName,
  artistName,
  inquiryId,
  artworkTitle,
}: SendInquiryNotificationEmailParams) {
  const inquiryUrl = `${getFrontendUrl()}/admin/inquiries/${inquiryId}`;

  const artworkContext = artworkTitle
    ? `<p>Regarding: <strong>${artworkTitle}</strong></p>`
    : "";

  return sendEmail({
    to,
    subject: "New inquiry on Creative Atlas",
    html: `
      <h1>You received a new inquiry</h1>

      <p>
        <strong>${senderName}</strong> sent a new inquiry to
        <strong>${artistName}</strong>.
      </p>

      ${artworkContext}

      <p>
        <a href="${inquiryUrl}">
          View inquiry
        </a>
      </p>
    `,
  });
}
