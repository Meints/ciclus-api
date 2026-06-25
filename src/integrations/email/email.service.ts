import { Resend } from "resend";
import { env } from "../../config/env";

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendForgotPasswordEmail(
  email: string,
  token: string,
): Promise<void> {
  const client = getClient();
  const resetLink = `${env.FRONTEND_URL}/reset-password/${token}`;

  if (!client) {
    console.log(`[EMAIL] Resend não configurado. Link para ${email}: ${resetLink}`);
    return;
  }

  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Redefinição de senha — Ciclus",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #185FA5;">Redefinição de senha</h2>
        <p>Você solicitou a redefinição da sua senha no Ciclus.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #185FA5; color: #fff; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Redefinir senha
        </a>
        <p style="color: #666; font-size: 14px;">Este link expira em 1 hora.</p>
        <p style="color: #666; font-size: 14px;">Se você não solicitou esta redefinição, ignore este email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Ciclus — Gestão de Serviços Recorrentes</p>
      </div>
    `,
  });

  if (error) {
    console.error(`[EMAIL] Falha ao enviar email para ${email}:`, error);
  }
}

export async function sendServiceConfirmationEmail(
  to: string,
  data: {
    customerName: string;
    companyName: string;
    serviceType: string;
    completedDate: string;
    confirmationLink: string;
    serviceNumber: number;
  },
): Promise<void> {
  const client = getClient();

  if (!client) {
    console.log(`[EMAIL] Resend não configurado. Confirmação OS #${data.serviceNumber} para ${to}: ${data.confirmationLink}`);
    return;
  }

  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `Confirme o serviço realizado — ${data.companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #185FA5;">Serviço realizado</h2>
        <p>Olá, ${data.customerName}!</p>
        <p>A empresa <strong>${data.companyName}</strong> realizou o serviço abaixo e precisa da sua confirmação:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 0; color: #666;">OS</td><td style="padding: 4px 0;">#${data.serviceNumber}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Serviço</td><td style="padding: 4px 0;">${data.serviceType}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Concluído em</td><td style="padding: 4px 0;">${data.completedDate}</td></tr>
        </table>
        <a href="${data.confirmationLink}" style="display: inline-block; padding: 12px 24px; background-color: #185FA5; color: #fff; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Confirmar serviço
        </a>
        <p style="color: #666; font-size: 14px;">Este link expira em 24 horas.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Ciclus — Gestão de Serviços Recorrentes</p>
      </div>
    `,
  });

  if (error) {
    console.error(`[EMAIL] Falha ao enviar confirmação para ${to}:`, error);
  }
}
