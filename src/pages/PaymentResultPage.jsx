import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { orderService } from "../api/orderService";
import { paymentService } from "../api/paymentService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import {
  clearPendingPaymentContext,
  formatCurrency,
  getPendingPaymentContext,
  getOrderStatus,
  getPaymentStatus,
  getStatusLabel,
  normalizeList,
  unwrapData,
} from "../utils/commerceHelper";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/UserPages.css";

const PaymentResultPage = ({ cancelled = false }) => {
  const [searchParams] = useSearchParams();
  const [paymentContext] = useState(() => getPendingPaymentContext());
  const callbackOrderCode = searchParams.get("orderCode");
  const callbackPaymentLinkId = searchParams.get("id");
  const storedOrderId = searchParams.get("orderId") || paymentContext?.orderId;
  const callbackMatchesStoredPayment =
    (!callbackOrderCode ||
      !paymentContext?.providerOrderCode ||
      String(callbackOrderCode) === String(paymentContext.providerOrderCode)) &&
    (!callbackPaymentLinkId ||
      !paymentContext?.paymentLinkId ||
      String(callbackPaymentLinkId) === String(paymentContext.paymentLinkId));
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(callbackMatchesStoredPayment);
  const [error, setError] = useState("");
  const attemptsRef = useRef(0);

  const loadResult = useCallback(async () => {
    if (!callbackMatchesStoredPayment) {
      setError("Kết quả PayOS không khớp với lần thanh toán đang chờ.");
      setLoading(false);
      return;
    }

    try {
      const paymentLinkId =
        callbackPaymentLinkId || paymentContext?.paymentLinkId;
      const providerOrderCode =
        callbackOrderCode || paymentContext?.providerOrderCode;
      let reconciliation = null;
      let reconciliationError = "";

      try {
        if (paymentLinkId) {
          reconciliation = unwrapData(
            await paymentService.reconcileByPaymentLinkId(paymentLinkId),
          );
        } else if (providerOrderCode) {
          reconciliation = unwrapData(
            await paymentService.reconcileByProviderOrderCode(
              providerOrderCode,
            ),
          );
        }
      } catch (err) {
        reconciliationError = getErrorMessage(
          err,
          "Chưa thể đối soát trạng thái với payOS.",
        );
      }

      const reconciledPayment = reconciliation?.payment || null;
      const resolvedOrderId = storedOrderId || reconciledPayment?.order_id;
      if (!resolvedOrderId) {
        throw new Error(
          "Không tìm thấy đơn hàng vừa thanh toán trên trình duyệt này.",
        );
      }

      const nextOrder = unwrapData(
        await orderService.getOrderById(resolvedOrderId),
      );
      const paymentsResponse = await paymentService.getOrderPayments(
        nextOrder.id,
      );
      const payments = normalizeList(paymentsResponse, ["payments"]);
      const nextPayment =
        reconciledPayment ||
        payments.find(
          (item) =>
            (paymentContext?.paymentId &&
              String(item.id) === String(paymentContext.paymentId)) ||
            (paymentLinkId &&
              String(item.payment_link_id) === String(paymentLinkId)) ||
            (providerOrderCode &&
              String(item.provider_order_code) === String(providerOrderCode)),
        ) ||
        payments[0] ||
        null;

      setOrder(nextOrder);
      setPayment(nextPayment);

      const nextOrderStatus = getOrderStatus(nextOrder);
      const nextPaymentStatus = getPaymentStatus(nextPayment);
      const isStillPending =
        nextOrderStatus === "pending" &&
        (!nextPayment || nextPaymentStatus === "pending");
      setError(isStillPending ? reconciliationError : "");

      const finalPaymentStatuses = ["paid", "cancelled", "failed"];
      const finalOrderStatuses = ["paid", "cancelled", "expired"];
      if (
        finalPaymentStatuses.includes(nextPaymentStatus) ||
        finalOrderStatuses.includes(nextOrderStatus)
      ) {
        clearPendingPaymentContext();
      }
    } catch (err) {
      setError(getErrorMessage(err, "Không thể xác nhận kết quả thanh toán."));
    } finally {
      setLoading(false);
    }
  }, [
    callbackMatchesStoredPayment,
    callbackOrderCode,
    callbackPaymentLinkId,
    paymentContext,
    storedOrderId,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadResult();
  }, [loadResult]);

  useEffect(() => {
    const paymentStatus = getPaymentStatus(payment);
    const isWaiting =
      getOrderStatus(order) === "pending" &&
      (!payment || paymentStatus === "pending");
    if (!order || !isWaiting) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      attemptsRef.current += 1;
      if (attemptsRef.current >= 30) {
        window.clearInterval(timer);
        return;
      }
      loadResult();
    }, 2000);

    return () => window.clearInterval(timer);
  }, [loadResult, order, payment]);

  if (loading) return <LoadingState label="Đang xác nhận giao dịch..." />;

  const orderStatus = getOrderStatus(order);
  const paymentStatus = payment ? getPaymentStatus(payment) : "";
  const isPaid = orderStatus === "paid";
  const isCancelled =
    orderStatus === "cancelled" ||
    (!order && paymentStatus === "cancelled") ||
    (cancelled && !payment && !order);
  const isFailed = paymentStatus === "failed";
  const isExpired = orderStatus === "expired";
  const resultClass = isPaid
    ? "success"
    : isCancelled || isFailed || isExpired
      ? "cancelled"
      : "pending";
  const title = isPaid
    ? "Thanh toán thành công"
    : isCancelled
      ? "Đã hủy thanh toán và vé"
      : isFailed
        ? "Thanh toán thất bại"
        : isExpired
          ? "Đơn hàng đã hết hạn"
          : "Đang chờ backend xác nhận";

  return (
    <section className="user-page payment-result-page">
      <div className={`payment-result ${resultClass}`}>
        <span className="payment-result-mark" aria-hidden="true">
          {isPaid ? "✓" : resultClass === "cancelled" ? "×" : "…"}
        </span>
        <span className="page-kicker">Kết quả thanh toán</span>
        <h1>{title}</h1>
        {isCancelled}
        {error && <ErrorState message={error} onRetry={loadResult} />}

        {order && (
          <dl>
            <div>
              <dt>Mã đơn</dt>
              <dd>{order.order_code}</dd>
            </div>
            <div>
              <dt>Mã giao dịch</dt>
              <dd>
                {payment?.provider_order_code ||
                  order.provider_order_code ||
                  "Chưa tạo"}
              </dd>
            </div>
            <div>
              <dt>Trạng thái đơn</dt>
              <dd>
                <span className={`status-pill ${orderStatus}`}>
                  {getStatusLabel(orderStatus)}
                </span>
              </dd>
            </div>
            <div>
              <dt>Số tiền</dt>
              <dd>{formatCurrency(order.amount, order.currency)}</dd>
            </div>
          </dl>
        )}

        <div className="payment-actions">
          {isCancelled ? (
            <>
              <Link className="ghost-button" to="/">
                Về trang chủ
              </Link>
              <Link className="primary-button" to="/#movie-catalog">
                Đặt vé khác
              </Link>
            </>
          ) : isPaid ? (
            <>
              <Link className="ghost-button" to="/profile/orders">
                Danh sách đơn hàng
              </Link>
              <Link
                className="primary-button"
                to={`/profile/orders/${order.id}`}
              >
                Xem đơn hàng và vé
              </Link>
            </>
          ) : order?.id && orderStatus === "pending" ? (
            <>
              <Link className="ghost-button" to="/profile/orders">
                Danh sách đơn hàng
              </Link>
              <Link className="primary-button" to={`/payment/${order.id}`}>
                Quay lại thanh toán
              </Link>
            </>
          ) : order?.id ? (
            <>
              <Link className="ghost-button" to="/">
                Về trang chủ
              </Link>
              <Link className="primary-button" to="/#movie-catalog">
                Chọn suất chiếu
              </Link>
            </>
          ) : (
            <>
              <Link className="ghost-button" to="/">
                Về trang chủ
              </Link>
              <Link className="primary-button" to="/#movie-catalog">
                Chọn suất chiếu
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default PaymentResultPage;
