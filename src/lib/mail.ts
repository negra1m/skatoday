// Envio de emails via SMTP (Stalwart na VPS Few).
// Em dev sem SMTP_HOST: loga no console.

import nodemailer from "nodemailer";

type MailOpts = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return transporter;
}

export async function sendMail(opts: MailOpts) {
  const t = getTransporter();
  const from = process.env.SMTP_FROM ?? "skatoday@fewcompany.com";

  if (!t) {
    console.log("[mail:dev] —— sem SMTP_HOST configurado, simulando envio ——");
    console.log(`from: ${from}`);
    console.log(`to: ${opts.to}`);
    console.log(`subject: ${opts.subject}`);
    console.log(opts.text);
    console.log("———————————");
    return { ok: true, dev: true };
  }

  await t.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return { ok: true };
}

export function buildResetEmail(opts: {
  username: string;
  resetUrl: string;
  locale?: "pt-BR" | "en" | "zh-CN";
}) {
  const L = TPL[opts.locale ?? "pt-BR"];
  const text = L.body(opts.username, opts.resetUrl);
  return {
    subject: L.subject,
    text,
    html: `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:14px;line-height:1.6">${text}</pre>`,
  };
}

const TPL = {
  "pt-BR": {
    subject: "skatoday — Redefinir senha",
    body: (u: string, url: string) =>
      `Olá ${u},

Recebemos um pedido pra redefinir sua senha no skatoday.

Clique no link abaixo (válido por 1 hora):
${url}

Se você não pediu isso, ignore este email — sua senha continua a mesma.

Few Company · skatoday`,
  },
  en: {
    subject: "skatoday — Password reset",
    body: (u: string, url: string) =>
      `Hello ${u},

We received a request to reset your skatoday password.

Click the link below (valid for 1 hour):
${url}

If you didn't request this, ignore this email — your password stays the same.

Few Company · skatoday`,
  },
  "zh-CN": {
    subject: "skatoday — 重置密码",
    body: (u: string, url: string) =>
      `${u}，您好

我们收到了重置 skatoday 密码的请求。

请点击下方链接（1小时内有效）：
${url}

如果不是您本人操作，请忽略此邮件。

Few Company · skatoday`,
  },
} as const;
