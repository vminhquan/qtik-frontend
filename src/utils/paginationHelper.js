const LIST_KEYS = ["items", "results", "data", "films", "movies", "tickets", "bookings", "users"];
const TOTAL_KEYS = ["total", "count", "total_count", "totalCount", "total_items", "totalItems", "total_records"];
const HAS_NEXT_KEYS = ["has_next", "hasNext"];

const asObject = (value) => (
  value && typeof value === "object" && !Array.isArray(value) ? value : null
);

const toNonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const getContainers = (response) => {
  const root = asObject(response);
  if (!root) return [];

  const data = asObject(root.data);
  return [
    root,
    data,
    asObject(root.pagination),
    asObject(root.meta),
    asObject(data?.pagination),
    asObject(data?.meta),
  ].filter(Boolean);
};

const findArray = (response, listKeys) => {
  if (Array.isArray(response)) return response;

  const containers = getContainers(response);
  for (const container of containers) {
    for (const key of listKeys) {
      if (Array.isArray(container[key])) return container[key];
    }
  }

  return [];
};

const findNumber = (containers, keys) => {
  for (const container of containers) {
    for (const key of keys) {
      const value = toNonNegativeNumber(container[key]);
      if (value !== null) return value;
    }
  }
  return null;
};

const findBoolean = (containers, keys) => {
  for (const container of containers) {
    for (const key of keys) {
      if (typeof container[key] === "boolean") return container[key];
    }
  }
  return null;
};

export const normalizePaginatedResponse = (response, listKeys = []) => {
  const containers = getContainers(response);
  const total = findNumber(containers, TOTAL_KEYS);
  const totalPages = findNumber(containers, ["total_pages", "totalPages", "pages"]);
  const hasNext = findBoolean(containers, HAS_NEXT_KEYS);

  return {
    items: findArray(response, [...listKeys, ...LIST_KEYS]),
    total,
    totalPages,
    hasNext,
    hasExplicitTotal: total !== null || totalPages !== null,
  };
};

export const resolvePaginatedResponse = async ({
  response,
  page,
  limit,
  listKeys = [],
  probeNextPage,
}) => {
  const normalized = normalizePaginatedResponse(response, listKeys);
  const items = normalized.items.slice(0, limit);

  if (normalized.total !== null) {
    return { ...normalized, items, total: normalized.total };
  }

  if (normalized.totalPages !== null) {
    return { ...normalized, items, total: normalized.totalPages * limit };
  }

  let hasNext = normalized.hasNext;
  let nextItemCount = null;
  if (hasNext === null && normalized.items.length >= limit && probeNextPage) {
    try {
      const nextResponse = await probeNextPage();
      nextItemCount = normalizePaginatedResponse(nextResponse, listKeys).items.length;
      hasNext = nextItemCount > 0;
    } catch {
      hasNext = normalized.items.length >= limit;
    }
  }

  const currentOffset = Math.max(page - 1, 0) * limit;
  const inferredTotal =
    nextItemCount !== null && nextItemCount < limit
      ? currentOffset + items.length + nextItemCount
      : currentOffset + items.length + (hasNext ? 1 : 0);

  return {
    ...normalized,
    items,
    total: inferredTotal,
    hasNext: Boolean(hasNext),
  };
};

export const buildNextPageProbeParams = (params, page, limit) => ({
  ...params,
  page: page + 1,
  skip: page * limit,
  limit,
});
