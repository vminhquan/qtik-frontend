import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Armchair,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Film,
  MapPin,
  ReceiptText,
  Tag,
  TicketCheck,
  UserRound,
} from "lucide-react";
import { bookingService } from "../api/bookingService";
import { eventService } from "../api/eventService";
import { movieRoomService } from "../api/movieRoomService";
import { movieService } from "../api/movieService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";
import useCurrentTime from "../hooks/useCurrentTime";
import { getErrorMessage } from "../utils/errorHandler";
import { isShowtimeVisible } from "../utils/showtimeHelper";
import { getUserDisplayName } from "../utils/userHelper";
import "../assets/styles/BookingPage.css";

const unwrapData = (response) => response?.data || response;
const seatCode = (seat) =>
  seat?.seat_code || seat?.code || seat?.name || `S${seat?.id}`;
const seatPrice = (seat, fallbackPrice = 0) =>
  Number(seat?.price || seat?.ticket_price || seat?.amount || fallbackPrice);
const seatStatus = (seat) => {
  const status = seat?.status?.value || seat?.status;
  return String(status || (seat?.is_booked ? "sold" : "available")).toLowerCase();
};
const seatCodeCollator = new Intl.Collator("vi", {
  numeric: true,
  sensitivity: "base",
});
const sortSeatsByCode = (seats) =>
  [...seats].sort((left, right) =>
    seatCodeCollator.compare(seatCode(left), seatCode(right)),
  );
const getFilmId = (event) =>
  event?.film_id || event?.movie_id || event?.film?.id || event?.movie?.id;
const getRoomId = (event) =>
  event?.room_id || event?.room?.id || event?.rooms?.id;
const getStartTime = (event) =>
  event?.start_time ||
  event?.startTime ||
  event?.started_at ||
  event?.show_time ||
  event?.showTime;
const getEventPrice = (event) =>
  Number(
    event?.price ||
      event?.ticket_price ||
      event?.ticketPrice ||
      event?.amount ||
      0,
  );
const getMovieId = (movie) => movie?.id || movie?._id || movie?.film_id;
const getRoomEntityId = (room) => room?.id || room?._id || room?.room_id;
const getMovieTitle = (movie) =>
  movie?.title || movie?.name || movie?.film_name || "Phim đang chiếu";
const getMoviePoster = (movie) => movie?.poster_url || movie?.posterUrl;
const getMovieDuration = (movie) =>
  movie?.duration ||
  movie?.duration_minutes ||
  movie?.runtime ||
  movie?.runtime_minutes;
const formatShowDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
const formatShowTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BookingPage = ({ eventId }) => {
  const [searchParams] = useSearchParams();
  const requestedFilmId = searchParams.get("filmId");
  const [event, setEvent] = useState(null);
  const [movieMap, setMovieMap] = useState({});
  const [roomMap, setRoomMap] = useState({});
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("seats");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const currentTime = useCurrentTime();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const fetchSeatMap = useCallback(async () => {
    if (!eventId) return;

    setLoadingSeats(true);
    setError("");

    try {
      const [eventResponse, seatsResponse] = await Promise.allSettled([
        eventService.getEventById(eventId),
        eventService.getEventSeats(eventId),
      ]);

      if (eventResponse.status === "rejected") throw eventResponse.reason;
      if (seatsResponse.status === "rejected") throw seatsResponse.reason;

      const nextEvent = unwrapData(eventResponse.value);
      setEvent(nextEvent);

      const filmId = getFilmId(nextEvent) || requestedFilmId;
      const roomId = getRoomId(nextEvent);
      const [movieResponse, roomResponse] = await Promise.allSettled([
        filmId ? movieService.getMovieById(filmId) : Promise.resolve(null),
        roomId ? movieRoomService.getRoomById(roomId) : Promise.resolve(null),
      ]);

      if (movieResponse.status === "fulfilled" && movieResponse.value) {
        const movie = unwrapData(movieResponse.value);
        const movieId = getMovieId(movie) || filmId;
        setMovieMap((previous) => ({
          ...previous,
          [String(movieId)]: movie,
        }));
      }

      if (roomResponse.status === "fulfilled" && roomResponse.value) {
        const room = unwrapData(roomResponse.value);
        const resolvedRoomId = getRoomEntityId(room) || roomId;
        setRoomMap((previous) => ({
          ...previous,
          [String(resolvedRoomId)]: room,
        }));
      }

      const seatsPayload = unwrapData(seatsResponse.value);
      const nextSeats = Array.isArray(seatsPayload)
        ? seatsPayload
        : seatsPayload?.seats ||
          seatsPayload?.items ||
          seatsPayload?.results ||
          [];
      setSeats(sortSeatsByCode(nextSeats));
      setSelectedSeats([]);
      setCheckoutStep("seats");
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải sơ đồ ghế."));
    } finally {
      setLoadingSeats(false);
    }
  }, [eventId, requestedFilmId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSeatMap();
  }, [fetchSeatMap]);

  const filmId = getFilmId(event) || requestedFilmId;
  const selectedMovie = movieMap[String(filmId)] || event?.film || event?.movie;
  const selectedRoom = roomMap[String(getRoomId(event))] || event?.room;
  const movieTitle = getMovieTitle(selectedMovie);
  const roomName =
    selectedRoom?.name ||
    selectedRoom?.room_name ||
    event?.room_name ||
    "Phòng đang cập nhật";
  const ticketPrice = useMemo(() => getEventPrice(event), [event]);
  const totalPrice = useMemo(
    () =>
      selectedSeats.reduce(
        (sum, seat) => sum + seatPrice(seat, ticketPrice),
        0,
      ),
    [selectedSeats, ticketPrice],
  );
  const selectedEventVisible = useMemo(
    () => !event || isShowtimeVisible(event, currentTime),
    [event, currentTime],
  );
  const customerName = getUserDisplayName(currentUser, "Chưa cập nhật");
  const customerPhone =
    currentUser?.phone_number || currentUser?.phoneNumber || "Chưa cập nhật";
  const customerEmail = currentUser?.email || "Chưa cập nhật";

  const showCheckoutConfirmation = () => {
    if (!selectedSeats.length) return;
    setCheckoutStep("confirmation");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSeat = (seat) => {
    if (seatStatus(seat) !== "available") return;

    setSelectedSeats((previous) => {
      const exists = previous.some((item) => item.id === seat.id);
      return exists
        ? previous.filter((item) => item.id !== seat.id)
        : [...previous, seat];
    });
  };

  const getSeatClass = (seat) => {
    if (selectedSeats.some((item) => item.id === seat.id)) {
      return "seat-selected";
    }
    if (seatStatus(seat) === "sold") return "seat-sold";
    if (seatStatus(seat) === "held") return "seat-held";
    return "seat-available";
  };

  const handleBookTickets = async () => {
    if (!selectedSeats.length) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const checkout = unwrapData(
        await bookingService.createBooking({
          event_id: eventId,
          seat_ids: selectedSeats.map((seat) => seat.id),
        }),
      );
      const booking = checkout?.booking;
      const order = checkout?.order;

      if (booking?.id && order?.id) {
        navigate(`/payment/${order.id}`, {
          state: { booking, order },
        });
        return;
      }

      setSuccess("Ghế đã được giữ nhưng chưa nhận được thông tin đơn hàng.");
      await fetchSeatMap();
    } catch (err) {
      setError(getErrorMessage(err, "Có lỗi xảy ra khi đặt vé."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="booking-page">
      <nav className="booking-breadcrumb" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to="/#movie-catalog">Đặt vé</Link>
        <span>/</span>
        <strong>{movieTitle}</strong>
      </nav>

      {error && <ErrorState message={error} onRetry={fetchSeatMap} />}
      {success && <p className="success-banner">{success}</p>}

      {loadingSeats && <LoadingState label="Đang tải sơ đồ ghế..." />}

      {!loadingSeats && event && !selectedEventVisible && (
        <div className="booking-placeholder">
          <strong>Suất chiếu đã kết thúc</strong>
          <span>Vui lòng quay lại trang chủ và chọn một suất chiếu khác.</span>
          <Link className="primary-button" to="/#movie-catalog">
            Chọn suất chiếu khác
          </Link>
        </div>
      )}

      {!loadingSeats && event && selectedEventVisible && (
        <div className="booking-workspace">
          <section className="seat-selection-panel">
            <div className="booking-notice">
              Vui lòng kiểm tra đúng phim, giờ chiếu và ghế trước khi tiếp tục.
            </div>

            {checkoutStep === "seats" ? (
              <>
                <div className="seat-legend">
                  <span><i className="legend-available" /> Ghế trống</span>
                  <span><i className="legend-selected" /> Ghế đang chọn</span>
                  <span><i className="legend-held" /> Ghế đang giữ</span>
                  <span><i className="legend-sold" /> Ghế đã bán</span>
                </div>

                <div className="seat-map-panel">
                  <div className="booking-page-screen">
                    <span>MÀN HÌNH CHIẾU</span>
                  </div>

                  <div className="booking-page-grid">
                    {seats.map((seat) => (
                      <button
                        key={seat.id}
                        className={`booking-page-seat ${getSeatClass(seat)}`}
                        onClick={() => toggleSeat(seat)}
                        disabled={seatStatus(seat) !== "available"}
                        type="button"
                        title={`${seatCode(seat)} - ${seatStatus(seat)}`}
                      >
                        {seatCode(seat)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <section className="booking-confirmation">
                <header>
                  <UserRound aria-hidden="true" />
                  <div>
                    <span className="page-kicker">Xác nhận đặt vé</span>
                    <h2>Thông tin thanh toán</h2>
                  </div>
                </header>

                <div className="booking-customer-grid">
                  <div>
                    <span>Họ tên</span>
                    <strong>{customerName}</strong>
                  </div>
                  <div>
                    <span>Số điện thoại</span>
                    <strong>{customerPhone}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{customerEmail}</strong>
                  </div>
                </div>

                <div className="booking-ticket-review">
                  <div className="booking-ticket-title">
                    <ReceiptText aria-hidden="true" />
                    <div>
                      <span>Vé xem phim </span>
                      <strong>{movieTitle}</strong>
                    </div>
                  </div>
                  <div>
                    <span>Ghế</span>
                    <strong>{selectedSeats.map(seatCode).join(", ")}</strong>
                  </div>
                  <div>
                    <span>Số lượng</span>
                    <strong>
                      {selectedSeats.length} x{" "}
                      {ticketPrice.toLocaleString("vi-VN")} VNĐ
                    </strong>
                  </div>
                  <div className="booking-ticket-total">
                    <span>Tổng tiền</span>
                    <strong>{totalPrice.toLocaleString("vi-VN")} VNĐ</strong>
                  </div>
                </div>

                <p className="booking-confirmation-note">
                  Vui lòng kiểm tra thông tin trước khi tạo đơn hàng và chuyển
                  sang thanh toán.
                </p>
              </section>
            )}

            {checkoutStep === "seats" && (
              <div className="booking-total-bar">
                <div>
                  <span>Ghế đã chọn</span>
                  <strong>
                    {selectedSeats.length} x{" "}
                    {ticketPrice.toLocaleString("vi-VN")} VNĐ
                  </strong>
                </div>
                <div>
                  <span>Tổng tiền</span>
                  <strong>{totalPrice.toLocaleString("vi-VN")} VNĐ</strong>
                </div>
              </div>
            )}
          </section>

          <aside className="booking-summary">
            <div className="booking-movie-overview">
              <div className="booking-movie-poster">
                {getMoviePoster(selectedMovie) ? (
                  <img src={getMoviePoster(selectedMovie)} alt={movieTitle} />
                ) : (
                  <Film aria-hidden="true" />
                )}
              </div>
              <div>
                <h1>{movieTitle}</h1>
                <span>{roomName}</span>
              </div>
            </div>

            <dl>
              <div>
                <dt><Tag aria-hidden="true" /> Thể loại</dt>
                <dd>{selectedMovie?.genre || "Đang cập nhật"}</dd>
              </div>
              <div>
                <dt><Clock3 aria-hidden="true" /> Thời lượng</dt>
                <dd>
                  {getMovieDuration(selectedMovie)
                    ? `${getMovieDuration(selectedMovie)} phút`
                    : "Đang cập nhật"}
                </dd>
              </div>
              <div>
                <dt><MapPin aria-hidden="true" /> Phòng chiếu</dt>
                <dd>{roomName}</dd>
              </div>
              <div>
                <dt><CalendarDays aria-hidden="true" /> Ngày chiếu</dt>
                <dd>{formatShowDate(getStartTime(event))}</dd>
              </div>
              <div>
                <dt><Clock3 aria-hidden="true" /> Giờ chiếu</dt>
                <dd>{formatShowTime(getStartTime(event))}</dd>
              </div>
              <div>
                <dt><Armchair aria-hidden="true" /> Ghế ngồi</dt>
                <dd>{selectedSeats.map(seatCode).join(", ") || "Chưa chọn"}</dd>
              </div>
            </dl>

            {checkoutStep === "seats" ? (
              <button
                className="primary-button booking-summary-action"
                type="button"
                onClick={showCheckoutConfirmation}
                disabled={selectedSeats.length === 0}
              >
                Tiếp tục
              </button>
            ) : (
              <div className="booking-summary-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setCheckoutStep("seats")}
                  disabled={submitting}
                >
                  <ArrowLeft aria-hidden="true" />
                  Quay lại
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleBookTickets}
                  disabled={submitting}
                >
                  {!submitting && <TicketCheck aria-hidden="true" />}
                  {submitting ? "Đang xử lý..." : "Tiếp tục"}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
};

export default BookingPage;
