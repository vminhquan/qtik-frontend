import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import { userService } from "../api/userService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import QRCodeCard from "../components/QRCodeCard";
import { useAuth } from "../hooks/useAuth";
import useBookings from "../hooks/useBookings";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/UserPages.css";

const getBookingId = (booking) => booking.id || booking._id || booking.booking_id;

export const TicketsPage = () => {
  const { bookings, page, limit, total, search, loading, error, setPage, setSearch, refetch } = useBookings();

  return (
    <section className="user-page">
      <header className="page-header">
        <div><span className="page-kicker">My Tickets</span><h1>Lịch sử mua vé</h1></div>
        <label className="search-box">
          <span>Tìm vé</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã đơn, tên phim..." />
        </label>
      </header>

      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading ? <LoadingState label="Đang tải vé..." /> : (
        <div className="ticket-list">
          {bookings.map((booking) => (
            <Link className="ticket-row" to={`/profile/tickets/${getBookingId(booking)}`} key={getBookingId(booking)}>
              <strong>#{getBookingId(booking)}</strong>
              <span>{booking.film?.title || booking.movie?.title || booking.title || "QTIK Ticket"}</span>
              <small className={`status-pill ${String(booking.status || "pending").toLowerCase()}`}>{booking.status || "PENDING"}</small>
            </Link>
          ))}
          {!bookings.length && <p className="empty-state">Bạn chưa có vé nào.</p>}
        </div>
      )}

      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
    </section>
  );
};

export const TicketDetailPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await bookingService.getBookingById(bookingId);
        setBooking(response?.data || response);
      } catch (err) {
        setError(getErrorMessage(err, "Không thể tải chi tiết vé."));
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) return <LoadingState label="Đang tải vé..." />;

  return (
    <section className="user-page">
      <header className="page-header">
        <div><span className="page-kicker">Ticket Detail</span><h1>Vé #{bookingId}</h1></div>
      </header>
      {error && <ErrorState message={error} />}
      <div className="ticket-detail">
        <QRCodeCard value={`QTIK-${bookingId}`} />
        <dl>
          <div><dt>Mã vé</dt><dd>{bookingId}</dd></div>
          <div><dt>Phim</dt><dd>{booking?.film?.title || booking?.movie?.title || booking?.title || "QTIK Ticket"}</dd></div>
          <div><dt>Trạng thái</dt><dd>{booking?.status || "PENDING"}</dd></div>
          <div><dt>Ghế</dt><dd>{(booking?.seats || []).map((seat) => seat.seat_code || seat.code).join(", ") || "Đang cập nhật"}</dd></div>
        </dl>
      </div>
    </section>
  );
};

const ProfilePage = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const [form, setForm] = useState({
    full_name: currentUser?.full_name || "",
    phone_number: currentUser?.phone_number || "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await userService.updateProfile(form);
      updateCurrentUser(response?.user || response?.data || { ...currentUser, ...form });
      setMessage("Cập nhật tài khoản thành công.");
    } catch (err) {
      setError(getErrorMessage(err, "Không thể cập nhật tài khoản."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="user-page">
      <header className="page-header">
        <div><span className="page-kicker">Profile</span><h1>Tài khoản của tôi</h1></div>
      </header>

      <form className="profile-form" onSubmit={handleSubmit}>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="success-banner">{message}</p>}
        <label>Họ tên<input value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} /></label>
        <label>Số điện thoại<input value={form.phone_number} onChange={(event) => setForm((prev) => ({ ...prev, phone_number: event.target.value }))} /></label>
        <button className="primary-button" disabled={saving} type="submit">{saving ? "Đang lưu..." : "Cập nhật"}</button>
      </form>
    </section>
  );
};

export default ProfilePage;
