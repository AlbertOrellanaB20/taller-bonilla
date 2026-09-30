import { Resend } from "resend";
import { buildFacturaPdf } from "@/lib/reports/factura-pdf-builder";
import { fmtUSD } from "@/lib/format";
import type { Invoice } from "@/lib/domain/facturacion";

/**
 * Envía la factura por correo al cliente, con el mismo PDF que genera el
 * botón "Imprimir" (buildFacturaPdf) adjunto.
 *
 * Para activar esto en producción falta UNA sola cosa: crear una cuenta
 * gratuita en https://resend.com, generar una API key ahí, y definir la
 * variable de entorno RESEND_API_KEY (en .env.local para desarrollo, y en
 * Vercel → Settings → Environment Variables para producción). Opcionalmente
 * también RESEND_FROM_EMAIL si se verifica un dominio propio en Resend —
 * mientras tanto se envía desde la dirección de pruebas de Resend.
 * Sin esa variable, esta función devuelve un error claro en vez de fallar
 * en silencio o romper la pantalla.
 */
export async function sendFacturaEmail(invoice: Invoice & { clientEmail: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "El envío de correo no está configurado todavía (falta la llave de Resend). Avísale al administrador." };
  }

  const resend = new Resend(apiKey);
  const doc = buildFacturaPdf(invoice);
  const pdfBase64 = Buffer.from(doc.output("arraybuffer")).toString("base64");
  const fromAddress = process.env.RESEND_FROM_EMAIL || "Taller Bonilla <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from: fromAddress,
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
    attachments: [{ filename: `${invoice.number}.pdf`, content: pdfBase64 }],
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
