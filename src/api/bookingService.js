import axiosClient from "./axiosClient";
import { BOOKING_API } from "../constants/apiEndpoints";

export const bookingService = {
  createBooking: (data) => axiosClient.post(BOOKING_API.CREATE, data),
  getTickets: (params) => axiosClient.get(BOOKING_API.TICKETS, { params }),
  getMyTickets: (params) => axiosClient.get(BOOKING_API.MY_TICKETS, { params }),
  getBookingById: (id) => axiosClient.get(BOOKING_API.DETAIL(id)),
  deleteBooking: (id) => axiosClient.delete(BOOKING_API.DETAIL(id)),
  payBooking: (id, data = {}) => axiosClient.put(BOOKING_API.PAY(id), data),
  getAllTickets: (params) => axiosClient.get(BOOKING_API.ADMIN_ALL_TICKETS, { params }),
};

export const {
  createBooking,
  getTickets,
  getMyTickets,
  getBookingById,
  deleteBooking,
  payBooking,
  getAllTickets,
} = bookingService;

export default bookingService;
