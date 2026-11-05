import { resend } from "../libs/resend";

function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new Error("EMAIL_FROM is not configured");
  }

  return from;
}

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailParams) {
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}