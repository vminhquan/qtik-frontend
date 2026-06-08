import { useState } from "react";
import { bookingService } from "../api/bookingService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import useBookings from "../hooks/useBookings";
import useOrders from "../hooks/useOrders";
import {
  formatCurrency,
  formatDateTime,
  getBookingItems,
  getStatusLabel,
} from "../utils/commerceHelper";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/AdminPages.css";

const AdminBookingManagementPage = () => {
  const [view, setView] = useState("orders");
  const [qrToken, setQrToken] = useState("");
  const [ticketResult, setTicketResult] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [bookingDetails, setBookingDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState("");
  const [detailErrors, setDetailErrors] = useState({});
  const ordersState = useOrders({ admin: true });
  const bookingsState = useBookings({ admin: true });

  const revenue = ordersState.orders
    .filter((order) => String(order.status).toLowerCase() === "paid")
    .reduce((total, order) => total + Number(order.amount || 0), 0);

  const cleanupExpired = async () => {
    setActionLoading(true);
    setActionError("");
    setActionMessage("");
    try {
      const response = await bookingService.cleanupExpired();
      setActionMessage(`Đã xử lý ${response?.expired_bookings || 0} booking hết hạn.`);
      await Promise.all([bookingsState.refetch(), ordersState.refetch()]);
    } catch (err) {
      setActionError(getErrorMessage(err, "Không thể dọn booking hết hạn."));
    } finally {
      setActionLoading(false);
    }
  };

  const useTicket = async (event) => {
    event.preventDefault();
    if (!qrToken.trim()) return;
    setActionLoading(true);
    setActionError("");
    setActionMessage("");
    try {
      const ticket = await bookingService.useTicket(qrToken.trim());
      setTicketResult(ticket);
      setActionMessage("Soát vé thành công.");
      setQrToken("");
    } catch (err) {
      setTicketResult(null);
      setActionError(getErrorMessage(err, "Mã QR không hợp lệ hoặc vé đã được sử dụng."));
    } finally {
      setActionLoading(false);
    }
  };

  const loadOrderDetail = async (order) => {
    setDetailLoadingId(order.id);
    setDetailErrors((current) => ({ ...current, [order.id]: "" }));
    try {
      const response = await bookingService.getAdminBookingById(
        order.booking_id
      );
      setBookingDetails((current) => ({
        ...current,
        [order.booking_id]: response?.data || response,
      }));
    } catch (err) {
      setDetailErrors((current) => ({
        ...current,
        [order.id]: getErrorMessage(
          err,
          "Không thể tải QR token của đơn hàng."
        ),
      }));
    } finally {
      setDetailLoadingId("");
    }
  };

  const toggleOrderDetail = async (order) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId("");
      return;
    }

    setExpandedOrderId(order.id);
    if (!bookingDetails[order.booking_id]) {
      await loadOrderDetail(order);
    }
  };

  const copyQrToken = async (token) => {
    try {
      await navigator.clipboard.writeText(token);
      setActionError("");
      setActionMessage("Đã sao chép QR token.");
    } catch {
      setActionMessage("");
      setActionError("Không thể sao chép tự động. Hãy chọn token để sao chép.");
    }
  };

  return (
    <section className="admin-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Vận hành bán vé</span>
          <h1>Đơn hàng, booking và soát vé</h1>
          <p>Doanh thu các đơn đã thanh toán trên trang hiện tại: {formatCurrency(revenue)}</p>
        </div>
        {view === "bookings" && (
          <button className="ghost-button" type="button" onClick={cleanupExpired} disabled={actionLoading}>
            Dọn booking hết hạn
          </button>
        )}
      </header>

      <div className="admin-tabs" role="tablist" aria-label="Quản lý bán vé">
        <button className={view === "orders" ? "active" : ""} type="button" onClick={() => setView("orders")}>Đơn hàng</button>
        <button className={view === "bookings" ? "active" : ""} type="button" onClick={() => setView("bookings")}>Booking</button>
        <button className={view === "scanner" ? "active" : ""} type="button" onClick={() => setView("scanner")}>Soát vé</button>
      </div>

      {actionError && <ErrorState message={actionError} />}
      {actionMessage && <p className="success-banner">{actionMessage}</p>}

      {view === "orders" && (
        <>
          <div className="admin-toolbar">
            <label className="search-box">
              <span>Tìm đơn hàng</span>
              <input value={ordersState.search} onChange={(event) => ordersState.setSearch(event.target.value)} placeholder="Mã đơn, trạng thái..." />
            </label>
          </div>
          {ordersState.error && <ErrorState message={ordersState.error} onRetry={ordersState.refetch} />}
          <div className="admin-order-list">
            {ordersState.loading ? <LoadingState /> : ordersState.orders.map((order) => (
              <article className="admin-order-card" key={order.id}>
                <button
                  className="admin-order-toggle"
                  type="button"
                  aria-expanded={expandedOrderId === order.id}
                  onClick={() => toggleOrderDetail(order)}
                >
                  <div>
                    <span className="page-kicker">Đơn hàng</span>
                    <h2>#{order.order_code}</h2>
                    <small>{formatDateTime(order.created_at)}</small>
                  </div>
                  <span className="admin-order-toggle-status">
                    <span className={`status-pill ${order.status}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <strong>
                      {expandedOrderId === order.id ? "Thu gọn" : "Xem chi tiết"}
                    </strong>
                  </span>
                </button>
                <div className="admin-order-detail-grid">
                  <section>
                    <span>Khách hàng</span>
                    <strong>{order.customer?.full_name || "Chưa cập nhật tên"}</strong>
                    <small>{order.customer?.email || "Không có email"}</small>
                    {order.customer?.phone_number && <small>{order.customer.phone_number}</small>}
                  </section>
                  <section>
                    <span>Thanh toán</span>
                    <strong>{formatCurrency(order.amount, order.currency)}</strong>
                    <small>Mã PayOS: {order.provider_order_code || "Chưa tạo"}</small>
                    <small>{order.payment_status ? getStatusLabel(order.payment_status) : "Chưa thanh toán"}</small>
                  </section>
                  <section>
                    <span>Booking và vé</span>
                    <strong>{order.movie_title || "Chưa xác định phim"}</strong>
                    <strong>{order.ticket_count || 0} vé đã phát hành</strong>
                    <small>Ghế: {order.seat_codes?.join(", ") || "Chưa có"}</small>
                    <small>{order.booking_status ? getStatusLabel(order.booking_status) : "Chưa có booking"}</small>
                  </section>
                </div>
                {expandedOrderId === order.id && (
                  <section className="admin-order-ticket-detail">
                    <div>
                      <span className="page-kicker">QR token trong đơn</span>
                      <h3>Chi tiết từng vé</h3>
                    </div>
                    {detailLoadingId === order.id ? (
                      <LoadingState label="Đang tải vé..." />
                    ) : detailErrors[order.id] ? (
                      <ErrorState
                        message={detailErrors[order.id]}
                        onRetry={() => {
                          setBookingDetails((current) => {
                            const next = { ...current };
                            delete next[order.booking_id];
                            return next;
                          });
                          loadOrderDetail(order);
                        }}
                      />
                    ) : (
                      <div className="admin-order-ticket-list">
                        {getBookingItems(
                          bookingDetails[order.booking_id]
                        ).map((item) => (
                          <div className="admin-order-ticket-row" key={item.id}>
                            <span>
                              <strong>Ghế {item.seat_code}</strong>
                              <small>
                                {item.ticket
                                  ? getStatusLabel(item.ticket.status)
                                  : "Chưa phát hành vé"}
                              </small>
                            </span>
                            {item.ticket ? (
                              <>
                                <code>{item.ticket.qr_token}</code>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyQrToken(item.ticket.qr_token)
                                  }
                                >
                                  Sao chép
                                </button>
                              </>
                            ) : (
                              <span className="empty-state">
                                Không có QR token
                              </span>
                            )}
                          </div>
                        ))}
                        {!getBookingItems(
                          bookingDetails[order.booking_id]
                        ).length && (
                          <p className="empty-state">
                            Đơn hàng chưa có vé để hiển thị.
                          </p>
                        )}
                      </div>
                    )}
                  </section>
                )}
              </article>
            ))}
            {!ordersState.loading && !ordersState.orders.length && (
              <p className="empty-state">Không có đơn hàng phù hợp.</p>
            )}
          </div>
          <Pagination page={ordersState.page} limit={ordersState.limit} total={ordersState.total} onPageChange={ordersState.setPage} />
        </>
      )}

      {view === "bookings" && (
        <>
          <div className="admin-toolbar">
            <label className="search-box">
              <span>Tìm booking</span>
              <input value={bookingsState.search} onChange={(event) => bookingsState.setSearch(event.target.value)} placeholder="UUID, trạng thái..." />
            </label>
          </div>
          {bookingsState.error && <ErrorState message={bookingsState.error} onRetry={bookingsState.refetch} />}
          <div className="admin-panel">
            {bookingsState.loading ? <LoadingState /> : bookingsState.bookings.map((booking) => (
              <div className="admin-row admin-commerce-row" key={booking.id}>
                <span><strong>Booking</strong><small className="admin-id">{booking.id}</small></span>
                <span>{getBookingItems(booking).length} ghế</span>
                <span>{formatDateTime(booking.hold_expires_at)}</span>
                <small className={`status-pill ${booking.status}`}>{getStatusLabel(booking.status)}</small>
              </div>
            ))}
          </div>
          <Pagination page={bookingsState.page} limit={bookingsState.limit} total={bookingsState.total} onPageChange={bookingsState.setPage} />
        </>
      )}

      {view === "scanner" && (
        <form className="ticket-scanner" onSubmit={useTicket}>
          <div>
            <span className="page-kicker">Ticket gate</span>
            <h2>Soát vé bằng QR token</h2>
            <p>Dữ liệu quét phải là `qr_token` của đúng một Ticket thuộc một BookingItem.</p>
          </div>
          <label>
            QR token
            <input value={qrToken} onChange={(event) => setQrToken(event.target.value)} placeholder="Dán dữ liệu từ mã QR..." autoFocus />
          </label>
          <button className="primary-button" type="submit" disabled={actionLoading || !qrToken.trim()}>
            {actionLoading ? "Đang kiểm tra..." : "Xác nhận sử dụng vé"}
          </button>
          {ticketResult && (
            <dl>
              <div><dt>Mã vé</dt><dd>{ticketResult.id}</dd></div>
              <div><dt>Trạng thái</dt><dd>{getStatusLabel(ticketResult.status)}</dd></div>
              <div><dt>Thời gian dùng</dt><dd>{formatDateTime(ticketResult.used_at)}</dd></div>
            </dl>
          )}
        </form>
      )}
    </section>
  );
};

export default AdminBookingManagementPage;
