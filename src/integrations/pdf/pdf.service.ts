import PDFDocument from "pdfkit";
import { uploadFile } from "../storage/storage.service";

export interface ServiceReportData {
  serviceNumber: number;
  serviceType?: string | null;
  scheduledAt: Date;
  completedDate?: Date | null;
  durationMinutes?: number | null;
  status: string;
  technicianName?: string | null;
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  customerName: string;
  customerAddress?: Record<string, unknown> | null;
  equipment: Array<{ type: string; brand?: string | null; model?: string | null; location?: string | null; notes?: string | null }>;
  executionNotes?: string | null;
  confirmedAt?: Date | null;
}

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
          "ciclus-uploads",
          `companies/${data.companyId}/reports/${serviceId}.pdf`,
          pdfBuffer,
          "application/pdf",
        );
        resolve(url);
      } catch {
        resolve("");
      }
    });

    doc.on("error", reject);

    const regularFont = "Helvetica";
    const boldFont = "Helvetica-Bold";

    doc.fontSize(10).font(regularFont);

    const pageWidth = doc.page?.width ? doc.page.width - 100 : 400;

    doc.fontSize(20).font(boldFont).text(data.companyName, { align: "left" });

    doc.moveDown(0.5);

    doc.fontSize(16).font(boldFont).text(`Ordem de Serviço Nº ${data.serviceNumber}`, { align: "center" });

    doc.moveDown(1);

    const drawLine = () => {
      const y = doc.y;
      doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke();
      doc.moveDown(0.5);
    };

    drawLine();

    doc.fontSize(12).font(boldFont).text("Dados do Serviço");
    doc.moveDown(0.3);
    doc.fontSize(10).font(regularFont);
    doc.text(`Tipo: ${data.serviceType || "—"}`);
    doc.text(`Data agendada: ${data.scheduledAt.toLocaleDateString("pt-BR")}`);
    doc.text(`Data de execução: ${data.completedDate ? data.completedDate.toLocaleDateString("pt-BR") : "—"}`);
    doc.text(`Duração: ${data.durationMinutes ? `${data.durationMinutes} min` : "—"}`);
    doc.text(`Técnico: ${data.technicianName || "—"}`);

    doc.moveDown(1);
    drawLine();

    doc.fontSize(12).font(boldFont).text("Dados do Cliente");
    doc.moveDown(0.3);
    doc.fontSize(10).font(regularFont);
    doc.text(`Nome: ${data.customerName}`);
    if (data.customerAddress) {
      const addr = data.customerAddress as Record<string, string>;
      doc.text(`Endereço: ${addr.street || ""}, ${addr.number || ""}${addr.neighborhood ? ` - ${addr.neighborhood}` : ""}${addr.city ? ` - ${addr.city}` : ""}${addr.state ? `/${addr.state}` : ""}`);
    }

    doc.moveDown(1);
    drawLine();

    if (data.equipment.length > 0) {
      doc.fontSize(12).font(boldFont).text("Equipamentos Atendidos");
      doc.moveDown(0.3);
      doc.fontSize(10).font(regularFont);

      for (const eq of data.equipment) {
        const brandModel = [eq.brand, eq.model].filter(Boolean).join(" / ");
        doc.text(`Tipo: ${eq.type}`);
        doc.text(`Marca/Modelo: ${brandModel || "—"}`);
        doc.text(`Localização: ${eq.location || "—"}`);
        if (eq.notes) doc.text(`Observações: ${eq.notes}`);
        doc.moveDown(0.3);
      }
    }

    if (data.executionNotes) {
      drawLine();
      doc.fontSize(12).font(boldFont).text("Observações do Técnico");
      doc.moveDown(0.3);
      doc.fontSize(10).font(regularFont).text(data.executionNotes);
    }

    doc.moveDown(1);
    drawLine();

    doc.fontSize(12).font(boldFont).text("Status de Confirmação");
    doc.moveDown(0.3);
    doc.fontSize(10).font(regularFont);
    if (data.confirmedAt) {
      doc.text(`Serviço confirmado pelo cliente em ${data.confirmedAt.toLocaleDateString("pt-BR")} às ${data.confirmedAt.toLocaleTimeString("pt-BR")}`);
    } else {
      doc.text("Aguardando confirmação do cliente");
    }

    doc.moveDown(2);
    doc.fontSize(8).font(regularFont).fillColor("#666");
    doc.text(`Gerado pelo Ciclus em ${new Date().toLocaleString("pt-BR")}`, { align: "center" });
    doc.text(`ID da OS: ${serviceId}`, { align: "center" });

    doc.end();
  });
}
