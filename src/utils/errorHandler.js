const DEFAULT_MESSAGE = "Có lỗi xảy ra. Vui lòng thử lại.";

export const getErrorMessage = (error, fallback = DEFAULT_MESSAGE) => {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (Array.isArray(data?.detail)) return data.detail.map((item) => item.msg).join(", ");
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;
  if (typeof error?.message === "string") return error.message;

  return fallback;
};

export const normalizeApiError = (error) => ({
  status: error?.response?.status || 0,
  message: getErrorMessage(error),
  raw: error,
});

export const buildListParams = ({ page = 1, limit = 10, search = "", filters = {} } = {}) => ({
  page,
  limit,
  skip: Math.max(page - 1, 0) * limit,
  search: search.trim() || undefined,
  ...filters,
});
