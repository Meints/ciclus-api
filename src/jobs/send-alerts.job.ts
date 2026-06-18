import { env } from "../config/env";

export async function sendAlertsJob(): Promise<void> {
  if (!env.ZAPI_INSTANCE_ID || !env.ZAPI_TOKEN) {
    console.log("[send-alerts] ZAPI não configurado, pulando");
    return;
  }

  console.log("[send-alerts] Job executado (sem envio real - integração ZAPI pendente)");
}
