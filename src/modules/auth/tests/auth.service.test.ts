import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";
import bcrypt from "bcrypt";

vi.mock("../../../config/prisma");
vi.mock("bcrypt");

import { prisma } from "../../../config/prisma";
import * as authService from "../auth.service";

const prismaMock = prisma as ReturnType<typeof import("vitest-mock-extended").mockDeep<import("../../../../generated/prisma/client").PrismaClient>>;

const mockCompany = { id: "company-1", name: "Test Co", isActive: true, niche: null };
const mockUser = {
  id: "user-1", name: "João", email: "joao@test.com", role: "OWNER",
  companyId: "company-1", isActive: true, deletedAt: null,
  passwordHash: "hashed", refreshTokenHash: null,
  resetPasswordToken: null, resetPasswordExpiresAt: null,
  lastLoginAt: null, createdAt: new Date(), updatedAt: new Date(),
  company: mockCompany,
};

beforeEach(() => {
  mockReset(prismaMock);
  vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
  vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
});

describe("auth.service", () => {
  describe("register", () => {
    it("cria empresa e usuário com sucesso", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.company.create.mockResolvedValue(mockCompany as any);
      prismaMock.user.create.mockResolvedValue({ ...mockUser, company: mockCompany } as any);
      prismaMock.user.update.mockResolvedValue(mockUser as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await authService.register("João", "joao@test.com", "senha123", "Test Co");

      expect(result.user).toBeDefined();
      expect(prismaMock.company.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: "Test Co" } }),
      );
    });

    it("lança erro se e-mail já cadastrado", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(
        authService.register("João", "joao@test.com", "senha123", "Test Co"),
      ).rejects.toMatchObject({ statusCode: 409, code: "EMAIL_ALREADY_EXISTS" });
    });
  });

  describe("login", () => {
    it("retorna user e refreshToken com credenciais válidas", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, company: mockCompany } as any);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, company: mockCompany } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await authService.login("joao@test.com", "senha123");

      expect(result.user.email).toBe("joao@test.com");
      expect(result.refreshToken).toBeDefined();
    });

    it("lança erro se usuário não existe", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login("x@y.com", "pass")).rejects.toMatchObject({
        statusCode: 401,
        code: "UNAUTHORIZED",
      });
    });

    it("lança erro se senha incorreta", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, company: mockCompany } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(authService.login("joao@test.com", "errada")).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("lança erro se empresa inativa", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        company: { ...mockCompany, isActive: false },
      } as any);

      await expect(authService.login("joao@test.com", "senha123")).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("lança erro se usuário deletado", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
        company: mockCompany,
      } as any);

      await expect(authService.login("joao@test.com", "senha123")).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe("logout", () => {
    it("limpa o refreshTokenHash do usuário", async () => {
      prismaMock.user.update.mockResolvedValue(mockUser as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await authService.logout("user-1", "company-1");

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { refreshTokenHash: null } }),
      );
    });
  });

  describe("changePassword", () => {
    it("altera senha com sucesso", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.user.update.mockResolvedValue(mockUser as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await authService.changePassword("user-1", "atual", "nova");

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ refreshTokenHash: null }),
        }),
      );
    });

    it("lança erro se usuário não encontrado", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.changePassword("x", "a", "b")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança erro se senha atual incorreta", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(authService.changePassword("user-1", "errada", "nova")).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_PASSWORD",
      });
    });
  });

  describe("forgotPassword", () => {
    it("não lança erro se e-mail não encontrado (proteção anti-enumeração)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.forgotPassword("nao@existe.com")).resolves.toBeUndefined();
    });

    it("atualiza token de reset quando usuário existe", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.user.update.mockResolvedValue(mockUser as any);

      await authService.forgotPassword("joao@test.com");

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resetPasswordToken: expect.any(String),
            resetPasswordExpiresAt: expect.any(Date),
          }),
        }),
      );
    });
  });
});
