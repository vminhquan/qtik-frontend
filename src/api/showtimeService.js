import { eventService } from "./eventService";

export const showtimeService = {
  createShowtime: eventService.createEvent,
  getShowtimes: eventService.getEvents,
  getShowtimeById: eventService.getEventById,
  updateShowtime: eventService.updateEvent,
  deleteShowtime: eventService.deleteEvent,
  getShowtimeSeats: eventService.getEventSeats,
};

export default showtimeService;
