import axiosClient from "./axiosClient";
import { EVENT_API } from "../constants/apiEndpoints";

export const eventService = {
  createEvent: (data) => axiosClient.post(EVENT_API.CREATE, data),
  getEvents: (params, config = {}) => axiosClient.get(EVENT_API.GET_ALL, { ...config, params }),
  getSchedule: (params, config = {}) =>
    axiosClient.get(EVENT_API.SCHEDULE, { ...config, params }),
  getEventById: (id, config = {}) => axiosClient.get(EVENT_API.DETAIL(id), config),
  updateEvent: (id, data) => axiosClient.put(EVENT_API.DETAIL(id), data),
  deleteEvent: (id) => axiosClient.delete(EVENT_API.DETAIL(id)),
  getEventSeats: (id, config = {}) => axiosClient.get(EVENT_API.SEATS(id), config),
};

export default eventService;
