import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;
const appUrl = process.env.APP_URL;

type DatosInvitacion = {
  correo: string;
  nombreGimnasio: string;
  token: string;
  expiraEn: Date;
};

export async function enviarInvitacionCorreo({
  correo,
  nombreGimnasio,
  token,
  expiraEn,
}: DatosInvitacion) {
  if (!apiKey || !emailFrom || !appUrl) {
    throw new Error("Falta configurar las variables de correo.");
  }

  const resend = new Resend(apiKey);
  const urlInvitacion = new URL("/invitacion/aceptar", appUrl);
  urlInvitacion.searchParams.set("token", token);

  const fechaExpiracion = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(expiraEn);

  const resultado = await resend.emails.send({
    from: emailFrom,
    to: correo,
    subject: `Invitación para unirte a ${nombreGimnasio} en GymPass`,
    text: [
      `Has recibido una invitación para unirte a ${nombreGimnasio} en GymPass.`,
      "",
      `Acepta tu invitación aquí: ${urlInvitacion.toString()}`,
      "",
      `Este enlace vence el ${fechaExpiracion} (hora de Perú).`,
      "Si no esperabas esta invitación, puedes ignorar este correo.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
        <h1 style="font-size: 24px;">Te invitaron a GymPass</h1>
        <p>
          Has recibido una invitación para unirte a
          <strong>${nombreGimnasio.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")}</strong>.
        </p>
        <p>Para continuar, pulsa el siguiente enlace:</p>
        <p style="margin: 28px 0;">
          <a
            href="${urlInvitacion.toString()}"
            style="background: #059669; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;"
          >
            Aceptar invitación
          </a>
        </p>
        <p>Este enlace vence el ${fechaExpiracion} (hora de Perú).</p>
        <p style="font-size: 13px; color: #64748b;">
          Si no esperabas esta invitación, puedes ignorar este correo.
        </p>
      </div>
    `,
  });

  if (resultado.error) {
    throw new Error("Resend no pudo enviar la invitación.");
  }

  return { id: resultado.data?.id };
}