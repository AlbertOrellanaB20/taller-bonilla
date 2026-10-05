import nodemailer from "nodemailer";
import { buildFacturaPdf } from "@/lib/reports/factura-pdf-builder";
import { fmtUSD } from "@/lib/format";
import type { Invoice } from "@/lib/domain/facturacion";

/**
 * Envía la factura por correo al cliente, con el mismo PDF que genera el
 * botón "Imprimir" (buildFacturaPdf) adjunto. Usa Gmail a través de
 * Nodemailer — nunca se importa en el cliente (este archivo solo lo usa
 * una Server Action), así que la contraseña de aplicación nunca llega al
 * navegador.
 *
 * Requiere dos variables de entorno, ya configuradas en Vercel:
 * - GMAIL_USER: la dirección de Gmail que envía el correo.
 * - GMAIL_APP_PASSWORD: una "contraseña de aplicación" de 16 caracteres
 *   generada en https://myaccount.google.com/apppasswords (requiere
 *   verificación en dos pasos activada en esa cuenta de Gmail) — NUNCA la
 *   contraseña normal de la cuenta.
 * Sin esas variables, esta función devuelve un error claro en vez de
 * fallar en silencio o romper la pantalla.
 */
export async function sendFacturaEmail(invoice: Invoice & { clientEmail: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return { ok: false, error: "El envío de correo no está configurado todavía (falta GMAIL_USER / GMAIL_APP_PASSWORD). Avísale al administrador." };
  }

  const doc = buildFacturaPdf(invoice);
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Taller Bonilla" <${user}>`,
      to: invoice.clientEmail,
      subject: `Factura ${invoice.number} — Taller Bonilla`,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; color:#1c1c1f; max-width:520px; margin:0 auto;">
          <div style="background:#0D0D0F; padding:22px 24px; border-radius:10px 10px 0 0;">
            <h1 style="color:#ffffff; margin:0; font-size:20px; letter-spacing:-0.02em;">TALLER BONILLA</h1>
            <p style="color:#A31212; margin:4px 0 0; font-size:11px; letter-spacing:0.08em; text-transform:uppercase;">Taller Automotriz · Sonsonate, El Salvador</p>
          </div>
          <div style="padding:24px; border:1px solid #eee; border-top:none; border-radius:0 0 10px 10px;">
            <p>Hola ${invoice.client},</p>
            <p>Adjuntamos tu factura <strong>${invoice.number}</strong> por el servicio a tu vehículo <strong>${invoice.plate}</strong> (${invoice.model}).</p>
            <p style="font-size:24px; font-weight:bold; color:#A31212; margin:20px 0;">${fmtUSD(invoice.total)}</p>
            <p style="color:#555; font-size:13px;">Método de pago: ${invoice.paymentMethod} &nbsp;·&nbsp; Estado: ${invoice.status}</p>
            <p style="color:#999; font-size:12px; margin-top:28px;">Gracias por confiar en Taller Bonilla.</p>
          </div>
        </div>
      `,
      attachments: [{ filename: `${invoice.number}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo enviar el correo." };
  }
}
