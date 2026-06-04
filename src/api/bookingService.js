import axiosClient from "./axiosClient";
import { BOOKING_API } from "../constants/apiEndpoints";

export const bookingService = {
  createBooking: (data) => axiosClient.post(BOOKING_API.CREATE, data),
  getMyTickets: (params) => axiosClient.get(BOOKING_API.MY_TICKETS, { params }),
  getBookingById: (id) => axiosClient.get(BOOKING_API.DETAIL(id)),
  deleteBooking: (id) => axiosClient.delete(BOOKING_API.DETAIL(id)),
  payBooking: (id, data = {}) => axiosClient.put(BOOKING_API.PAY(id), data),
  getAllTickets: (params) => axiosClient.get(BOOKING_API.ADMIN_ALL_TICKETS, { params }),
};

export default bookingService;
