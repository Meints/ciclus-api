export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(query: {
  page?: string;
  limit?: string;
}): PaginationParams {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10) || 20));
  return { page, limit };
}

export function buildMeta(total: number, params: PaginationParams): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit) || 1,
  };
}

export function buildSkip(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}
