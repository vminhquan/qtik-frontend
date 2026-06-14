export const BASE_URL = "https://api.qtik.io.vn/api";

export const USER_API = {
  REGISTER: "/users/register",
  VERIFY: "/users/verify-otp",
  GET_ALL: "/users/",
  DETAIL: (userId) => `/users/${userId}`,
  ME: "/users/me",
  LOGIN: "/users/login",
  REFRESH_TOKEN: "/users/refresh",
  LOGOUT: "/users/logout",
  FORGOT_PASSWORD: "/users/forgot-password",
  RESET_PASSWORD: "/users/reset-password",
  RESEND_OTP: "/users/resend-otp",
};

export const ROOM_API = {
  CREATE: "/rooms/",
  GET_ALL: "/rooms/",
  DETAIL: (roomId) => `/rooms/${roomId}`,
};

export const EVENT_API = {
  CREATE: "/events/",
  GET_ALL: "/events/",
  SCHEDULE: "/events/schedule",
  DETAIL: (eventId) => `/events/${eventId}`,
  SEATS: (eventId) => `/events/${eventId}/seats`,
};

export const MOVIE_API = {
  CREATE: "/films/",
  GET_ALL: "/films/",
  DETAIL: (filmId) => `/films/${filmId}`,
};

export const BOOKING_API = {
  CREATE: "/bookings/",
  MY_BOOKINGS: "/bookings/me",
  MY_TICKETS: "/bookings/my-tickets",
  ADMIN_ALL: "/bookings/admin/all",
  ADMIN_DETAIL: (bookingId) => `/bookings/admin/${bookingId}`,
  CLEANUP_EXPIRED: "/bookings/admin/cleanup-expired",
  USE_TICKET: (qrToken) =>
    `/bookings/tickets/${encodeURIComponent(qrToken)}/use`,
  DETAIL: (bookingId) => `/bookings/${bookingId}`,
};

export const ORDER_API = {
  MY_ORDERS: "/orders/me",
  ADMIN_ALL: "/orders/admin/all",
  DETAIL: (orderId) => `/orders/${orderId}`,
  CANCEL: (orderId) => `/orders/${orderId}/cancel`,
};

export const PAYMENT_API = {
  CREATE_LINK: "/payments/links",
  BY_ORDER: (orderId) => `/payments/orders/${orderId}`,
  RECONCILE_BY_PROVIDER_ORDER_CODE: (providerOrderCode) =>
    `/payments/reconcile/provider-order-code/${encodeURIComponent(providerOrderCode)}`,
  RECONCILE_BY_PAYMENT_LINK_ID: (paymentLinkId) =>
    `/payments/reconcile/payment-link/${encodeURIComponent(paymentLinkId)}`,
  DETAIL: (paymentId) => `/payments/${paymentId}`,
};

export const AI_API = {
  CHAT: "/chat/",
};
