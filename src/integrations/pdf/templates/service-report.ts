interface ReportConfig {
  title: string;
  equipmentLabel: string;
  showEquipmentTable: boolean;
  regulatoryFooter?: string;
}

const REPORT_CONFIG_BY_NICHE: Record<string, ReportConfig> = {
  AIR_CONDITIONING: {
    title: "Relatório de Manutenção — PMOC",
    equipmentLabel: "Equipamentos Atendidos",
    showEquipmentTable: true,
    regulatoryFooter:
      "Documento elaborado em conformidade com a Portaria GM/MS nº 3.523/1998, que institui o Plano de Manutenção, Operação e Controle (PMOC) de sistemas de climatização.",
  },
  PEST_CONTROL: {
    title: "Certificado de Dedetização",
    equipmentLabel: "Áreas Tratadas",
    showEquipmentTable: false,
    regulatoryFooter:
      "Produtos utilizados registrados na ANVISA conforme legislação vigente. Procedimento realizado conforme RDC nº 52/2009.",
  },
  WATER_TANK: {
    title: "Certificado de Limpeza de Caixa d'Água",
    equipmentLabel: "Reservatórios Atendidos",
    showEquipmentTable: true,
    regulatoryFooter:
      "Procedimento realizado conforme Portaria de Consolidação nº 5/2017 (Anexo XX), que dispõe sobre o controle de qualidade da água para consumo humano.",
  },
  BUILDING_MAINTENANCE: {
    title: "Relatório de Manutenção Predial",
    equipmentLabel: "Itens Atendidos",
    showEquipmentTable: true,
  },
  ELEVATOR: {
    title: "Relatório de Manutenção de Elevadores",
    equipmentLabel: "Equipamentos Atendidos",
    showEquipmentTable: true,
    regulatoryFooter:
      "Manutenção realizada em conformidade com a NBR 16083 (inspeção predial) e normas técnicas vigentes para equipamentos de transporte vertical.",
  },
  GENERAL: {
    title: "Ordem de Serviço",
    equipmentLabel: "Itens Atendidos",
    showEquipmentTable: true,
  },
};

function getReportConfig(niche?: string | null): ReportConfig {
  if (!niche) return REPORT_CONFIG_BY_NICHE.GENERAL!;
  return REPORT_CONFIG_BY_NICHE[niche] ?? REPORT_CONFIG_BY_NICHE.GENERAL!;
}

// ─── DADOS DE ENTRADA ───────────────────────────────────────────────────────

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
  companyNiche?: string | null;
  companyLogo?: string | null;
  companyDocument?: string | null;
  companyAddress?: Record<string, unknown> | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  customerName: string;
  customerAddress?: Record<string, unknown> | null;
  customerDocument?: string | null;
  customerDocumentType?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  createdAt?: Date;
  amount?: number | null;
  notes?: string | null;
  equipment: Array<{
    id?: string;
    type: string;
    brand?: string | null;
    model?: string | null;
    location?: string | null;
    notes?: string | null;
  }>;
  executionNotes?: string | null;
  confirmedAt?: Date | null;
  confirmedName?: string | null;
  confirmedDocument?: string | null;
  confirmedDocumentType?: string | null;
  confirmedIp?: string | null;
  confirmedUserAgent?: string | null;
  photos?: Array<{ url: string; caption?: string | null }>;
}

export function renderServiceReport(
  doc: PDFKit.PDFDocument,
  serviceId: string,
  data: ServiceReportData,
): void {
  const config = getReportConfig(data.companyNiche);

  const regularFont = "Helvetica";
  const boldFont = "Helvetica-Bold";

  doc.fontSize(10).font(regularFont);

  const pageWidth = doc.page?.width ? doc.page.width - 100 : 400;

  const drawLine = () => {
    const y = doc.y;
    doc
      .moveTo(50, y)
      .lineTo(pageWidth + 50, y)
      .stroke();
    doc.moveDown(0.5);
  };

  // ── Header ──
  doc.fontSize(20).font(boldFont).text(data.companyName, { align: "left" });

  doc.moveDown(0.5);

  // Título dinâmico por nicho
  doc.fontSize(16).font(boldFont).text(config.title, { align: "center" });
  doc
    .fontSize(11)
    .font(regularFont)
    .text(`OS Nº ${data.serviceNumber}`, { align: "center" });

  doc.moveDown(1);
  drawLine();

  // ── Dados do serviço ──
  doc.fontSize(12).font(boldFont).text("Dados do Serviço");
  doc.moveDown(0.3);
  doc.fontSize(10).font(regularFont);
  doc.text(`Tipo: ${data.serviceType || "—"}`);
  doc.text(`Data agendada: ${data.scheduledAt.toLocaleDateString("pt-BR")}`);
  doc.text(
    `Data de execução: ${data.completedDate ? data.completedDate.toLocaleDateString("pt-BR") : "—"}`,
  );
  doc.text(
    `Duração: ${data.durationMinutes ? `${data.durationMinutes} min` : "—"}`,
  );
  doc.text(`Técnico: ${data.technicianName || "—"}`);

  doc.moveDown(1);
  drawLine();

  // ── Dados do cliente ──
  doc.fontSize(12).font(boldFont).text("Dados do Cliente");
  doc.moveDown(0.3);
  doc.fontSize(10).font(regularFont);
  doc.text(`Nome: ${data.customerName}`);
  if (data.customerAddress) {
    const addr = data.customerAddress as Record<string, string>;
    doc.text(
      `Endereço: ${addr.street || ""}, ${addr.number || ""}${
        addr.neighborhood ? ` - ${addr.neighborhood}` : ""
      }${addr.city ? ` - ${addr.city}` : ""}${addr.state ? `/${addr.state}` : ""}`,
    );
  }

  doc.moveDown(1);
  drawLine();

  // ── Equipamentos / itens atendidos (label e exibição dinâmicos por nicho) ──
  if (data.equipment.length > 0 && config.showEquipmentTable) {
    doc.fontSize(12).font(boldFont).text(config.equipmentLabel);
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
  } else if (data.equipment.length > 0 && !config.showEquipmentTable) {
    // Nichos como dedetização: lista simples em vez de tabela detalhada
    doc.fontSize(12).font(boldFont).text(config.equipmentLabel);
    doc.moveDown(0.3);
    doc.fontSize(10).font(regularFont);
    const locations = data.equipment
      .map((eq) => eq.location || eq.type)
      .join(", ");
    doc.text(locations);
  }

  // ── Observações do técnico ──
  if (data.executionNotes) {
    doc.moveDown(1);
    drawLine();
    doc.fontSize(12).font(boldFont).text("Observações do Técnico");
    doc.moveDown(0.3);
    doc.fontSize(10).font(regularFont).text(data.executionNotes);
  }

  doc.moveDown(1);
  drawLine();

  // ── Assinatura digital ──
  doc.fontSize(12).font(boldFont).text("Assinatura Digital");
  doc.moveDown(0.3);
  doc.fontSize(10).font(regularFont);
  if (data.confirmedAt) {
    doc.text(`Confirmado por: ${data.confirmedName || "—"}`);
    if (data.confirmedDocument) {
      const docLabel = data.confirmedDocumentType === "CNPJ" ? "CNPJ" : "CPF";
      doc.text(`${docLabel}: ${data.confirmedDocument}`);
    }
    doc.text(
      `Data e hora: ${data.confirmedAt.toLocaleDateString("pt-BR")} às ${data.confirmedAt.toLocaleTimeString("pt-BR")}`,
    );
    doc.text(`IP: ${data.confirmedIp || "—"}`);
    if (data.confirmedUserAgent) {
      doc.text(`Dispositivo: ${data.confirmedUserAgent}`);
    }
  } else {
    doc.text("Aguardando confirmação do cliente");
  }

  // ── Rodapé regulatório (só aparece se o nicho tiver — campo opcional) ──
  if (config.regulatoryFooter) {
    doc.moveDown(1);
    drawLine();
    doc
      .fontSize(8)
      .font(regularFont)
      .fillColor("#444")
      .text(config.regulatoryFooter, { align: "justify" });
    doc.fillColor("#000");
  }

  doc.moveDown(2);
  doc.fontSize(8).font(regularFont).fillColor("#666");
  doc.text(`Gerado pelo Ciclus em ${new Date().toLocaleString("pt-BR")}`, {
    align: "center",
  });
  doc.text(`ID da OS: ${serviceId}`, { align: "center" });
}
