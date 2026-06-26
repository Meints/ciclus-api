import { vi } from "vitest";

// Provide env vars required by @t3-oss/env-core before any module loads
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.DIRECT_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-chars-long!";
process.env.COOKIE_SECRET = "test-cookie-secret-at-least-32-chars!";
process.env.CORS_ORIGIN = "http://localhost:3000";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

// Global mocks for heavy dependencies
vi.mock("../lib/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../integrations/email/email.service", () => ({
  sendForgotPasswordEmail: vi.fn().mockResolvedValue(undefined),
  sendServiceConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../integrations/whatsapp/whatsapp.service", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue(true),
  sendConfirmationWhatsApp: vi.fn().mockResolvedValue(true),
}));
vi.mock("../integrations/pdf/pdf.service", () => ({
  generateServiceReport: vi.fn().mockResolvedValue("https://storage.example.com/report.pdf"),
  generateServiceReportBuffer: vi.fn().mockResolvedValue(Buffer.from("pdf")),
}));
vi.mock("../integrations/storage/storage.service", () => ({
  uploadFile: vi.fn().mockResolvedValue("https://storage.example.com/file"),
}));
