import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import { orderService } from "../api/orderService";
import { paymentService } from "../api/paymentService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import {
  clearPendingPaymentContext,
  formatCurrency,
  getBookingHoldExpiryTime,
  getBookingItems,
  getOrderStatus,
  savePendingPaymentContext,
  unwrapData,
} from "../utils/commerceHelper";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/UserPages.css";

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const rest = Math.max(seconds % 60, 0)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${rest}`;
};

const PaymentPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order || null);
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const expirySyncRef = useRef(false);

  const loadCheckout = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextOrder = unwrapData(await orderService.getOrderById(orderId));
      const bookingResponse = await bookingService.getBookingById(
        nextOrder.booking_id,
      );

      setOrder(nextOrder);
      setBooking(unwrapData(bookingResponse));
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải thông tin thanh toán."));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCheckout();
  }, [loadCheckout]);

  useEffect(() => {
    const expiresAt = getBookingHoldExpiryTime(booking, order);

    if (!expiresAt || Number.isNaN(expiresAt)) {
      const resetTimer = window.setTimeout(() => setRemaining(null), 0);
      return () => window.clearTimeout(resetTimer);
    }

    const updateRemaining = () => {
      setRemaining(Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 0));
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [booking, order]);

  const status = getOrderStatus(order);
  const isPending = status === "pending";
  const isExpired = status === "expired" || (isPending && remaining === 0);
  const items = useMemo(() => getBookingItems(booking), [booking]);

  useEffect(() => {
    if (remaining > 0) {
      expirySyncRef.current = false;
      return;
    }

    if (remaining !== 0 || !isPending || expirySyncRef.current) {
      return;
    }

    expirySyncRef.current = true;
    loadCheckout();
  }, [isPending, loadCheckout, remaining]);

  const handlePay = async () => {
    if (!order?.id || isExpired) return;
    setPaying(true);
    setError("");

    try {
      const paymentLink = unwrapData(
        await paymentService.createPaymentLink(order.id),
      );
      if (!paymentLink?.checkout_url) {
        throw new Error("payOS không trả về đường dẫn thanh toán.");
      }

      savePendingPaymentContext({
        ...paymentLink,
        order_id: paymentLink.order_id || order.id,
      });
      window.location.assign(paymentLink.checkout_url);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể khởi tạo thanh toán payOS."));
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!order?.id || !isPending) return;
    setCancelling(true);
    setError("");

    try {
      await orderService.cancelOrder(
        order.id,
        "Khách hàng hủy đơn trước khi thanh toán",
      );
      clearPendingPaymentContext();
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Không thể hủy đơn hàng."));
      setCancelling(false);
    }
  };

  if (loading) return <LoadingState label="Đang tải thanh toán..." />;

  return (
    <section className="user-page payment-page">
      <header className="page-header">
        <div>
          <h1>Thanh toán đơn hàng</h1>
        </div>
      </header>

      {error && <ErrorState message={error} onRetry={loadCheckout} />}

      <div className="payment-layout payment-layout-single">
        <div className="payment-card">
          {isPending && (
            <div
              className={
                remaining != null && remaining <= 30
                  ? "countdown urgent"
                  : "countdown"
              }
            >
              <span>Thời gian giữ ghế còn lại</span>
              <strong>
                {remaining == null ? "--:--" : formatTime(remaining)}
              </strong>
            </div>
          )}

          <dl>
            <div>
              <dt>Số ghế</dt>
              <dd>{items.length}</dd>
            </div>
            <div>
              <dt>Tổng thanh toán</dt>
              <dd>{formatCurrency(order?.amount, order?.currency)}</dd>
            </div>
          </dl>

          {isPending && !isExpired && (
            <div className="payment-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={handleCancel}
                disabled={cancelling || paying}
              >
                {cancelling ? "Đang hủy..." : "Hủy đơn"}
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handlePay}
                disabled={paying || cancelling}
              >
                {paying ? "Đang tải..." : "Thanh toán"}
              </button>
            </div>
          )}

          {isExpired && (
            <div className="payment-expired">
              <strong>Thời gian giữ ghế đã kết thúc</strong>
              <p>
                Ghế đã được hệ thống giải phóng. Bạn có thể chọn lại suất chiếu.
              </p>
              <Link className="primary-button" to="/booking">
                Chọn lại ghế
              </Link>
            </div>
          )}

          {status === "paid" && (
            <Link
              className="primary-button"
              to={`/profile/orders/${order?.id}`}
            >
              Mở đơn hàng và vé
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default PaymentPage;
