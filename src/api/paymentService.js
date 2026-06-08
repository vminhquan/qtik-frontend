import axiosClient from "./axiosClient";
import { PAYMENT_API } from "../constants/apiEndpoints";

export const paymentService = {
  createPaymentLink: (orderId) =>
    axiosClient.post(PAYMENT_API.CREATE_LINK, { order_id: orderId }),
  getOrderPayments: (orderId) =>
    axiosClient.get(PAYMENT_API.BY_ORDER(orderId)),
  reconcileByProviderOrderCode: (providerOrderCode) =>
    axiosClient.post(
      PAYMENT_API.RECONCILE_BY_PROVIDER_ORDER_CODE(providerOrderCode)
    ),
  reconcileByPaymentLinkId: (paymentLinkId) =>
    axiosClient.post(
      PAYMENT_API.RECONCILE_BY_PAYMENT_LINK_ID(paymentLinkId)
    ),
  getPaymentById: (paymentId) =>
    axiosClient.get(PAYMENT_API.DETAIL(paymentId)),
};

export default paymentService;
