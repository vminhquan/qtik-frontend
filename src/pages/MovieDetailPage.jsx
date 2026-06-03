import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { eventService } from "../api/eventService";
import { movieService } from "../api/movieService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/PublicPages.css";

const normalizeList = (response) =>
  Array.isArray(response)
    ? response
    : response?.data || response?.items || response?.results || response?.events || [];
const getEventId = (event) => event.id || event._id || event.event_id;
const getMovieId = (movie) => movie.id || movie._id || movie.film_id;
const getMovieTitle = (event, movie) =>
  event.film?.title || event.movie?.title || event.film_title || event.movie_title || movie?.title || movie?.name || "QTIK Movie";
const getRoomName = (event) => event.room?.name || event.room_name || event.room?.room_name || `Phòng ${event.room_id || "--"}`;
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
  if (!value) return "Đang cập nhật";
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
const getAvailableSeats = (event) =>
  event.available_seats ?? event.availableSeats ?? event.empty_seats ?? event.remaining_seats ?? event.seats_available;
const getTotalSeats = (event) => event.total_seats ?? event.totalSeats ?? event.room?.capacity ?? event.capacity;

const MovieDetailPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const [movieResponse, eventResponse] = await Promise.allSettled([
          movieService.getMovieById(id, { skipAuth: true, skipAuthRedirect: true }),
          eventService.getEvents(
            { film_id: id, movie_id: id },
            { skipAuth: true, skipAuthRedirect: true }
          ),
        ]);

        if (movieResponse.status === "fulfilled") {
          setMovie(movieResponse.value?.data || movieResponse.value);
        } else {
          const moviesResponse = await movieService.getMovies(
            { limit: 100 },
            { skipAuth: true, skipAuthRedirect: true }
          );
          const fallbackMovie = normalizeList(moviesResponse).find((item) => String(getMovieId(item)) === String(id));
          setMovie(fallbackMovie || null);
        }

        if (eventResponse.status === "rejected") throw eventResponse.reason;
        setEvents(normalizeList(eventResponse.value));
      } catch (err) {
        setError(getErrorMessage(err, "Không thể tải lịch chiếu."));
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return events;

    return events.filter((event) => {
      const start = getStartTime(event);
      if (!start) return true;
      return String(start).slice(0, 10) === selectedDate;
    });
  }, [events, selectedDate]);

  if (loading && !movie) return <LoadingState label="Đang tải chi tiết phim..." />;

  return (
    <main className="movie-detail-page">
      {error && <ErrorState message={error} />}
      {movie && (
        <section className="movie-detail-hero">
          <div className="detail-poster">
            {movie.poster_url || movie.posterUrl ? <img src={movie.poster_url || movie.posterUrl} alt={movie.title || movie.name} /> : "QTIK"}
          </div>
          <div>
            <span className="page-kicker">Movie Detail</span>
            <h1>{movie.title || movie.name}</h1>
            <p>{movie.description || "Nội dung phim đang được cập nhật."}</p>
            <dl className="detail-meta">
              <div><dt>Thời lượng</dt><dd>{movie.duration || "--"} phút</dd></div>
              <div><dt>Đạo diễn</dt><dd>{movie.director || "Đang cập nhật"}</dd></div>
              <div><dt>Thể loại</dt><dd>{movie.genre || "Đang cập nhật"}</dd></div>
            </dl>
          </div>
        </section>
      )}

      <section className="showtime-section">
        <header className="page-header">
          <div>
            <span className="page-kicker">Showtimes</span>
            <h1>Lịch chiếu</h1>
          </div>
          <label className="search-box">
            <span>Lọc theo ngày</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
        </header>

        {selectedDate && (
          <button className="ghost-button show-all-button" type="button" onClick={() => setSelectedDate("")}>
            Hiển thị tất cả lịch chiếu
          </button>
        )}

        <div className="showtime-list">
          {filteredEvents.map((event) => (
            <Link className="showtime-item" to={`/booking/${getEventId(event)}`} key={getEventId(event)}>
              <strong>{formatDateTime(getStartTime(event))}</strong>
              <span>
                {getMovieTitle(event, movie)}
                <small>{getRoomName(event)}</small>
              </span>
              <span className="showtime-meta">
                <b>{Number(event.price || event.ticket_price || 0).toLocaleString("vi-VN")} VNĐ</b>
                <small>
                  {getAvailableSeats(event) != null
                    ? `Còn ${getAvailableSeats(event)}${getTotalSeats(event) ? `/${getTotalSeats(event)}` : ""} ghế`
                    : "Bấm để xem ghế"}
                </small>
              </span>
            </Link>
          ))}
          {!filteredEvents.length && <p className="empty-state">Chưa có suất chiếu phù hợp.</p>}
        </div>
      </section>
    </main>
  );
};

export default MovieDetailPage;
