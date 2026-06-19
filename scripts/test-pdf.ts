import PDFDocument from "pdfkit";
import { renderServiceReport } from "../src/integrations/pdf/templates/service-report";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sampleData = {
  serviceNumber: 1234,
  serviceType: "Manutenção Preventiva",
  scheduledAt: new Date("2026-06-15T08:00:00"),
  completedDate: new Date("2026-06-15T10:30:00"),
  durationMinutes: 150,
  status: "COMPLETED",
  technicianName: "João Silva",
  companyId: "company-123",
  companyName: "Empresa Exemplo Ltda",
  customerName: "Maria Oliveira",
  customerAddress: {
    street: "Rua das Flores",
    number: "123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
  },
  equipment: [
    {
      type: "Ar Condicionado Split",
      brand: "LG",
      model: "S9UV",
      location: "Sala de Reuniões",
      notes: "Filtro substituído",
    },
    {
      type: "Ar Condicionado Split",
      brand: "Samsung",
      model: "AR12",
      location: "Escritório 2",
      notes: "Gás recarregado",
    },
  ],
  executionNotes:
    "Serviço realizado conforme solicitado. Cliente orientado sobre manutenção preventiva.",
  confirmedAt: new Date("2026-06-14T14:00:00"),
};

const niches = [
  "AIR_CONDITIONING",
  "PEST_CONTROL",
  "WATER_TANK",
  "BUILDING_MAINTENANCE",
  "ELEVATOR",
  "GENERAL",
];

const outputDir = path.join(__dirname, "..", "output");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const niche of niches) {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = path.join(outputDir, `report-${niche.toLowerCase()}.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    renderServiceReport(doc, `service-${niche.toLowerCase()}`, {
      ...sampleData,
      companyNiche: niche,
    });

    doc.end();

    stream.on("finish", () => {
      console.log(`✓ PDF gerado: ${filePath}`);
      resolve();
    });

    stream.on("error", reject);
  });
}
