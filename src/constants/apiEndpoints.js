export const BASE_URL = "https://fastapi-project-6qt6.onrender.com/api";

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
  DETAIL: (eventId) => `/events/${eventId}`,
  LEGACY_DETAIL: (eventId) => `/events/event/${eventId}`,
  SEATS: (eventId) => `/events/${eventId}/seats`,
};

export const MOVIE_API = {
  CREATE: "/films/",
  GET_ALL: "/films/",
  DETAIL: (filmId) => `/films/${filmId}`,
};

export const BOOKING_API = {
  CREATE: "/bookings/",
  TICKETS: "/bookings/tickets",
  MY_TICKETS: "/bookings/my-tickets",
  DETAIL: (bookingId) => `/bookings/${bookingId}`,
  PAY: (bookingId) => `/bookings/${bookingId}/pay`,
  ADMIN_ALL_TICKETS: "/bookings/admin/all-tickets",
};

export const AI_API = {
  CHAT: "/chat/",
  CHAT_NO_SLASH: "/chat",
};

export const API_ENDPOINTS = {
  USER: USER_API,
  ROOM: ROOM_API,
  EVENT: EVENT_API,
  MOVIE: MOVIE_API,
  FILM: MOVIE_API,
  BOOKING: BOOKING_API,
  AI: AI_API,
};
