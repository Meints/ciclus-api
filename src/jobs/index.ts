import cron from "node-cron";
import { generateServicesJob } from "./generate-services.job";
import { expireContractsJob } from "./expire-contracts.job";
import { cleanupTokensJob } from "./cleanup.job";

export function registerJobs() {
  cron.schedule("1 0 * * *", () => {
    generateServicesJob().catch((err) => console.error("[generate-services] Erro:", err));
  });

  cron.schedule("0 1 * * *", () => {
    expireContractsJob().catch((err) => console.error("[expire-contracts] Erro:", err));
  });

  cron.schedule("0 2 * * *", () => {
    cleanupTokensJob().catch((err) => console.error("[cleanup-tokens] Erro:", err));
  });
}
