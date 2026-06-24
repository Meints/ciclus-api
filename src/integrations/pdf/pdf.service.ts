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

function formatDateBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatTimeBR(d: Date): string {
  return d.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function getServiceTypeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return SERVICE_TYPE_LABELS[value] ?? value;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "";
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function getAddressPart(
  addr: Record<string, unknown> | null | undefined,
  key: string,
): string {
  if (!addr) return "";
  const v = addr[key];
  return v != null ? String(v) : "";
}

export async function renderPdfFromHtml(data: ServiceReportData): Promise<Buffer> {
  const templatePath = path.resolve(
    __dirname,
    "templates",
    "service-report.html",
  );
  const html = await fs.readFile(templatePath, "utf-8");

  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const addr = data.customerAddress as Record<string, string> | null | undefined;
  const compAddr = data.companyAddress as Record<string, string> | null | undefined;

  const empresaData = {
    nome: data.companyName,
    cnpj: data.companyDocument ?? "",
    endereco: compAddr
      ? `${getAddressPart(compAddr, "street")}, ${getAddressPart(compAddr, "number")}`
      : "",
    cidade_estado: compAddr
      ? `${getAddressPart(compAddr, "city")} – ${getAddressPart(compAddr, "state")}`
      : "",
    telefone: data.companyPhone ?? "",
    email: data.companyEmail ?? "",
    logo_url: data.companyLogo ?? "",
  };

  const scheduledAt = new Date(data.scheduledAt);
  const createdAt = data.createdAt ? new Date(data.createdAt) : scheduledAt;

  const materiais = data.equipment.map((eq) => ({
    tipo: [eq.type, eq.brand, eq.model].filter(Boolean).join(" / "),
    quantidade: "",
    valor: "",
    observacoes: eq.notes ?? "",
  }));

  const descricao = [
    data.serviceType ? `Tipo de serviço: ${getServiceTypeLabel(data.serviceType)}` : "",
    data.executionNotes ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  const osData = {
    numero: `OS Nº ${String(data.serviceNumber).padStart(4, "0")}`,
    data_solicitacao: formatDateBR(createdAt),
    horario_solicitacao: formatTimeBR(createdAt),
    data_execucao: formatDateBR(scheduledAt),
    horario_execucao: formatTimeBR(scheduledAt),
    cliente: {
      nome: data.customerName,
      cpf_cnpj: data.customerDocument ?? "",
      endereco: addr
        ? `${getAddressPart(addr, "street")}, ${getAddressPart(addr, "number")}`
        : "",
      bairro: getAddressPart(addr, "neighborhood"),
      cidade_estado: addr
        ? `${getAddressPart(addr, "city")} – ${getAddressPart(addr, "state")}`
        : "",
      cep: getAddressPart(addr, "zipCode"),
      telefone: data.customerPhone ?? "",
      email: data.customerEmail ?? "",
    },
    descricao_servico: descricao || "—",
    materiais,
    observacoes_gerais: data.notes ?? "",
    desconto: "",
    total: formatCurrency(data.amount),
    garantia_dias: 90,
    nome_responsavel: data.technicianName ?? "—",
    fotos: (data.photos ?? []).map((f) => ({ url: f.url, caption: f.caption ?? "" })),
  };

  await page.evaluate(
    (args: { empresa: typeof empresaData; os: typeof osData }) => {
      (window as any).configurarEmpresa(args.empresa);
      (window as any).preencherOS(args.os);
    },
    { empresa: empresaData, os: osData },
  );

  await new Promise((r) => setTimeout(r, 200));

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "8mm", bottom: "8mm", left: "8mm", right: "8mm" },
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
