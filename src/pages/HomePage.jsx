import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import useMovies from "../hooks/useMovies";
import heroImage from "../assets/hero.png";
import "../assets/styles/PublicPages.css";

const getMovieId = (movie) => movie?.id || movie?._id || movie?.film_id;
const movieTitle = (movie) => movie?.title || movie?.name || movie?.film_name || "QTIK Movie";
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
    initialLimit: 10,
    publicMode: true,
  });
  const [heroIndex, setHeroIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const heroMovies = useMemo(() => movies.slice(0, 6), [movies]);
  const safeHeroIndex = heroMovies.length ? heroIndex % heroMovies.length : 0;
  const heroMovie = heroMovies[safeHeroIndex] || movies[0];

  useEffect(() => {
    if (heroMovies.length <= 1 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setHeroIndex((current) => (current + 1) % heroMovies.length);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [heroMovies.length, safeHeroIndex]);

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

  const openMovieShowtimes = (movie) => {
    const movieId = getMovieId(movie);
    if (!movieId) return;
    navigate(`/booking/movie/${movieId}`);
  };

  const handleHeroShowtimes = () => {
    if (!heroMovie) return;
    openMovieShowtimes(heroMovie);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    document.getElementById("movie-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <span className="page-kicker">Catalog</span>
            <h1>Phim Hot</h1>
          </div>
          <label className="search-box">
            <span>Tìm phim</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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

              return (
                <article
                  className="public-movie-card"
                  key={movieId}
                  style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
                >
                  <button className="movie-card-button" type="button" onClick={() => openMovieShowtimes(movie)}>
                    <div className="public-poster">
                      {movie.poster_url || movie.posterUrl ? (
                        <img src={movie.poster_url || movie.posterUrl} alt={movie.title || movie.name} />
                      ) : (
                        <span>{(movie.title || movie.name || "QT").slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <h3>{movieTitle(movie)}</h3>
                    <p>{movie.genre || "Đang cập nhật"} · {formatMovieDuration(movie)}</p>
                    <span className="movie-card-cta">Xem suất chiếu</span>
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <Pagination page={page} limit={limit} total={total} onPageChange={handlePageChange} />
      </section>
    </main>
  );
};

export default HomePage;
