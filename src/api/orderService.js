import axiosClient from "./axiosClient";
import { ORDER_API } from "../constants/apiEndpoints";

export const orderService = {
  getMyOrders: (params) => axiosClient.get(ORDER_API.MY_ORDERS, { params }),
  getAllOrders: (params) => axiosClient.get(ORDER_API.ADMIN_ALL, { params }),
  getOrderById: (orderId) => axiosClient.get(ORDER_API.DETAIL(orderId)),
  cancelOrder: (orderId, reason) =>
    axiosClient.post(ORDER_API.CANCEL(orderId), { reason }),
};

export default orderService;
