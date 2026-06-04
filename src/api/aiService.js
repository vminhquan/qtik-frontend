import axiosClient from "./axiosClient";
import { AI_API } from "../constants/apiEndpoints";

export const aiService = {
  sendMessage: (data) => axiosClient.post(AI_API.CHAT, data),
};

export default aiService;
