import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingService } from "../api/bookingService";
import { eventService } from "../api/eventService";
import { movieService } from "../api/movieService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import useCurrentTime from "../hooks/useCurrentTime";
import { getErrorMessage } from "../utils/errorHandler";
import { isShowtimeVisible } from "../utils/showtimeHelper";
import "../assets/styles/BookingPage.css";

const seatCode = (seat) => seat.seat_code || seat.code || seat.name || `S${seat.id}`;
const seatPrice = (seat, fallbackPrice = 0) => Number(seat.price || seat.ticket_price || seat.amount || fallbackPrice || 0);
const seatStatus = (seat) => seat.status || (seat.is_booked ? "sold" : "available");
const unwrapData = (response) => response?.data || response;
const getMovieTitle = (event) =>
  event?.film?.title || event?.movie?.title || event?.film_title || event?.movie_title || event?.title || "Phim đang chiếu";
const getFilmId = (event) => event?.film_id || event?.movie_id || event?.film?.id || event?.movie?.id;
const getRoomName = (event) => event?.room?.name || event?.room_name || event?.room?.room_name || `Rạp/Phòng ${event?.room_id || "--"}`;
const getStartTime = (event) => {
  if (!event) return null;
  if (event.start_time || event.startTime || event.started_at || event.show_time || event.showTime) {
    return event.start_time || event.startTime || event.started_at || event.show_time || event.showTime;
  }
  if ((event.show_date || event.showDate) && (event.time || event.start_hour || event.startHour)) {
    return `${event.show_date || event.showDate}T${event.time || event.start_hour || event.startHour}`;
  }
  return null;
};
const formatDateTime = (value) => {
  if (!value) return "Giờ chiếu đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
const normalizeList = (response) => {
  const payload = unwrapData(response);
  return Array.isArray(payload) ? payload : payload?.items || payload?.results || payload?.events || [];
};
const getEventId = (event) => event?.id || event?._id || event?.event_id;
const getAvailableSeats = (event) =>
  event?.available_seats ?? event?.availableSeats ?? event?.remaining_seats ?? event?.seats_available;
const getTotalSeats = (event) => event?.total_seats ?? event?.totalSeats ?? event?.room?.capacity ?? event?.capacity;
const getEventPrice = (event) => Number(event?.price || event?.ticket_price || event?.ticketPrice || event?.amount || 0);
const getMovieId = (movie) => movie?.id || movie?._id || movie?.film_id;

const BookingPage = ({ eventId = null }) => {
  const lockedEventMode = Boolean(eventId);
  const [events, setEvents] = useState([]);
  const [movieMap, setMovieMap] = useState({});
  const [selectedEventId, setSelectedEventId] = useState(eventId);
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const currentTime = useCurrentTime();
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    setError("");

    try {
      const [eventResponse, movieResponse] = await Promise.allSettled([
        eventService.getEvents({ limit: 100 }),
        movieService.getMovies({ limit: 200 }),
      ]);

      if (eventResponse.status === "rejected") throw eventResponse.reason;

      if (movieResponse.status === "fulfilled") {
        const movies = normalizeList(movieResponse.value);
        setMovieMap(
          movies.reduce((acc, movie) => {
            const id = movie.id || movie._id || movie.film_id;
            if (id) acc[String(id)] = movie;
            return acc;
          }, {})
        );
      }

      const response = eventResponse.value;
      setEvents(normalizeList(response).filter((item) => isShowtimeVisible(item)));
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách suất chiếu."));
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const fetchSeatMap = useCallback(async () => {
    if (!selectedEventId) return;

    setLoadingSeats(true);
    setError("");

    try {
      const [eventResponse, seatsResponse] = await Promise.allSettled([
        eventService.getEventById(selectedEventId),
        eventService.getEventSeats(selectedEventId),
      ]);

      const nextEvent = eventResponse.status === "fulfilled" ? unwrapData(eventResponse.value) : null;
      if (nextEvent) {
        setEvent(nextEvent);

        const filmId = getFilmId(nextEvent);
        if (getMovieTitle(nextEvent) === "Phim đang chiếu" && filmId) {
          try {
            const movie = unwrapData(await movieService.getMovieById(filmId));
            const movieId = getMovieId(movie) || filmId;
            setMovieMap((prev) => ({ ...prev, [String(movieId)]: movie }));
          } catch {
            // Event details can still render with the fallback title if film detail is unavailable.
          }
        }
      }
      if (seatsResponse.status === "rejected") throw seatsResponse.reason;

      const seatsPayload = unwrapData(seatsResponse.value);
      const nextSeats = Array.isArray(seatsPayload)
        ? seatsPayload
        : seatsPayload?.seats || seatsPayload?.items || seatsPayload?.results || [];

      if (eventResponse.status !== "fulfilled" && seatsPayload?.event) {
        setEvent(seatsPayload.event);
      }
      setSeats(nextSeats);
      setSelectedSeats([]);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải sơ đồ ghế."));
    } finally {
      setLoadingSeats(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (lockedEventMode) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
  }, [fetchEvents, lockedEventMode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSeatMap();
  }, [fetchSeatMap]);

  const ticketPrice = useMemo(() => getEventPrice(event), [event]);
  const totalPrice = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + seatPrice(seat, ticketPrice), 0),
    [selectedSeats, ticketPrice]
  );
  const availableSeatCount = useMemo(
    () => seats.filter((seat) => seatStatus(seat) === "available").length,
    [seats]
  );
  const soldSeatCount = useMemo(
    () => seats.filter((seat) => seatStatus(seat) === "sold").length,
    [seats]
  );
  const heldSeatCount = useMemo(
    () => seats.filter((seat) => seatStatus(seat) === "held").length,
    [seats]
  );
  const visibleEvents = useMemo(
    () => events.filter((item) => isShowtimeVisible(item, currentTime)),
    [events, currentTime]
  );
  const selectedEventVisible = useMemo(
    () => !event || isShowtimeVisible(event, currentTime),
    [event, currentTime]
  );

  const selectEvent = (nextEvent) => {
    const nextEventId = getEventId(nextEvent);
    setSelectedEventId(nextEventId);
    setEvent(nextEvent);
    setSeats([]);
    setSelectedSeats([]);
    setSuccess("");
    navigate(`/booking/${nextEventId}`, { replace: false });
  };

  const resolveMovieTitle = (nextEvent) => {
    const title = getMovieTitle(nextEvent);
    if (title !== "Phim đang chiếu") return title;

    const movie = movieMap[String(getFilmId(nextEvent))];
    return movie?.title || movie?.name || movie?.film_name || `Phim #${getFilmId(nextEvent) || "--"}`;
  };

  const toggleSeat = (seat) => {
    if (seatStatus(seat) !== "available") return;

    setSelectedSeats((prev) => {
      const exists = prev.some((item) => item.id === seat.id);
      return exists ? prev.filter((item) => item.id !== seat.id) : [...prev, seat];
    });
  };

  const getSeatClass = (seat) => {
    if (selectedSeats.some((item) => item.id === seat.id)) return "seat-selected";
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
      const payload = {
        event_id: selectedEventId,
        eventId: selectedEventId,
        seat_ids: selectedSeats.map((seat) => seat.id),
        seatIds: selectedSeats.map((seat) => seat.id),
      };

      const booking = await bookingService.createBooking(payload);
      const bookingId = booking?.id || booking?._id || booking?.booking_id || booking?.data?.id;

      if (bookingId) {
        navigate(`/payment/${bookingId}`, {
          state: {
            booking,
            expiresAt: Date.now() + 5 * 60 * 1000,
          },
        });
        return;
      }

      setSuccess("Giữ ghế thành công. Vui lòng chuyển sang bước thanh toán.");
      await fetchSeatMap();
    } catch (err) {
      setError(getErrorMessage(err, "Có lỗi xảy ra khi đặt vé."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="booking-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Booking Flow</span>
          <h1>{lockedEventMode ? "Chọn ghế" : "Chọn suất chiếu"}</h1>
          <p>
            {lockedEventMode
              ? "Sơ đồ ghế của suất chiếu bạn đã chọn đang hiển thị bên dưới."
              : "Chọn phim và giờ chiếu bạn muốn, hệ thống sẽ mở sơ đồ ghế để bạn chọn chỗ và xác nhận đặt vé."}
          </p>
        </div>
        {lockedEventMode ? (
          <button className="ghost-button" type="button" onClick={() => navigate("/booking")}>
            Đổi suất chiếu
          </button>
        ) : (
          <button className="ghost-button" type="button" onClick={fetchEvents}>
            Làm mới lịch chiếu
          </button>
        )}
      </header>

      {error && <ErrorState message={error} onRetry={selectedEventId ? fetchSeatMap : fetchEvents} />}
      {success && <p className="success-banner">{success}</p>}

      {!lockedEventMode && (
      <section className="booking-showtimes">
        {loadingEvents ? (
          <LoadingState label="Đang tải danh sách suất chiếu..." />
        ) : (
          <div className="booking-showtime-grid">
            {visibleEvents.map((item) => {
              const itemId = getEventId(item);
              const isActive = String(itemId) === String(selectedEventId);

              return (
                <button
                  className={isActive ? "booking-showtime-card active" : "booking-showtime-card"}
                  key={itemId}
                  type="button"
                  onClick={() => selectEvent(item)}
                >
                  <strong>{resolveMovieTitle(item)}</strong>
                  <span>{formatDateTime(getStartTime(item))}</span>
                  <small>{getRoomName(item)}</small>
                  <small>
                    {getAvailableSeats(item) != null
                      ? `Còn ${getAvailableSeats(item)}${getTotalSeats(item) ? `/${getTotalSeats(item)}` : ""} ghế`
                      : "Bấm để xem ghế"}
                  </small>
                </button>
              );
            })}
            {!visibleEvents.length && <p className="empty-state">Chưa có suất chiếu nào.</p>}
          </div>
        )}
      </section>
      )}

      {!lockedEventMode && !selectedEventId && !loadingEvents && (
        <div className="booking-placeholder">
          <strong>Hãy chọn một suất chiếu</strong>
          <span>Sơ đồ ghế sẽ hiện ngay bên dưới sau khi bạn chọn giờ chiếu.</span>
        </div>
      )}

      {selectedEventId && selectedEventVisible && (
        <header className="booking-selected-header">
          <div>
            <span className="page-kicker">Selected Showtime</span>
            <h2>{formatDateTime(getStartTime(event))} - {resolveMovieTitle(event)}</h2>
            <p>{getRoomName(event)} còn {availableSeatCount}/{seats.length || 0} ghế trống.</p>
            <div className="booking-event-meta">
              <span>Suất chiếu #{selectedEventId}</span>
              <span>{getRoomName(event)}</span>
              <span>Còn {availableSeatCount} ghế</span>
            </div>
          </div>
          <button className="ghost-button" type="button" onClick={fetchSeatMap}>
            Làm mới ghế
          </button>
        </header>
      )}

      {selectedEventId && event && !selectedEventVisible && !loadingSeats && (
        <div className="booking-placeholder">
          <strong>Suất chiếu đã kết thúc</strong>
          <span>Vui lòng chọn một suất chiếu khác còn hiệu lực.</span>
        </div>
      )}

      {loadingSeats && <LoadingState label="Đang tải sơ đồ ghế..." />}

      {selectedEventId && selectedEventVisible && !loadingSeats && (
      <div className="booking-workspace">
        <div className="seat-map-panel">
          <div className="booking-page-screen">MÀN HÌNH</div>

          <div className="booking-page-grid">
            {seats.map((seat) => (
              <button
                key={seat.id || seat._id}
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

          <div className="seat-legend">
            <span><i className="legend-available" /> Trống</span>
            <span><i className="legend-selected" /> Đang chọn</span>
            <span><i className="legend-held" /> Đang giữ</span>
            <span><i className="legend-sold" /> Đã bán</span>
          </div>
        </div>

        <aside className="booking-summary">
          <span className="page-kicker">Order Summary</span>
          <h2>Thông tin đặt vé</h2>
          <dl>
            <div>
              <dt>Số ghế</dt>
              <dd>{selectedSeats.length}</dd>
            </div>
            <div>
              <dt>Ghế còn trống</dt>
              <dd>{availableSeatCount}</dd>
            </div>
            <div>
              <dt>Đang giữ / Đã bán</dt>
              <dd>{heldSeatCount} / {soldSeatCount}</dd>
            </div>
            <div>
              <dt>Ghế đã chọn</dt>
              <dd>{selectedSeats.map(seatCode).join(", ") || "Chưa chọn"}</dd>
            </div>
            <div>
              <dt>Tổng tiền</dt>
              <dd>{totalPrice.toLocaleString("vi-VN")} VNĐ</dd>
            </div>
          </dl>

          <button
            className="primary-button"
            type="button"
            onClick={handleBookTickets}
            disabled={submitting || selectedSeats.length === 0}
          >
            {submitting ? "Đang xử lý..." : `Xác nhận ${selectedSeats.length} vé`}
          </button>
        </aside>
      </div>
      )}
    </section>
  );
};

export default BookingPage;
