import axiosClient from "./axiosClient";
import { USER_API } from "../constants/apiEndpoints";

const publicRequest = { skipAuth: true };

export const userService = {
  register: (data) => axiosClient.post(USER_API.REGISTER, data, publicRequest),
  verifyOTP: (data) => axiosClient.post(USER_API.VERIFY, data, publicRequest),
  getUsers: (params) => axiosClient.get(USER_API.GET_ALL, { params }),
  getUserById: (id) => axiosClient.get(USER_API.DETAIL(id)),
  getProfile: (config = {}) => axiosClient.get(USER_API.ME, config),
  updateUser: (id, data) => axiosClient.put(USER_API.DETAIL(id), data),
  deleteUser: (id) => axiosClient.delete(USER_API.DETAIL(id)),
  updateProfile: (data) => axiosClient.put(USER_API.ME, data),
  login: (data) => axiosClient.post(USER_API.LOGIN, data, publicRequest),
  refreshToken: (data) => axiosClient.post(USER_API.REFRESH_TOKEN, data, publicRequest),
  logout: () => axiosClient.post(USER_API.LOGOUT),
  forgotPassword: (data) => axiosClient.post(USER_API.FORGOT_PASSWORD, data, publicRequest),
  resetPassword: (data) => axiosClient.post(USER_API.RESET_PASSWORD, data, publicRequest),
  resendOTP: (data) => axiosClient.post(USER_API.RESEND_OTP, data, publicRequest),
};

export default userService;
