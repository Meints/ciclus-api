export interface CustomerResponse {
  id: string;
  companyId: string;
  legalName: string;
  tradeName: string | null;
  name: string;
  fantasyName: string | null;
  document: string | null;
  documentType: string | null;
  email: string | null;
  phone: string | null;
  address: unknown | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
  isActive: boolean;
  contractsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
