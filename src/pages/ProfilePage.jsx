import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import { eventService } from "../api/eventService";
import { movieService } from "../api/movieService";
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
const getBookingStatus = (booking) => String(booking?.status || "PENDING").toUpperCase();
const isPendingBooking = (booking) => getBookingStatus(booking) === "PENDING";
const getBookingStatusLabel = (booking) => {
  const status = getBookingStatus(booking);
  const labels = {
    PENDING: "Chờ thanh toán",
    COMPLETED: "Hoàn thành",
    PAID: "Hoàn thành",
    CANCELLED: "Đã hủy",
    CANCELED: "Đã hủy",
    EXPIRED: "Đã hết hạn",
  };
  return labels[status] || status;
};
const getBookingMovieTitle = (booking) =>
  booking?.event?.film?.title || "QTIK Ticket";
const getEventFilmId = (event) => event?.film?.id || event?.film_id;
const getBookingEventId = (booking) => booking?.event_id || booking?.eventId || booking?.event?.id || booking?.event?._id;
const getBookingSeats = (booking) => booking?.seats || booking?.tickets || booking?.booking_seats || booking?.bookingSeats || [];
const getSeatId = (seat) => seat?.seat_id || seat?.seatId || seat?.seat?.id || seat?.seat?._id || seat?.id || seat?._id;
const getSeatCode = (seat) =>
  seat?.seat_code;
const getBookingSeatIds = (booking) => {
  const directIds = booking?.seat_ids || booking?.seatIds || [];
  const normalizedDirectIds = Array.isArray(directIds) ? directIds : [directIds].filter(Boolean);
  const nestedIds = getBookingSeats(booking).map(getSeatId).filter(Boolean);
  return [...normalizedDirectIds, ...nestedIds].map(String);
};
const normalizeSeatList = (response) => {
  const payload = response?.data || response;
  return Array.isArray(payload) ? payload : payload?.seats || payload?.items || payload?.results || [];
};
const normalizeEventDetail = (response) => {
  const payload = response?.data || response;
  return payload?.event || payload;
};
const normalizeFilmDetail = (response) => {
  const payload = response?.data || response;
  return payload?.film || payload;
};
const resolveEventWithFilmTitle = async (event) => {
  if (!event || event?.film?.title) return event;

  const filmId = getEventFilmId(event);
  if (!filmId) return event;

  try {
    const response = await movieService.getMovieById(filmId, { skipAuth: true, skipAuthRedirect: true });
    const film = normalizeFilmDetail(response);
    return {
      ...event,
      film: {
        ...event.film,
        ...film,
      },
    };
  } catch {
    return event;
  }
};
const getBookingTotalPrice = (booking) => {
  const directTotal = booking?.total_price ?? booking?.totalPrice ?? booking?.amount ?? booking?.total_amount;
  if (directTotal != null) return Number(directTotal);

  return getBookingSeats(booking).reduce((sum, seat) => {
    const price = seat?.price ?? seat?.ticket_price ?? seat?.amount ?? seat?.seat?.price ?? 0;
    return sum + Number(price || 0);
  }, 0);
};
const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");
const getProfileFormData = (user) => ({
  full_name: user?.full_name || "",
  phone_number: user?.phone_number || "",
});

export const TicketsPage = () => {
  const { bookings, page, limit, total, search, loading, error, setPage, setSearch, refetch } = useBookings();
  const [displayBookings, setDisplayBookings] = useState([]);

  useEffect(() => {
    let ignore = false;

    const enrichBookings = async () => {
      const nextBookings = await Promise.all(
        bookings.map(async (booking) => {
          if (booking?.event?.film?.title) return booking;

          const eventId = getBookingEventId(booking);
          if (!eventId) return booking;

          try {
            const response = await eventService.getEventById(eventId);
            const event = await resolveEventWithFilmTitle(normalizeEventDetail(response));
            return { ...booking, event };
          } catch {
            return booking;
          }
        })
      );

      if (!ignore) setDisplayBookings(nextBookings);
    };

    enrichBookings();

    return () => {
      ignore = true;
    };
  }, [bookings]);

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
          {displayBookings.map((booking) => (
            <Link className="ticket-row" to={`/profile/tickets/${getBookingId(booking)}`} key={getBookingId(booking)}>
              <strong>#{getBookingId(booking)}</strong>
              <span>{getBookingMovieTitle(booking)}</span>
              <small className={`status-pill ${getBookingStatus(booking).toLowerCase()}`}>{getBookingStatusLabel(booking)}</small>
            </Link>
          ))}
          {!displayBookings.length && <p className="empty-state">Bạn chưa có vé nào.</p>}
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
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const seats = getBookingSeats(booking);
  const seatCodes = seats.map(getSeatCode).filter(Boolean);
  const totalPrice = getBookingTotalPrice(booking);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await bookingService.getBookingById(bookingId);
        const nextBooking = response?.data || response;
        const eventId = getBookingEventId(nextBooking);

        if (!eventId) {
          setBooking(nextBooking);
          return;
        }

        const [eventResponse, seatsResponse] = await Promise.allSettled([
          eventService.getEventById(eventId),
          eventService.getEventSeats(eventId),
        ]);
        const eventDetail = eventResponse.status === "fulfilled" ? normalizeEventDetail(eventResponse.value) : null;
        const eventWithFilmTitle = await resolveEventWithFilmTitle(eventDetail || nextBooking.event);
        const allSeats = seatsResponse.status === "fulfilled" ? normalizeSeatList(seatsResponse.value) : [];
        const selectedSeatIds = getBookingSeatIds(nextBooking);
        const resolvedSeats = selectedSeatIds.length
          ? allSeats.filter((seat) => selectedSeatIds.includes(String(getSeatId(seat))))
          : getBookingSeats(nextBooking);

        setBooking({
          ...nextBooking,
          event: eventWithFilmTitle,
          seats: resolvedSeats.length ? resolvedSeats : getBookingSeats(nextBooking),
        });
      } catch (err) {
        setError(getErrorMessage(err, "Không thể tải chi tiết vé."));
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handlePayNow = async () => {
    setPaying(true);
    setError("");

    try {
      const response = await bookingService.payBooking(bookingId);
      const paidBooking = response?.data || response;
      setBooking((prev) => ({
        ...prev,
        ...paidBooking,
        status: paidBooking?.status || "COMPLETED",
      }));
    } catch (err) {
      setError(getErrorMessage(err, "Thanh toán thất bại."));
    } finally {
      setPaying(false);
    }
  };

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
          <div><dt>Tên phim</dt><dd>{getBookingMovieTitle(booking)}</dd></div>
          <div><dt>Trạng thái</dt><dd><span className={`status-pill ${getBookingStatus(booking).toLowerCase()}`}>{getBookingStatusLabel(booking)}</span></dd></div>
          <div><dt>Số ghế</dt><dd>{seats.length ? `${seats.length} ghế` : "Đang cập nhật"}</dd></div>
          <div><dt>Ghế đã chọn</dt><dd>{seatCodes.join(", ") || "Đang cập nhật"}</dd></div>
          <div><dt>Tổng tiền</dt><dd>{formatCurrency(totalPrice)} VNĐ</dd></div>
        </dl>
        {isPendingBooking(booking) && (
          <button className="primary-button ticket-detail-action" type="button" onClick={handlePayNow} disabled={paying}>
            {paying ? "Đang thanh toán..." : "Thanh toán ngay"}
          </button>
        )}
      </div>
    </section>
  );
};

const ProfileForm = ({ currentUser, updateCurrentUser }) => {
  const [form, setForm] = useState(() => getProfileFormData(currentUser));
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
      <form className="profile-form" onSubmit={handleSubmit}>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="success-banner">{message}</p>}
        <label>Họ tên<input value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} /></label>
        <label>Số điện thoại<input value={form.phone_number} onChange={(event) => setForm((prev) => ({ ...prev, phone_number: event.target.value }))} /></label>
        <button className="primary-button" disabled={saving} type="submit">{saving ? "Đang lưu..." : "Cập nhật"}</button>
      </form>
  );
};

const ProfilePage = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const profileKey = `${currentUser?.id || currentUser?.email || "profile"}-${currentUser?.full_name || currentUser?.fullName || currentUser?.name || ""}`;

  return (
    <section className="user-page">
      <header className="page-header">
        <div><span className="page-kicker">Profile</span><h1>Tài khoản của tôi</h1></div>
      </header>

      <ProfileForm key={profileKey} currentUser={currentUser} updateCurrentUser={updateCurrentUser} />
    </section>
  );
};

export default ProfilePage;
