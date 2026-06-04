import axiosClient from "./axiosClient";
import { ROOM_API } from "../constants/apiEndpoints";

export const movieRoomService = {
  createRoom: (data) => axiosClient.post(ROOM_API.CREATE, data),
  getRooms: (params) => axiosClient.get(ROOM_API.GET_ALL, { params }),
  getRoomById: (id) => axiosClient.get(ROOM_API.DETAIL(id)),
  updateRoom: (id, data) => axiosClient.put(ROOM_API.DETAIL(id), data),
  deleteRoom: (id) => axiosClient.delete(ROOM_API.DETAIL(id)),
};

export default movieRoomService;
