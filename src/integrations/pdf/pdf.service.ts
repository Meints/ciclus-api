import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import puppeteer, { type Browser } from "puppeteer-core";
import { uploadFile } from "../storage/storage.service";
import { env } from "../../config/env";
import type { ServiceReportData } from "./templates/service-report";

export type { ServiceReportData } from "./templates/service-report";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME_PATH =
  env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.connected) return browserInstance;
  if (browserInstance) await browserInstance.close().catch(() => {});
  browserInstance = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return browserInstance;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  PREVENTIVE_MAINTENANCE: "Manutenção preventiva",
  CORRECTIVE_MAINTENANCE: "Manutenção corretiva",
  INSTALLATION: "Instalação",
  UNINSTALLATION: "Desinstalação",
  GAS_RECHARGE: "Recarga de gás",
  CLEANING: "Higienização / Limpeza",
  PMOC: "PMOC — Plano de Manutenção, Operação e Controle",
  INSPECTION: "Vistoria técnica",
  COCKROACH_CONTROL: "Dedetização — baratas",
  RODENT_CONTROL: "Desratização — ratos e roedores",
  TERMITE_CONTROL: "Descupinização — cupins",
  BED_BUG_CONTROL: "Dedetização — percevejos",
  MOSQUITO_CONTROL: "Dedetização — mosquitos e dengue",
  GENERAL_DISINFECTION: "Desinfecção geral",
  SANITIZATION: "Sanitização de ambientes",
  DISINFECTION: "Desinfecção",
  REPAIR: "Reparo estrutural",
  ELECTRICAL: "Manutenção elétrica",
  HYDRAULIC: "Manutenção hidráulica",
  PAINTING: "Pintura",
  GARDEN: "Jardinagem",
  MODERNIZATION: "Modernização",
  SERVICE: "Serviço geral",
  MAINTENANCE: "Manutenção",
  OTHER: "Outro",
};

const REPORT_CONFIG: Record<string, { title: string; equipmentLabel: string; showEquipmentTable: boolean; regulatoryFooter?: string }> = {
  AIR_CONDITIONING: {
    title: "Relatório de Manutenção — PMOC",
    equipmentLabel: "Equipamentos Atendidos",
    showEquipmentTable: true,
    regulatoryFooter: "Documento elaborado em conformidade com a Portaria GM/MS nº 3.523/1998, que institui o Plano de Manutenção, Operação e Controle (PMOC) de sistemas de climatização.",
  },
  PEST_CONTROL: {
    title: "Certificado de Dedetização",
    equipmentLabel: "Áreas Tratadas",
    showEquipmentTable: false,
    regulatoryFooter: "Produtos utilizados registrados na ANVISA conforme legislação vigente. Procedimento realizado conforme RDC nº 52/2009.",
  },
  WATER_TANK: {
    title: "Certificado de Limpeza de Caixa d'Água",
    equipmentLabel: "Reservatórios Atendidos",
    showEquipmentTable: true,
    regulatoryFooter: "Procedimento realizado conforme Portaria de Consolidação nº 5/2017 (Anexo XX), que dispõe sobre o controle de qualidade da água para consumo humano.",
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
    regulatoryFooter: "Manutenção realizada em conformidade com a NBR 16083 (inspeção predial) e normas técnicas vigentes para equipamentos de transporte vertical.",
  },
  GENERAL: {
    title: "Ordem de Serviço",
    equipmentLabel: "Itens Atendidos",
    showEquipmentTable: true,
  },
};

function getServiceTypeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return SERVICE_TYPE_LABELS[value] ?? value;
}

function getReportConfig(niche?: string | null) {
  if (!niche) return REPORT_CONFIG["GENERAL"]!;
  return REPORT_CONFIG[niche] ?? REPORT_CONFIG["GENERAL"]!;
}

function getAddrPart(addr: Record<string, unknown> | null | undefined, key: string): string {
  if (!addr) return "";
  const v = addr[key];
  return v != null ? String(v) : "";
}

function buildAddress(addr: Record<string, unknown> | null | undefined): string {
  if (!addr) return "";
  const parts: string[] = [];
  const street = getAddrPart(addr, "street");
  const number = getAddrPart(addr, "number");
  if (street) parts.push(number ? `${street}, ${number}` : street);
  const neighborhood = getAddrPart(addr, "neighborhood");
  if (neighborhood) parts.push(neighborhood);
  const city = getAddrPart(addr, "city");
  const state = getAddrPart(addr, "state");
  if (city && state) parts.push(`${city}/${state}`);
  else if (city) parts.push(city);
  return parts.join(" — ");
}

export async function renderPdfFromHtml(data: ServiceReportData): Promise<Buffer> {
  const templatePath = path.resolve(__dirname, "templates", "service-report.html");
  const html = await fs.readFile(templatePath, "utf-8");

  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const config = getReportConfig(data.companyNiche);
  const compAddr = data.companyAddress as Record<string, string> | null | undefined;
  const addr = data.customerAddress as Record<string, string> | null | undefined;

  const companyCityState = compAddr
    ? [getAddrPart(compAddr, "city"), getAddrPart(compAddr, "state")].filter(Boolean).join("/")
    : "";

  const empresaData = {
    nome: data.companyName,
    cnpj: data.companyDocument ?? null,
    telefone: data.companyPhone ?? null,
    email: data.companyEmail ?? null,
    cidade_estado: companyCityState || null,
    logo_url: data.companyLogo ?? null,
  };

  const execDate = data.completedDate ?? data.scheduledAt;

  const osData = {
    numero: data.serviceNumber,
    tipo_doc: config.title,
    tipo_servico: getServiceTypeLabel(data.serviceType),
    data_agendada: data.scheduledAt instanceof Date ? data.scheduledAt.toISOString() : String(data.scheduledAt),
    data_execucao: execDate instanceof Date ? execDate.toISOString() : String(execDate),
    duracao_minutos: data.durationMinutes ?? null,
    tecnico: data.technicianName ?? null,
    cliente: {
      nome: data.customerName,
      documento: data.customerDocument ?? null,
      tipo_doc: data.customerDocumentType ?? "CPF",
      endereco: buildAddress(addr),
      telefone: data.customerPhone ?? null,
      email: data.customerEmail ?? null,
    },
    equipment_label: config.equipmentLabel,
    equipment_table: config.showEquipmentTable,
    equipamentos: data.equipment.map((eq) => ({
      tipo: eq.type,
      marca_modelo: [eq.brand, eq.model].filter(Boolean).join(" / ") || null,
      localizacao: eq.location ?? null,
      observacao: eq.notes ?? null,
    })),
    observacoes: data.executionNotes ?? null,
    fotos: (data.photos ?? []).map((f) => ({ url: f.url })),
    confirmacao: data.confirmedAt
      ? {
          confirmado_em: data.confirmedAt instanceof Date ? data.confirmedAt.toISOString() : String(data.confirmedAt),
          nome: data.confirmedName ?? null,
          documento: data.confirmedDocument ?? null,
          tipo_doc: data.confirmedDocumentType ?? "CPF",
          ip: data.confirmedIp ?? null,
        }
      : null,
    rodape_regulatorio: config.regulatoryFooter ?? null,
  };

  await page.evaluate(
    (args: { empresa: typeof empresaData; os: typeof osData }) => {
      (window as any).configurarEmpresa(args.empresa);
      (window as any).preencherOS(args.os);
    },
    { empresa: empresaData, os: osData },
  );

  // Aguarda imagens carregarem antes de gerar o PDF
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll("img"));
    if (imgs.length === 0) return;
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }),
      ),
    );
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    printBackground: true,
  });

  await page.close();
  return Buffer.from(pdfBuffer);
}

export async function generateServiceReportBuffer(
  _serviceId: string,
  data: ServiceReportData,
): Promise<Buffer> {
  return renderPdfFromHtml(data);
}

export async function generateServiceReport(
  serviceId: string,
  data: ServiceReportData,
): Promise<string> {
  const pdfBuffer = await renderPdfFromHtml(data);

  try {
    const url = await uploadFile(
      env.SUPABASE_STORAGE_BUCKET,
      `companies/${data.companyId}/reports/${serviceId}.pdf`,
      pdfBuffer,
      "application/pdf",
    );
    return url;
  } catch (err) {
    console.error("[generateServiceReport] Upload failed:", err);
    return "";
  }
}
