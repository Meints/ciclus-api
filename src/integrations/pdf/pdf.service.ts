import PDFDocument from "pdfkit";
import { uploadFile } from "../storage/storage.service";
import { env } from "../../config/env";
import {
  renderServiceReport,
  type ServiceReportData,
} from "./templates/service-report";

export type { ServiceReportData } from "./templates/service-report";

export async function generateServiceReport(
  serviceId: string,
  data: ServiceReportData,
): Promise<string> {
  const doc = new PDFDocument({ margin: 50 });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  return new Promise<string>((resolve, reject) => {
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      try {
        const url = await uploadFile(
          env.SUPABASE_STORAGE_BUCKET,
          `companies/${data.companyId}/reports/${serviceId}.pdf`,
          pdfBuffer,
          "application/pdf",
        );
        resolve(url);
      } catch (err) {
        console.error("[generateServiceReport] Upload failed:", err);
        resolve("");
      }
    });

    doc.on("error", reject);

    renderServiceReport(doc, serviceId, data);

    doc.end();
  });
}
