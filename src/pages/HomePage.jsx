import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventService } from "../api/eventService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import useCurrentTime from "../hooks/useCurrentTime";
import useMovies from "../hooks/useMovies";
import { getErrorMessage } from "../utils/errorHandler";
import { isShowtimeVisible } from "../utils/showtimeHelper";
import heroImage from "../assets/hero.png";
import "../assets/styles/PublicPages.css";

const getMovieId = (movie) => movie?.id || movie?._id || movie?.film_id;
const movieTitle = (movie) => movie.title || movie.name || movie.film_name || "QTIK Movie";
const normalizeList = (response) =>
  Array.isArray(response)
    ? response
    : response?.data || response?.items || response?.results || response?.events || [];
const getEventId = (event) => event.id || event._id || event.event_id;
const getEventFilmId = (event) => event.film_id || event.movie_id || event.film?.id || event.movie?.id;
const getRoomName = (event) => event.room?.name || event.room_name || event.room?.room_name || `Phòng ${event.room_id || "--"}`;
const getStartTime = (event) =>
  event.start_time || event.startTime || event.started_at || event.show_time || event.showTime || null;
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
const getAvailableSeats = (event) =>
  event.available_seats ?? event.availableSeats ?? event.remaining_seats ?? event.seats_available;
const getMoviePoster = (movie) => movie?.poster_url || movie?.posterUrl || movie?.banner_url || movie?.bannerUrl || heroImage;
const getMovieDescription = (movie) =>
  movie?.description || movie?.overview || movie?.summary || movie?.content || movie?.synopsis || "";
const getReleaseDate = (movie) => movie?.release_date || movie?.releaseDate || movie?.premiere_date || movie?.premiereDate;
const getMovieDuration = (movie) => movie?.duration || movie?.duration_minutes || movie?.runtime || movie?.runtime_minutes;
const formatMovieDuration = (movie) => {
  const duration = getMovieDuration(movie);
  return duration ? `${duration} phút` : "Thời lượng đang cập nhật";
};
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

const HomePage = () => {
  const navigate = useNavigate();
  const { movies, page, limit, total, search, loading, error, setPage, setSearch, refetch } = useMovies({
    initialLimit: 8,
    publicMode: true,
  });
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimeLoading, setShowtimeLoading] = useState(false);
  const [showtimeError, setShowtimeError] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const currentTime = useCurrentTime();
  const heroMovies = useMemo(() => movies.slice(0, 6), [movies]);
  const safeHeroIndex = heroMovies.length ? heroIndex % heroMovies.length : 0;
  const heroMovie = heroMovies[safeHeroIndex] || movies[0];
  const selectedMovie = movies.find((movie) => String(getMovieId(movie)) === String(selectedMovieId));

  const moveHero = (direction) => {
    if (!heroMovies.length) return;
    setHeroIndex((current) => (current + direction + heroMovies.length) % heroMovies.length);
  };

  const handleDragEnd = (clientX) => {
    if (dragStartX == null) return;
    const distance = clientX - dragStartX;
    if (Math.abs(distance) > 42) moveHero(distance < 0 ? 1 : -1);
    setDragStartX(null);
  };

  const loadShowtimes = async (movie) => {
    const movieId = getMovieId(movie);

    if (String(selectedMovieId) === String(movieId)) {
      setSelectedMovieId(null);
      setShowtimes([]);
      setShowtimeError("");
      return;
    }

    setSelectedMovieId(movieId);
    setShowtimeLoading(true);
    setShowtimeError("");

    try {
      const response = await eventService.getEvents(
        { film_id: movieId, movie_id: movieId },
        { skipAuth: true, skipAuthRedirect: true }
      );
      const nextShowtimes = normalizeList(response).filter((event) => {
        const eventMovieId = getEventFilmId(event);
        return (!eventMovieId || String(eventMovieId) === String(movieId)) && isShowtimeVisible(event);
      });
      setShowtimes(nextShowtimes);
    } catch (err) {
      setShowtimeError(getErrorMessage(err, "Không thể tải suất chiếu của phim này."));
      setShowtimes([]);
    } finally {
      setShowtimeLoading(false);
    }
  };

  const handleHeroShowtimes = () => {
    if (!heroMovie) return;
    loadShowtimes(heroMovie);
    document.getElementById("movie-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const visibleShowtimes = useMemo(
    () => showtimes.filter((event) => isShowtimeVisible(event, currentTime)),
    [showtimes, currentTime]
  );

  return (
    <main className="home-page">
      <section
        className="home-hero"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.62) 0%, rgba(79, 70, 229, 0.42) 48%, rgba(14, 165, 233, 0.18) 100%), linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(15, 23, 42, 0.24)), url("${getMoviePoster(heroMovie)}")` }}
        onMouseDown={(event) => setDragStartX(event.clientX)}
        onMouseUp={(event) => handleDragEnd(event.clientX)}
        onTouchStart={(event) => setDragStartX(event.touches[0].clientX)}
        onTouchEnd={(event) => handleDragEnd(event.changedTouches[0].clientX)}
      >
        <div className="home-hero-content" key={getMovieId(heroMovie) || "hero-content"}>
          <span className="page-kicker">{formatReleaseDate(getReleaseDate(heroMovie))}</span>
          <h1>{heroMovie ? movieTitle(heroMovie) : "QTIK Cinema"}</h1>
          <small className="movie-duration-label">{heroMovie ? formatMovieDuration(heroMovie) : "Thời lượng đang cập nhật"}</small>
          <p>{getMovieDescription(heroMovie) || "Mô tả phim đang được cập nhật."}</p>
          <button className="primary-button" type="button" onClick={handleHeroShowtimes} disabled={!heroMovie}>
            Chọn suất chiếu
          </button>
        </div>

        {heroMovies.length > 1 && (
          <>
            <button className="hero-arrow hero-arrow-left" type="button" onClick={() => moveHero(-1)} aria-label="Poster trước">
              ‹
            </button>
            <button className="hero-arrow hero-arrow-right" type="button" onClick={() => moveHero(1)} aria-label="Poster tiếp theo">
              ›
            </button>
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
          </>
        )}
      </section>

      <section className="movie-section" id="movie-catalog">
        <header className="page-header">
          <div>
            <span className="page-kicker">Catalog</span>
            <h1>Phim Hot</h1>
          </div>
          <label className="search-box">
            <span>Tìm phim</span>
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Nhập tên phim..."
            />
          </label>
        </header>

        {error && <ErrorState message={error} onRetry={refetch} />}
        {loading ? (
          <LoadingState label="Đang tải phim..." />
        ) : (
          <div className="public-movie-grid">
            {movies.map((movie, index) => {
              const movieId = getMovieId(movie);
              const isSelected = String(selectedMovieId) === String(movieId);

              return (
                <article
                  className={isSelected ? "public-movie-card active" : "public-movie-card"}
                  key={movieId}
                  style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
                >
                  <button className="movie-card-button" type="button" onClick={() => loadShowtimes(movie)}>
                    <div className="public-poster">
                      {movie.poster_url || movie.posterUrl ? (
                        <img src={movie.poster_url || movie.posterUrl} alt={movie.title || movie.name} />
                      ) : (
                        <span>{(movie.title || movie.name || "QT").slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <h3>{movieTitle(movie)}</h3>
                    <p>{movie.genre || "Đang cập nhật"} · {formatMovieDuration(movie)}</p>
                    <span className="movie-card-cta">{isSelected ? "Ẩn suất chiếu" : "Chọn suất chiếu"}</span>
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {selectedMovieId && (
          <section className="movie-showtime-panel selected-showtime-panel">
            <header className="selected-showtime-header">
              <div>
                <span className="page-kicker">Suất chiếu của phim</span>
                <h2>{movieTitle(selectedMovie)}</h2>
                <small className="movie-duration-label">{formatMovieDuration(selectedMovie)}</small>
                <p>{getMovieDescription(selectedMovie) || "Mô tả phim đang được cập nhật."}</p>
              </div>
              <button className="ghost-button" type="button" onClick={() => loadShowtimes(selectedMovie)}>
                Tải lại suất chiếu
              </button>
            </header>

            {showtimeError && <p className="inline-error">{showtimeError}</p>}
            {showtimeLoading ? (
              <LoadingState label="Đang tải suất chiếu..." />
            ) : (
              <div className="movie-showtime-list">
                {visibleShowtimes.map((event) => (
                  <button
                    className="movie-showtime-option"
                    key={getEventId(event)}
                    type="button"
                    onClick={() => navigate(`/booking/${getEventId(event)}`)}
                  >
                    <strong>{formatDateTime(getStartTime(event))}</strong>
                    <span>{getRoomName(event)}</span>
                    <small>
                      {Number(event.price || event.ticket_price || 0).toLocaleString("vi-VN")} VNĐ
                      {getAvailableSeats(event) != null ? ` - Còn ${getAvailableSeats(event)} ghế` : ""}
                    </small>
                  </button>
                ))}
                {!visibleShowtimes.length && <p className="empty-state compact">Phim này chưa có suất chiếu.</p>}
              </div>
            )}
          </section>
        )}

        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </section>
    </main>
  );
};

export default HomePage;
