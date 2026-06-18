export interface ConsentResponse {
  dataConsentAt: Date | null;
  accepted: boolean;
}

export interface ExportDataResponse {
  exportedAt: string;
  user: {
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  };
  auditLogs: Array<{
    action: string;
    entityType: string;
    entityId: string;
    createdAt: Date;
  }>;
}
