import { sendEmail } from "./email.service";

type SendContactEmailParams = {
  name: string;
  email: string;
  message: string;
};

function getContactEmail(): string {
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!contactEmail) {
    throw new Error("CONTACT_EMAIL is not configured");
  }

  return contactEmail;
}

function escapeHtml(value: string): string {
return value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");
}

export async function sendContactEmail({
  name,
  email,
  message,
}: SendContactEmailParams) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  return sendEmail({
    to: getContactEmail(),
    subject: "New contact message on Creative Atlas",
    html: `
      <h1>New contact message</h1>

      <p><strong>From:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>

      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `,
  });
}