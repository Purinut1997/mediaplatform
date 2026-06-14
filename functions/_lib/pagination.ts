export function readPagination(
  url: URL,
  { defaultPageSize = 50, minPageSize = 10, maxPageSize = 100 } = {},
) {
  const page = Math.max(1, Math.trunc(Number(url.searchParams.get('page') ?? 1)) || 1)
  const requestedSize = Math.trunc(Number(url.searchParams.get('pageSize') ?? defaultPageSize)) || defaultPageSize
  const pageSize = Math.min(maxPageSize, Math.max(minPageSize, requestedSize))
  return { page, pageSize, offset: (page - 1) * pageSize }
}
