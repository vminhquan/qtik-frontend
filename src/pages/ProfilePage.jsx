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
  email: user?.email || "",
  phone_number: user?.phone_number || "",
});
const getProfileInitials = (user) => {
  const name = user?.full_name || user?.fullName || user?.name || user?.email || "QT";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};
const isVerifiedEmail = (user) => user?.is_active === true || user?.isActive === true || user?.is_active === 1 || user?.isActive === 1;

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m4 16.8-.8 3.2 3.2-.8L18.9 6.7a2 2 0 0 0-2.8-2.8L4 16.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m14.5 5.5 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m5 12 4.2 4.2L19 6.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  const [editing, setEditing] = useState({ full_name: false, phone_number: false });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const verifiedEmail = isVerifiedEmail(currentUser);
  const isDirty =
    form.full_name.trim() !== (currentUser?.full_name || "") ||
    form.phone_number.trim() !== (currentUser?.phone_number || "");

  const toggleEdit = (field) => {
    setMessage("");
    setError("");
    setEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const resetForm = () => {
    setForm(getProfileFormData(currentUser));
    setEditing({ full_name: false, phone_number: false });
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isDirty) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
      };
      const response = await userService.updateProfile(payload);
      const nextUser = response?.user || response?.data?.user || response?.profile || response?.data;
      updateCurrentUser({
        ...currentUser,
        ...payload,
        ...(nextUser && typeof nextUser === "object" ? nextUser : {}),
      });
      setEditing({ full_name: false, phone_number: false });
      setMessage("Cập nhật tài khoản thành công.");
    } catch (err) {
      setError(getErrorMessage(err, "Không thể cập nhật tài khoản."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="profile-form profile-card" onSubmit={handleSubmit}>
      <div className="profile-card-head">
        <span className="profile-avatar">{getProfileInitials(currentUser)}</span>
        <div>
          <h2>{currentUser?.full_name || "Tài khoản QTIK"}</h2>
          <p>Thông tin dùng cho đặt vé, nhận xác nhận và hỗ trợ đơn hàng.</p>
        </div>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="success-banner">{message}</p>}

      <div className="profile-field-list">
        <div className="profile-field-row">
          <label htmlFor="profile-full-name">Họ và tên</label>
          <div className="profile-field-control">
            <input
              id="profile-full-name"
              value={form.full_name}
              disabled={!editing.full_name || saving}
              onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
              required
            />
            <button className="profile-icon-button" type="button" onClick={() => toggleEdit("full_name")} aria-label="Sửa họ và tên">
              <PencilIcon />
            </button>
          </div>
        </div>

        <div className="profile-field-row">
          <label htmlFor="profile-email">Email</label>
          <div className="profile-field-control">
            <input id="profile-email" type="email" value={form.email} disabled readOnly />
            <span className={verifiedEmail ? "profile-verified-badge" : "profile-unverified-badge"}>
              {verifiedEmail && <CheckIcon />}
              {verifiedEmail ? "Đã xác thực" : "Chưa xác thực"}
            </span>
          </div>
        </div>

        <div className="profile-field-row">
          <label htmlFor="profile-phone">Số điện thoại</label>
          <div className="profile-field-control">
            <input
              id="profile-phone"
              value={form.phone_number}
              disabled={!editing.phone_number || saving}
              onChange={(event) => setForm((prev) => ({ ...prev, phone_number: event.target.value }))}
              required
            />
            <button className="profile-icon-button" type="button" onClick={() => toggleEdit("phone_number")} aria-label="Sửa số điện thoại">
              <PencilIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="ghost-button" type="button" onClick={resetForm} disabled={saving}>Hủy</button>
        <button className="primary-button" disabled={saving || !isDirty} type="submit">{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
      </div>
    </form>
  );
};

const passwordInitialState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  otp: "",
};

const getCurrentUserEmail = (user) => user?.email || user?.user?.email || "";

export const ChangePasswordPage = () => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(passwordInitialState);
  const [step, setStep] = useState("password");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validatePasswordForm = () => {
    if (!getCurrentUserEmail(currentUser)) return "Không tìm thấy email tài khoản để gửi OTP.";
    if (!form.currentPassword) return "Vui lòng nhập mật khẩu hiện tại.";
    if (form.newPassword.length < 6) return "Mật khẩu mới phải có ít nhất 6 ký tự.";
    if (form.newPassword !== form.confirmPassword) return "Mật khẩu nhập lại không khớp.";
    if (form.currentPassword === form.newPassword) return "Mật khẩu mới phải khác mật khẩu hiện tại.";
    return "";
  };

  const buildResetPasswordPayload = () => ({
    email: getCurrentUserEmail(currentUser).trim(),
    otp: form.otp.trim(),
    new_password: form.newPassword,
  });

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const validationError = validatePasswordForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const email = getCurrentUserEmail(currentUser).trim();
      await userService.login({ email, password: form.currentPassword });
      const response = await userService.forgotPassword({ email });
      setStep("otp");
      setMessage(response?.message || "Mã OTP xác nhận đã được gửi tới email của bạn.");
    } catch (err) {
      setError(getErrorMessage(err, "Mật khẩu hiện tại không đúng hoặc chưa thể gửi OTP."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();

    if (form.otp.trim().length !== 6) {
      setError("Vui lòng nhập OTP 6 số.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await userService.resetPassword(buildResetPasswordPayload());
      setForm(passwordInitialState);
      setStep("password");
      setMessage(response?.message || "Đổi mật khẩu thành công.");
    } catch (err) {
      setError(getErrorMessage(err, "OTP không hợp lệ hoặc đã hết hạn."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="user-page">
      <header className="page-header">
        <div><span className="page-kicker">Security</span><h1>Đổi mật khẩu</h1><p>Bảo vệ tài khoản QTIK bằng mật khẩu mạnh và xác thực OTP qua email.</p></div>
      </header>

      <div className="password-card">
        <div className="password-steps" aria-label="Tiến trình đổi mật khẩu">
          <span className={step === "password" ? "active" : ""}>1. Mật khẩu</span>
          <span className={step === "otp" ? "active" : ""}>2. OTP</span>
        </div>

        {message && <p className="success-banner">{message}</p>}
        {error && <p className="auth-error">{error}</p>}

        {step === "password" ? (
          <form className="password-form" onSubmit={handlePasswordSubmit}>
            <label>Mật khẩu hiện tại<input type="password" value={form.currentPassword} onChange={(event) => updateForm("currentPassword", event.target.value)} autoComplete="current-password" required /></label>
            <label>Mật khẩu mới<input type="password" value={form.newPassword} onChange={(event) => updateForm("newPassword", event.target.value)} autoComplete="new-password" required /></label>
            <label>Nhập lại mật khẩu mới<input type="password" value={form.confirmPassword} onChange={(event) => updateForm("confirmPassword", event.target.value)} autoComplete="new-password" required /></label>
            <div className="profile-actions">
              <Link className="ghost-button" to="/profile">Hủy</Link>
              <button className="primary-button" type="submit" disabled={loading}>{loading ? "Đang kiểm tra..." : "Tiếp tục"}</button>
            </div>
          </form>
        ) : (
          <form className="password-form" onSubmit={handleOtpSubmit}>
            <label>OTP 6 số<input value={form.otp} inputMode="numeric" maxLength="6" placeholder="123456" onChange={(event) => updateForm("otp", event.target.value.replace(/\D/g, ""))} required /></label>
            <div className="profile-actions">
              <Link className="ghost-button" to="/profile">Hủy</Link>
              <button className="primary-button" type="submit" disabled={loading || form.otp.length !== 6}>{loading ? "Đang xác thực..." : "Xác nhận đổi mật khẩu"}</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

const ProfilePage = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const profileKey = [
    currentUser?.id || currentUser?.email || "profile",
    currentUser?.full_name || currentUser?.fullName || currentUser?.name || "",
    currentUser?.email || "",
    currentUser?.phone_number || "",
    currentUser?.is_active ?? currentUser?.isActive ?? "",
  ].join("-");

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
