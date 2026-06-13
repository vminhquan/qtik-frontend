import axiosClient from "./axiosClient";
import { ROOM_API } from "../constants/apiEndpoints";

export const movieRoomService = {
  createRoom: (data) => axiosClient.post(ROOM_API.CREATE, data),
  getRooms: (params, config = {}) =>
    axiosClient.get(ROOM_API.GET_ALL, { ...config, params }),
  getRoomById: (id, config = {}) =>
    axiosClient.get(ROOM_API.DETAIL(id), config),
  updateRoom: (id, data) => axiosClient.put(ROOM_API.DETAIL(id), data),
  deleteRoom: (id) => axiosClient.delete(ROOM_API.DETAIL(id)),
};

export default movieRoomService;
