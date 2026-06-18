export interface ContractResponse {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerAddress: unknown | null;
  serviceType?: string;
  frequency: string;
  startDate: Date;
  endDate: Date;
  nextVisitDate: Date | null;
  value: number;
  responsibleEmployeeId: string | null;
  responsibleEmployeeName: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
