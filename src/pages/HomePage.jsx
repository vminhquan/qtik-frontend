import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, Ticket, X } from "lucide-react";
import { eventService } from "../api/eventService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import useMovies from "../hooks/useMovies";
import { getErrorMessage } from "../utils/errorHandler";
import { isShowtimeVisible } from "../utils/showtimeHelper";
import heroImage from "../assets/hero.png";
import "../assets/styles/PublicPages.css";

const getMovieId = (movie) => movie?.id || movie?._id || movie?.film_id;
const movieTitle = (movie) =>
  movie?.title || movie?.name || movie?.film_name || "QTIK Movie";
const getMoviePoster = (movie) =>
  movie?.poster_url ||
  movie?.posterUrl ||
  movie?.banner_url ||
  movie?.bannerUrl ||
  heroImage;
const getReleaseDate = (movie) =>
  movie?.release_date ||
  movie?.releaseDate ||
  movie?.premiere_date ||
  movie?.premiereDate;
const formatReleaseDate = (value) => {
  if (!value) return "Ngày khởi chiếu đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `Khởi chiếu ${date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
};
const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  const payload = response?.data || response;
  return Array.isArray(payload)
    ? payload
    : payload?.items ||
        payload?.results ||
        payload?.events ||
        payload?.seats ||
        [];
};
const getEventId = (event) => event?.id || event?._id || event?.event_id;
const getEventFilmId = (event) =>
  event?.film_id || event?.movie_id || event?.film?.id || event?.movie?.id;
const getEventStartTime = (event) =>
  event?.start_time ||
  event?.startTime ||
  event?.started_at ||
  event?.show_time ||
  event?.showTime;
const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const formatShowtimeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (part) => String(part).padStart(2, "0");
  const weekdays = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];

  return {
    date: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`,
    weekday: weekdays[date.getDay()],
  };
};
const formatShowtimeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
const formatEventPrice = (event) => {
  const price = Number(
    event?.price || event?.ticket_price || event?.ticketPrice || 0,
  );
  return price > 0 ? `${price.toLocaleString("vi-VN")} VNĐ` : "Xem giá vé";
};
const getAvailableSeatCount = (event) =>
  event?.availableSeatCount ??
  event?.available_seats ??
  event?.availableSeats ??
  event?.remaining_seats ??
  event?.seats_available;

const HomePage = () => {
  const navigate = useNavigate();
  const showtimeRequestRef = useRef(0);
  const { movies, loading, error, refetch } = useMovies({
    initialLimit: 8,
    publicMode: true,
    filters: { is_hot: true },
  });
  const [heroIndex, setHeroIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [showtimeMovie, setShowtimeMovie] = useState(null);
  const [showtimeEvents, setShowtimeEvents] = useState([]);
  const [selectedShowtimeDate, setSelectedShowtimeDate] = useState("");
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [showtimeError, setShowtimeError] = useState("");
  const heroMovies = useMemo(() => movies.slice(0, 6), [movies]);
  const safeHeroIndex = heroMovies.length ? heroIndex % heroMovies.length : 0;
  const heroMovie = heroMovies[safeHeroIndex] || movies[0];
  const showtimeDates = useMemo(() => {
    const uniqueDates = new Map();
    showtimeEvents.forEach((event) => {
      const startTime = getEventStartTime(event);
      const dateKey = getDateKey(startTime);
      if (dateKey && !uniqueDates.has(dateKey)) {
        uniqueDates.set(dateKey, startTime);
      }
    });
    return [...uniqueDates.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({ key, value }));
  }, [showtimeEvents]);
  const visibleShowtimes = useMemo(
    () =>
      showtimeEvents.filter(
        (event) =>
          getDateKey(getEventStartTime(event)) === selectedShowtimeDate,
      ),
    [selectedShowtimeDate, showtimeEvents],
  );

  useEffect(() => {
    if (
      heroMovies.length <= 1 ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setHeroIndex((current) => (current + 1) % heroMovies.length);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [heroMovies.length, safeHeroIndex]);

  useEffect(() => {
    if (!showtimeMovie) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowtimeMovie(null);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showtimeMovie]);

  const moveHero = (direction) => {
    if (!heroMovies.length) return;
    setHeroIndex(
      (current) =>
        (current + direction + heroMovies.length) % heroMovies.length,
    );
  };

  const handleDragEnd = (clientX) => {
    if (dragStartX == null) return;
    const distance = clientX - dragStartX;
    if (Math.abs(distance) > 42) moveHero(distance < 0 ? 1 : -1);
    setDragStartX(null);
  };

  const closeMovieShowtimes = () => {
    showtimeRequestRef.current += 1;
    setShowtimeMovie(null);
  };

  const openMovieShowtimes = async (movie) => {
    const movieId = getMovieId(movie);
    if (!movieId) return;

    const requestId = showtimeRequestRef.current + 1;
    showtimeRequestRef.current = requestId;
    setShowtimeMovie(movie);
    setShowtimeEvents([]);
    setSelectedShowtimeDate("");
    setShowtimeError("");
    setLoadingShowtimes(true);

    try {
      const response = await eventService.getSchedule(
        { film_id: movieId, limit: 100 },
        { skipAuth: true, skipAuthRedirect: true },
      );
      if (showtimeRequestRef.current !== requestId) return;

      const nextEvents = normalizeList(response)
        .filter(
          (event) =>
            String(getEventFilmId(event)) === String(movieId) &&
            isShowtimeVisible(event),
        )
        .sort(
          (left, right) =>
            new Date(getEventStartTime(left)).getTime() -
            new Date(getEventStartTime(right)).getTime(),
        );

      if (showtimeRequestRef.current !== requestId) return;
      setShowtimeEvents(nextEvents);
      setSelectedShowtimeDate(
        nextEvents.length ? getDateKey(getEventStartTime(nextEvents[0])) : "",
      );
    } catch (error) {
      if (showtimeRequestRef.current !== requestId) return;
      setShowtimeError(
        getErrorMessage(error, "Không thể tải lịch chiếu của phim."),
      );
    } finally {
      if (showtimeRequestRef.current === requestId) {
        setLoadingShowtimes(false);
      }
    }
  };

  const selectShowtime = (event) => {
    const eventId = getEventId(event);
    const movieId = getMovieId(showtimeMovie);
    if (!eventId || !movieId) return;
    closeMovieShowtimes();
    navigate(`/booking/${eventId}?filmId=${movieId}`);
  };

  const handleHeroShowtimes = () => {
    if (!heroMovie) return;
    openMovieShowtimes(heroMovie);
  };

  return (
    <main className="home-page">
      <section
        className="home-hero"
        onMouseDown={(event) => setDragStartX(event.clientX)}
        onMouseUp={(event) => handleDragEnd(event.clientX)}
        onTouchStart={(event) => setDragStartX(event.touches[0].clientX)}
        onTouchEnd={(event) => handleDragEnd(event.changedTouches[0].clientX)}
      >
        <div
          className="home-hero-track"
          style={{ transform: `translate3d(-${safeHeroIndex * 100}%, 0, 0)` }}
          aria-hidden="true"
        >
          {(heroMovies.length ? heroMovies : [null]).map((movie) => (
            <div
              className="home-hero-slide"
              key={getMovieId(movie) || "hero-fallback"}
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.68) 0%, rgba(79, 70, 229, 0.4) 48%, rgba(14, 165, 233, 0.16) 100%), linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(15, 23, 42, 0.3)), url("${getMoviePoster(movie)}")`,
              }}
            />
          ))}
        </div>

        <div
          className="home-hero-content"
          key={getMovieId(heroMovie) || "hero-content"}
        >
          <span className="page-kicker">
            {formatReleaseDate(getReleaseDate(heroMovie))}
          </span>
          <h1>{heroMovie ? movieTitle(heroMovie) : "QTIK Cinema"}</h1>

          <button
            className="primary-button"
            type="button"
            onClick={handleHeroShowtimes}
            disabled={!heroMovie}
          >
            <Ticket aria-hidden="true" />
            Chọn suất chiếu
          </button>
        </div>

        {heroMovies.length > 1 && (
          <div className="hero-dots" aria-label="Danh sách poster">
            {heroMovies.map((movie, index) => (
              <button
                className={index === safeHeroIndex ? "active" : ""}
                key={getMovieId(movie)}
                type="button"
                onClick={() => setHeroIndex(index)}
                aria-label={`Xem poster ${movieTitle(movie)}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="movie-section" id="movie-catalog">
        <header className="page-header">
          <div>
            <h1 className="page-kicker">Hot movies</h1>
          </div>
        </header>

        {error && <ErrorState message={error} onRetry={refetch} />}
        {loading ? (
          <LoadingState label="Đang tải phim..." />
        ) : (
          <div className="public-movie-grid home-hot-movie-grid">
            {movies.map((movie, index) => {
              const movieId = getMovieId(movie);

              return (
                <article
                  className="public-movie-card"
                  key={movieId}
                  style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
                >
                  <button
                    className="movie-card-button"
                    type="button"
                    onClick={() => openMovieShowtimes(movie)}
                  >
                    <div className="public-poster">
                      {movie.poster_url || movie.posterUrl ? (
                        <img
                          src={movie.poster_url || movie.posterUrl}
                          alt={movie.title || movie.name}
                        />
                      ) : (
                        <span>
                          {(movie.title || movie.name || "QT")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="home-movie-release">
                      {formatReleaseDate(getReleaseDate(movie))}
                    </span>
                    <span className="movie-card-cta">
                      <Ticket aria-hidden="true" />
                      Mua vé
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showtimeMovie && (
        <div
          className="showtime-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMovieShowtimes();
          }}
        >
          <section
            className="showtime-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="showtime-modal-title"
          >
            <header className="showtime-modal-header">
              <div>
                <span className="page-kicker">Lịch chiếu</span>
                <h2 id="showtime-modal-title">{movieTitle(showtimeMovie)}</h2>
              </div>
              <button
                className="showtime-modal-close"
                type="button"
                onClick={closeMovieShowtimes}
                aria-label="Đóng lịch chiếu"
                title="Đóng"
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
                  onRetry={() => openMovieShowtimes(showtimeMovie)}
                />
              )}

              {!loadingShowtimes && !showtimeError && (
                <>
                  <div
                    className="showtime-date-tabs"
                    role="tablist"
                    aria-label="Chọn ngày chiếu"
                  >
                    {showtimeDates.map(({ key, value }) => {
                      const dateLabel = formatShowtimeDate(value);
                      return (
                        <button
                          className={
                            key === selectedShowtimeDate ? "active" : ""
                          }
                          key={key}
                          type="button"
                          role="tab"
                          aria-selected={key === selectedShowtimeDate}
                          onClick={() => setSelectedShowtimeDate(key)}
                        >
                          <strong>{dateLabel?.date}</strong>
                          <span>- {dateLabel?.weekday}</span>
                        </button>
                      );
                    })}
                  </div>

                  {visibleShowtimes.length > 0 ? (
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
                                {getAvailableSeatCount(event) != null
                                  ? `${getAvailableSeatCount(event)} ghế trống`
                                  : "Đang cập nhật ghế"}
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

export default HomePage;
