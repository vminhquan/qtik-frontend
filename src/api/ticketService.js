import { bookingService } from "./bookingService";

export const ticketService = {
  getTickets: bookingService.getTickets,
  getMyTickets: bookingService.getMyTickets,
  getAllTickets: bookingService.getAllTickets,
  getTicketByBookingId: bookingService.getBookingById,
};

export default ticketService;
