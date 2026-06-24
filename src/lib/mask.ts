export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

export function maskCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return "**.***.***/***-**";
  return `**.***.${digits.slice(3, 6)}/${digits.slice(6, 9)}-**`;
}

export function maskDocument(document: string, type: "CPF" | "CNPJ"): string {
  if (type === "CPF") return maskCpf(document);
  return maskCnpj(document);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  const lastFour = digits.slice(-4);
  const ddd = digits.slice(0, 2);
  return `(${ddd}) 9****-${lastFour}`;
}

export interface CustomerRaw {
  id: string;
  name: string;
  fantasyName?: string | null;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  documentType?: string | null;
  address?: Record<string, unknown> | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerMasked {
  id: string;
  name: string;
  fantasyName: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  isActive: boolean;
}

export interface CustomerTechnicianView {
  id: string;
  name: string;
  address: Record<string, unknown> | null;
}

export function maskCustomerForList(customer: CustomerRaw): CustomerMasked {
  return {
    id: customer.id,
    name: customer.name,
    fantasyName: customer.fantasyName ?? null,
    email: customer.email ? maskEmail(customer.email) : null,
    phone: customer.phone ? maskPhone(customer.phone) : null,
    document: customer.document
      ? maskDocument(customer.document, (customer.documentType as "CPF" | "CNPJ") || "CNPJ")
      : null,
    isActive: customer.isActive ?? true,
  };
}

export function maskCustomerForTechnician(customer: CustomerRaw): CustomerTechnicianView {
  return {
    id: customer.id,
    name: customer.name,
    address: customer.address ?? null,
  };
}

export function anonymizeIp(ip: string): string {
  if (!ip || ip === "::1") return "0.0.0.0";

  if (ip.startsWith("::ffff:")) {
    const ipv4Part = ip.replace("::ffff:", "");
    const parts = ipv4Part.split(".");
    if (parts.length === 4 && parts[0] && parts[1]) {
      return `${parts[0]}.${parts[1]}.0.0`;
    }
    return "0.0.0.0";
  }

  const parts = ip.split(".");
  if (parts.length === 4 && parts[0] && parts[1]) {
    return `${parts[0]}.${parts[1]}.0.0`;
  }

  return "0.0.0.0";
}
