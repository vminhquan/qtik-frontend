export const PENDING_ORDER_STORAGE_KEY = "qtik_pending_order_id";

export const unwrapData = (response) => response?.data || response;

export const savePendingPaymentContext = (payment) => {
  if (typeof window === "undefined") return;

  const orderId = payment?.order_id || payment?.orderId;
  if (!orderId) return;

  window.sessionStorage.setItem(
    PENDING_ORDER_STORAGE_KEY,
    JSON.stringify({
      orderId: String(orderId),
      paymentId: payment?.payment_id ? String(payment.payment_id) : null,
      paymentLinkId: payment?.payment_link_id
        ? String(payment.payment_link_id)
        : null,
      providerOrderCode:
        payment?.order_code != null ? String(payment.order_code) : null,
    }),
  );
};

export const getPendingPaymentContext = () => {
  if (typeof window === "undefined") return null;

  const storedValue = window.sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
  if (!storedValue) return null;

  try {
    const context = JSON.parse(storedValue);
    if (context && typeof context === "object" && context.orderId) {
      return context;
    }
  } catch {
    // Support the previous format, which stored only the Order UUID.
  }

  return { orderId: storedValue };
};

export const clearPendingPaymentContext = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
};

export const normalizeList = (response, keys = []) => {
  const payload = unwrapData(response);
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return payload?.items || payload?.results || [];
};

export const getBookingId = (booking) =>
  booking?.id || booking?.booking_id || booking?._id;

export const getBookingItems = (booking) =>
  booking?.booking_items || booking?.bookingItems || [];

export const getBookingItemSeatId = (item) =>
  item?.seat_id || item?.seatId || item?.seat?.id;

export const getBookingTickets = (booking) =>
  getBookingItems(booking)
    .map((item) => item?.ticket)
    .filter(Boolean);

export const getBookingAmount = (booking) =>
  getBookingItems(booking).reduce(
    (total, item) => total + Number(item?.unit_price || 0),
    0,
  );

const parseWallClockAsUtc = (value) => {
  if (!value) return Number.NaN;
  if (typeof value !== "string") return new Date(value).getTime();

  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`).getTime();
};

export const getBookingHoldExpiryTime = (booking, order) => {
  const holdWallClock = parseWallClockAsUtc(booking?.hold_expires_at);
  const bookingCreatedWallClock = parseWallClockAsUtc(booking?.created_at);
  const orderCreatedAt = new Date(order?.created_at || "").getTime();
  const holdDuration = holdWallClock - bookingCreatedWallClock;

  if (
    Number.isFinite(orderCreatedAt) &&
    Number.isFinite(holdDuration) &&
    holdDuration >= 0 &&
    holdDuration <= 24 * 60 * 60 * 1000
  ) {
    return orderCreatedAt + holdDuration;
  }

  return new Date(booking?.hold_expires_at || "").getTime();
};

export const getOrderId = (order) => order?.id || order?.order_id || order?._id;

export const getOrderStatus = (order) =>
  String(order?.status || "pending").toLowerCase();

export const getBookingStatus = (booking) =>
  String(booking?.status || "held").toLowerCase();

export const getPaymentStatus = (payment) =>
  String(payment?.status || "pending").toLowerCase();

const STATUS_LABELS = {
  pending: "Chờ thanh toán",
  held: "Đang giữ ghế",
  confirmed: "Đã xác nhận",
  paid: "Đã thanh toán",
  issued: "Có hiệu lực",
  used: "Đã sử dụng",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
  expired: "Đã hết hạn",
};

export const getStatusLabel = (status) => {
  const normalized = String(status || "").toLowerCase();
  return STATUS_LABELS[normalized] || normalized || "Chưa xác định";
};

export const formatCurrency = (value, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatDateTime = (value, fallback = "Đang cập nhật") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
