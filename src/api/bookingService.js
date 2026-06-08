import axiosClient from "./axiosClient";
import { BOOKING_API } from "../constants/apiEndpoints";

export const bookingService = {
  createBooking: (data) => axiosClient.post(BOOKING_API.CREATE, data),
  getMyBookings: (params) => axiosClient.get(BOOKING_API.MY_BOOKINGS, { params }),
  getMyTickets: (params) => axiosClient.get(BOOKING_API.MY_TICKETS, { params }),
  getBookingById: (id) => axiosClient.get(BOOKING_API.DETAIL(id)),
  cancelBooking: (id) => axiosClient.delete(BOOKING_API.DETAIL(id)),
  getAllBookings: (params) => axiosClient.get(BOOKING_API.ADMIN_ALL, { params }),
  getAdminBookingById: (id) =>
    axiosClient.get(BOOKING_API.ADMIN_DETAIL(id)),
  cleanupExpired: (limit = 100) =>
    axiosClient.post(BOOKING_API.CLEANUP_EXPIRED, null, { params: { limit } }),
  useTicket: (qrToken) => axiosClient.post(BOOKING_API.USE_TICKET(qrToken)),
};

export default bookingService;
