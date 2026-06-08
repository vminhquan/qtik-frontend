import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import { orderService } from "../api/orderService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import QRCodeCard from "../components/QRCodeCard";
import useOrders from "../hooks/useOrders";
import {
  formatCurrency,
  formatDateTime,
  getBookingItems,
  getOrderStatus,
  getStatusLabel,
  unwrapData,
} from "../utils/commerceHelper";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/UserPages.css";

export const OrdersPage = () => {
  const {
    orders,
    page,
    limit,
    total,
    search,
    loading,
    error,
    setPage,
    setSearch,
    refetch,
  } = useOrders();

  return (
    <section className="user-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Đơn hàng</span>
          <h1>Đơn hàng của tôi</h1>
        </div>
        <label className="search-box">
          <span>Tìm đơn</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mã đơn, trạng thái..."
          />
        </label>
      </header>

      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading ? (
        <LoadingState label="Đang tải đơn hàng..." />
      ) : (
        <div className="order-list">
          {orders.map((order) => {
            const status = getOrderStatus(order);
            return (
              <Link
                className="order-row"
                to={`/profile/orders/${order.id}`}
                key={order.id}
              >
                <span>
                  <strong>Đơn #{order.order_code}</strong>
                  <small>
                    {formatDateTime(order.created_at)} ·{" "}
                    {order.ticket_count || 0} vé
                  </small>
                </span>
                <span>{formatCurrency(order.amount, order.currency)}</span>
                <small className={`status-pill ${status}`}>
                  {getStatusLabel(status)}
                </small>
              </Link>
            );
          })}
          {!orders.length && (
            <p className="empty-state">Bạn chưa có đơn hàng nào.</p>
          )}
        </div>
      )}

      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
      />
    </section>
  );
};

export const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
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
      setError(getErrorMessage(err, "Không thể tải chi tiết đơn hàng."));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrder();
  }, [loadOrder]);

  const handleCancel = async () => {
    setCancelling(true);
    setError("");
    try {
      await orderService.cancelOrder(
        order.id,
        "Khách hàng hủy từ trang đơn hàng",
      );
      await loadOrder();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể hủy đơn hàng."));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingState label="Đang tải chi tiết đơn..." />;

  const status = getOrderStatus(order);
  const items = getBookingItems(booking);
  const ticketItems = items.filter((item) => item.ticket);
  const event = booking?.event;
  const seatCodes = items.map((item) => item.seat_code).filter(Boolean);

  return (
    <section className="user-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Chi tiết đơn hàng</span>
          <h1>Đơn #{order?.order_code}</h1>
        </div>
        <button
          className="ghost-button"
          type="button"
          onClick={() => navigate(-1)}
        >
          Quay lại
        </button>
      </header>

      {error && <ErrorState message={error} onRetry={loadOrder} />}

      <div className="order-detail-grid">
        <section className="order-summary-panel">
          <div className="order-summary-head">
            <div>
              <span className="page-kicker">Order</span>
              <h2>Thông tin thanh toán</h2>
            </div>
            <span className={`status-pill ${status}`}>
              {getStatusLabel(status)}
            </span>
          </div>
          <dl>
            <div>
              <dt>Mã đơn</dt>
              <dd>{order?.order_code}</dd>
            </div>
            <div>
              <dt>Mã PayOS</dt>
              <dd>{order?.provider_order_code || "Chưa tạo"}</dd>
            </div>
            <div>
              <dt>Tổng tiền</dt>
              <dd>{formatCurrency(order?.amount, order?.currency)}</dd>
            </div>
            <div>
              <dt>Ngày tạo</dt>
              <dd>{formatDateTime(order?.created_at)}</dd>
            </div>
          </dl>
          {status === "pending" && (
            <div className="payment-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Đang hủy..." : "Hủy đơn"}
              </button>
              <Link
                className="primary-button"
                to={`/payment/${order.id}`}
                state={{ order, booking }}
              >
                Thanh toán
              </Link>
            </div>
          )}
          {status === "paid" && (
            <a className="primary-button" href="#order-tickets">
              Xem {ticketItems.length} vé QR
            </a>
          )}
        </section>

        <section className="order-relation-panel">
          <span className="page-kicker">Ghế và vé</span>
          <h2>
            {ticketItems.length} vé cho {items.length} ghế
          </h2>
          {event && (
            <div className="order-showtime-summary">
              <strong>{event.film?.title || "Suất chiếu QTIK"}</strong>
              <span>
                {event.room?.name || "Phòng chiếu"} ·{" "}
                {formatDateTime(event.start_time)}
              </span>
              <small>Ghế: {seatCodes.join(", ") || "Đang cập nhật"}</small>
            </div>
          )}
          <div className="booking-item-list">
            {items.map((item) => (
              <div className="booking-item-row" key={item.id}>
                <strong>Ghế {item.seat_code || "..."}</strong>
                <strong>{formatCurrency(item.unit_price)}</strong>
                <small
                  className={`status-pill ${item.ticket?.status || "held"}`}
                >
                  {item.ticket
                    ? getStatusLabel(item.ticket.status)
                    : "Chưa phát hành vé"}
                </small>
              </div>
            ))}
          </div>
        </section>
      </div>

      {status === "paid" && (
        <section className="order-ticket-section" id="order-tickets">
          <div>
            <span className="page-kicker">Vé trong đơn hàng</span>
            <h2>{ticketItems.length} vé QR đã phát hành</h2>
          </div>
          <div className="ticket-qr-grid">
            {ticketItems.map((item) => (
              <article
                className={`ticket-qr-item ${item.ticket.status !== "issued" ? "invalid" : ""}`}
                key={item.ticket.id}
              >
                <QRCodeCard value={item.ticket.qr_token} />
                <div>
                  <span className="page-kicker">Ghế {item.seat_code}</span>
                  <h3>{event?.film?.title || "Vé xem phim QTIK"}</h3>
                  <span className={`status-pill ${item.ticket.status}`}>
                    {getStatusLabel(item.ticket.status)}
                  </span>
                  <small>
                    {event?.room?.name || "Phòng chiếu"} ·{" "}
                    {formatDateTime(event?.start_time)}
                  </small>
                </div>
              </article>
            ))}
            {!ticketItems.length && (
              <p className="empty-state">Đơn hàng chưa có vé được phát hành.</p>
            )}
          </div>
        </section>
      )}
    </section>
  );
};
