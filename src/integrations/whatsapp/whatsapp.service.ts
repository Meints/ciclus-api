import { env } from "../../config/env";

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  if (!env.ZAPI_INSTANCE_ID || !env.ZAPI_TOKEN) return false;

  const cleaned = phone.replace(/\D/g, "");
  const international = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;

  const url = `${env.ZAPI_BASE_URL}/instances/${env.ZAPI_INSTANCE_ID}/token/${env.ZAPI_TOKEN}/send-text`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: international, message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendConfirmationWhatsApp(
  phone: string,
  data: {
    customerName: string;
    companyName: string;
    confirmationLink: string;
    serviceNumber: number;
    frontendUrl: string;
  },
): Promise<boolean> {
  const message = `Olá, ${data.customerName}! 👋\n\n*${data.companyName}* realizou um serviço e precisa da sua confirmação.\n\nAcesse o link abaixo para confirmar que o serviço foi realizado:\n${data.frontendUrl}${data.confirmationLink}\n\n_Este link expira em 24 horas._`;
  return sendWhatsAppMessage(phone, message);
}
