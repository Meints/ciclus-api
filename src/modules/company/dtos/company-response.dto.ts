export interface CompanyResponse {
  id: string;
  name: string;
  fantasyName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  niche: string;
  plan: string;
  logoUrl: string | null;
  address: unknown | null;
  isActive: boolean;
  dataConsentAt: Date | null;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
