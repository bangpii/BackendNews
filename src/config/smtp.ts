import nodemailer from "nodemailer";
import { env } from "./env.js";

let transport: nodemailer.Transporter | null = null;

export function getSmtpTransport(): nodemailer.Transporter {
  if (transport) return transport;
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    throw new Error("SMTP tidak dikonfigurasi");
  }
  transport = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
  return transport;
}

export function smtpConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}
