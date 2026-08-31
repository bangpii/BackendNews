import type { ContactSubmission } from "../types/contact.js";
import { createContactSubmission } from "../models/contactModel.js";
import { getSmtpTransport, smtpConfigured } from "../config/smtp.js";
import { env } from "../config/env.js";

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export async function submitContact(input: ContactInput, ip: string): Promise<ContactSubmission> {
  const doc: ContactSubmission = {
    id: `ct_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    ip,
    createdAt: Date.now(),
    sent: false,
  };

  let sent = false;
  try {
    if (smtpConfigured()) {
      const transport = getSmtpTransport();
      await transport.sendMail({
        from: `"Bangpii News Contact" <${env.smtpUser}>`,
        to: env.contactTo,
        replyTo: input.email,
        subject: `[Bangpii News] Pesan dari ${input.name}`,
        text: input.message,
        html: `<p><strong>Nama:</strong> ${escapeHtml(input.name)}</p>
               <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
               <hr/><p>${escapeHtml(input.message)}</p>`,
      });
      sent = true;
    }
  } catch {
    sent = false;
  }

  doc.sent = sent;
  await createContactSubmission(doc);
  return doc;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
