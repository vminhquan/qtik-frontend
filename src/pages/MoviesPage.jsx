import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Search, Ticket, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { eventService } from "../api/eventService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import useMovies from "../hooks/useMovies";
import { getErrorMessage } from "../utils/errorHandler";
import { isShowtimeVisible } from "../utils/showtimeHelper";
import heroImage from "../assets/hero.png";
import "../assets/styles/PublicPages.css";

const getMovieId = (movie) => movie?.id || movie?._id || movie?.film_id;
const getMoviePoster = (movie) =>
  movie?.poster_url || movie?.posterUrl || heroImage;
const getMovieTitle = (movie) =>
  movie?.title || movie?.name || movie?.film_name || "QTIK Movie";
const getMovieDuration = (movie) =>
  movie?.duration ||
  movie?.duration_minutes ||
  movie?.runtime ||
  movie?.runtime_minutes;
const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  const payload = response?.data || response;
  return Array.isArray(payload)
    ? payload
    : payload?.items || payload?.results || payload?.events || [];
};
const getEventId = (event) => event?.id || event?._id || event?.event_id;
const getEventStartTime = (event) =>
  event?.start_time || event?.startTime || event?.show_time;
const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const formatShowtimeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const pad = (part) => String(part).padStart(2, "0");
  return {
    date: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`,
    weekday: weekdays[date.getDay()],
  };
};
const formatShowtimeTime = (value) =>
  new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
const formatEventPrice = (event) =>
  `${Number(event?.price || 0).toLocaleString("vi-VN")} VNĐ`;

const MoviesPage = () => {
  const navigate = useNavigate();
  const requestRef = useRef(0);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [showtimeError, setShowtimeError] = useState("");
  const {
    movies,
    page,
    limit,
    total,
    search,
    loading,
    error,
    setPage,
    setSearch,
    refetch,
  } = useMovies({ initialLimit: 12, publicMode: true });
  const dateOptions = useMemo(() => {
    const dates = new Map();
    showtimes.forEach((event) => {
      const startTime = getEventStartTime(event);
      const key = getDateKey(startTime);
      if (key && !dates.has(key)) dates.set(key, startTime);
    });
    return [...dates.entries()].map(([key, value]) => ({ key, value }));
  }, [showtimes]);
  const visibleShowtimes = useMemo(
    () =>
      showtimes.filter(
        (event) => getDateKey(getEventStartTime(event)) === selectedDate,
      ),
    [selectedDate, showtimes],
  );

  useEffect(() => {
    if (!selectedMovie) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedMovie(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedMovie]);

  const openShowtimes = async (movie) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setSelectedMovie(movie);
    setShowtimes([]);
    setSelectedDate("");
    setShowtimeError("");
    setLoadingShowtimes(true);
    try {
      const response = await eventService.getSchedule(
        { film_id: getMovieId(movie), limit: 100 },
        { skipAuth: true, skipAuthRedirect: true },
      );
      if (requestRef.current !== requestId) return;
      const events = normalizeList(response)
        .filter((event) => isShowtimeVisible(event))
        .sort(
          (left, right) =>
            new Date(getEventStartTime(left)).getTime() -
            new Date(getEventStartTime(right)).getTime(),
        );
      setShowtimes(events);
      setSelectedDate(events[0] ? getDateKey(getEventStartTime(events[0])) : "");
    } catch (err) {
      if (requestRef.current === requestId) {
        setShowtimeError(getErrorMessage(err, "Không thể tải lịch chiếu."));
      }
    } finally {
      if (requestRef.current === requestId) setLoadingShowtimes(false);
    }
  };

  const closeShowtimes = () => {
    requestRef.current += 1;
    setSelectedMovie(null);
  };

  const selectShowtime = (event) => {
    navigate(`/booking/${getEventId(event)}?filmId=${getMovieId(selectedMovie)}`);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="movies-page">
      <header className="page-header movies-page-header">
        <div>
          <span className="page-kicker">Movie catalog</span>
          <h1>Tất Cả Phim</h1>
        </div>
        <label className="search-box">
          <span>Tìm phim</span>
          <div className="search-control">
            <Search aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhập tên phim..."
            />
          </div>
        </label>
      </header>

      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading ? (
        <LoadingState label="Đang tải phim..." />
      ) : (
        <div className="public-movie-grid">
          {movies.map((movie, index) => (
            <article
              className="public-movie-card"
              key={getMovieId(movie)}
              style={{ animationDelay: `${Math.min(index * 45, 300)}ms` }}
            >
              <button
                className="movie-card-button"
                type="button"
                onClick={() => openShowtimes(movie)}
              >
                <div className="public-poster">
                  <img src={getMoviePoster(movie)} alt={getMovieTitle(movie)} />
                </div>
                <h2>{getMovieTitle(movie)}</h2>
                <div className="movie-card-meta">
                  <span>
                    <strong>Thể loại:</strong>
                    {movie.genre || "Đang cập nhật"}
                  </span>
                  <span>
                    <strong>Thời lượng:</strong>
                    {getMovieDuration(movie)
                      ? `${getMovieDuration(movie)} phút`
                      : "Đang cập nhật"}
                  </span>
                </div>
                <span className="movie-card-cta">
                  <Ticket aria-hidden="true" />
                  Mua vé
                </span>
              </button>
            </article>
          ))}
          {!movies.length && (
            <p className="empty-state">Không tìm thấy phim phù hợp.</p>
          )}
        </div>
      )}

      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={handlePageChange}
      />

      {selectedMovie && (
        <div
          className="showtime-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeShowtimes();
          }}
        >
          <section
            className="showtime-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="movies-showtime-title"
          >
            <header className="showtime-modal-header">
              <div>
                <span className="page-kicker">Lịch chiếu</span>
                <h2 id="movies-showtime-title">
                  {getMovieTitle(selectedMovie)}
                </h2>
              </div>
              <button
                className="showtime-modal-close"
                type="button"
                onClick={closeShowtimes}
                aria-label="Đóng lịch chiếu"
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <div className="showtime-modal-body">
              <h3>QTIK Cinema</h3>
              {loadingShowtimes && (
                <LoadingState label="Đang tải lịch chiếu..." />
              )}
              {showtimeError && (
                <ErrorState
                  message={showtimeError}
                  onRetry={() => openShowtimes(selectedMovie)}
                />
              )}
              {!loadingShowtimes && !showtimeError && (
                <>
                  <div className="showtime-date-tabs" role="tablist">
                    {dateOptions.map(({ key, value }) => {
                      const label = formatShowtimeDate(value);
                      return (
                        <button
                          className={key === selectedDate ? "active" : ""}
                          key={key}
                          type="button"
                          role="tab"
                          aria-selected={key === selectedDate}
                          onClick={() => setSelectedDate(key)}
                        >
                          <strong>{label?.date}</strong>
                          <span>- {label?.weekday}</span>
                        </button>
                      );
                    })}
                  </div>
                  {visibleShowtimes.length ? (
                    <div className="showtime-modal-list">
                      <strong>Suất chiếu</strong>
                      <div className="showtime-time-grid">
                        {visibleShowtimes.map((event) => (
                          <button
                            key={getEventId(event)}
                            type="button"
                            onClick={() => selectShowtime(event)}
                          >
                            <Clock3 aria-hidden="true" />
                            <span>
                              <strong>
                                {formatShowtimeTime(getEventStartTime(event))}
                              </strong>
                              <small>{formatEventPrice(event)}</small>
                              <small className="showtime-seat-count">
                                {event.available_seats} ghế trống
                              </small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="showtime-modal-empty">
                      <Ticket aria-hidden="true" />
                      <strong>Chưa có suất chiếu phù hợp</strong>
                      <span>Lịch chiếu mới sẽ được cập nhật sớm.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default MoviesPage;
