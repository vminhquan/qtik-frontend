import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/UserPages.css";

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = Math.max(seconds % 60, 0).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
};

const PaymentPage = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [expiresAt] = useState(() => location.state?.expiresAt || Date.now() + 5 * 60 * 1000);
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [remaining, setRemaining] = useState(5 * 60);
  const [loading, setLoading] = useState(!booking);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (booking) return;
      setLoading(true);
      try {
        const response = await bookingService.getBookingById(bookingId);
        setBooking(response?.data || response);
      } catch (err) {
        setError(getErrorMessage(err, "Không thể tải đơn đặt vé."));
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [booking, bookingId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    const cancelExpiredBooking = async () => {
      if (remaining > 0 || expired) return;
      setExpired(true);
      try {
        await bookingService.deleteBooking(bookingId);
      } catch {
        // Backend có thể đã tự hủy đơn hết hạn.
      }
    };

    cancelExpiredBooking();
  }, [bookingId, expired, remaining]);

  const totalPrice = useMemo(() => {
    const seats = booking?.seats || booking?.data?.seats || [];
    return booking?.total_price || booking?.totalPrice || seats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
  }, [booking]);

  const handlePay = async () => {
    setPaying(true);
    setError("");

    try {
      await bookingService.payBooking(bookingId);
      navigate(`/profile/tickets/${bookingId}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Thanh toán thất bại."));
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingState label="Đang tải thanh toán..." />;

  return (
    <section className="user-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Payment</span>
          <h1>Thanh toán đơn #{bookingId}</h1>
          <p>Ghế đang được giữ trong 5 phút. Hoàn tất thanh toán trước khi đồng hồ về 00:00.</p>
        </div>
      </header>

      {error && <ErrorState message={error} />}

      <div className="payment-card">
        <div className={remaining <= 30 ? "countdown urgent" : "countdown"}>
          <span>Thời gian còn lại</span>
          <strong>{formatTime(remaining)}</strong>
        </div>

        <dl>
          <div><dt>Mã đơn</dt><dd>{bookingId}</dd></div>
          <div><dt>Trạng thái</dt><dd>{expired ? "EXPIRED" : booking?.status || "PENDING"}</dd></div>
          <div><dt>Tổng tiền</dt><dd>{Number(totalPrice || 0).toLocaleString("vi-VN")} VNĐ</dd></div>
        </dl>

        {expired ? (
          <Link className="primary-button" to="/booking">Chọn lại ghế</Link>
        ) : (
          <button className="primary-button" type="button" onClick={handlePay} disabled={paying}>
            {paying ? "Đang thanh toán..." : "Thanh toán ngay"}
          </button>
        )}
      </div>
    </section>
  );
};

export default PaymentPage;
