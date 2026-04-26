/**
 * Parse pagination parameters from a query object with safe upper bounds.
 * Hard cap is 100 rows per page so a malicious or buggy `?limit=999999`
 * cannot exhaust memory or starve the database connection pool.
 */
export interface ParsedPagination {
  page: number;
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query: { page?: unknown; limit?: unknown }): ParsedPagination {
  const rawPage = parseInt(String(query.page ?? '1'), 10);
  const rawLimit = parseInt(String(query.limit ?? DEFAULT_LIMIT), 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  return { page, limit, offset: (page - 1) * limit };
}
