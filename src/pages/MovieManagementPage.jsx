import { useCallback, useEffect, useMemo, useState } from "react";
import { movieService } from "../api/movieService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import useMovies from "../hooks/useMovies";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/MovieManagementPage.css";

const emptyForm = {
  title: "",
  genre: "",
  duration: "",
  release_date: "",
  poster_url: "",
  description: "",
  is_hot: false,
};

const getMovieId = (movie) => movie.id || movie._id || movie.film_id;
const MAX_HOT_MOVIES = 8;
const normalizeMovies = (response) => {
  if (Array.isArray(response)) return response;
  const payload = response?.data || response;
  return Array.isArray(payload) ? payload : payload?.items || [];
};

const MovieManagementPage = () => {
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
    createMovie,
    updateMovie,
    deleteMovie,
  } = useMovies({ initialLimit: 12 });

  const [form, setForm] = useState(emptyForm);
  const [editingMovie, setEditingMovie] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [hotMovieIds, setHotMovieIds] = useState(new Set());

  const loadHotMovies = useCallback(async () => {
    try {
      const response = await movieService.getHotMovies();
      setHotMovieIds(
        new Set(
          normalizeMovies(response)
            .map(getMovieId)
            .filter(Boolean)
            .map(String),
        ),
      );
    } catch (err) {
      setFormError(getErrorMessage(err, "Không thể tải danh sách phim hot."));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHotMovies();
  }, [loadHotMovies]);

  const title = useMemo(
    () =>
      editingMovie
        ? `Cập nhật ${editingMovie.title || editingMovie.name}`
        : "Thêm phim mới",
    [editingMovie],
  );

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMovie(null);
    setFormError("");
  };

  const handleEdit = (movie) => {
    const movieId = String(getMovieId(movie));
    setEditingMovie(movie);
    setForm({
      title: movie.title || movie.name || "",
      genre: movie.genre || "",
      duration: movie.duration || "",
      release_date: movie.release_date || movie.releaseDate || "",
      poster_url: movie.poster_url || movie.posterUrl || "",
      description: movie.description || "",
      is_hot: hotMovieIds.has(movieId),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload = {
        ...form,
        duration: form.duration ? Number(form.duration) : undefined,
      };

      if (editingMovie) {
        await updateMovie(getMovieId(editingMovie), payload);
      } else {
        await createMovie(payload);
      }

      await loadHotMovies();
      resetForm();
    } catch (err) {
      setFormError(getErrorMessage(err, "Không thể lưu thông tin phim."));
    } finally {
      setSaving(false);
    }
  };

  const editingMovieIsHot = editingMovie
    ? hotMovieIds.has(String(getMovieId(editingMovie)))
    : false;
  const hotLimitReached =
    hotMovieIds.size >= MAX_HOT_MOVIES && !editingMovieIsHot;

  const handleDelete = async (movie) => {
    const movieTitle = movie.title || movie.name || "phim này";
    const accepted = window.confirm(`Bạn muốn xóa ${movieTitle}?`);
    if (!accepted) return;

    try {
      await deleteMovie(getMovieId(movie));
    } catch (err) {
      setFormError(getErrorMessage(err, "Không thể xóa phim."));
    }
  };

  return (
    <section className="movie-admin-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Film Catalog</span>
          <h1>Quản lý phim</h1>
          <p>Tìm kiếm, phân trang và cập nhật dữ liệu phim từ API `/films`.</p>
        </div>
        <label className="search-box">
          <span>Tìm kiếm</span>
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

      <div className="movie-admin-layout">
        <form className="movie-form" onSubmit={handleSubmit}>
          <h2>{title}</h2>
          {formError && <p className="auth-error">{formError}</p>}

          <label>
            Tên phim
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Thể loại
            <input name="genre" value={form.genre} onChange={handleChange} />
          </label>
          <label>
            Thời lượng
            <input
              name="duration"
              type="number"
              min="1"
              value={form.duration}
              onChange={handleChange}
            />
          </label>
          <label>
            Ngày phát hành
            <input
              name="release_date"
              type="date"
              value={form.release_date}
              onChange={handleChange}
            />
          </label>
          <label>
            Poster URL
            <input
              name="poster_url"
              value={form.poster_url}
              onChange={handleChange}
            />
          </label>
          <label>
            Mô tả
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
            />
          </label>
          <label className="movie-hot-toggle">
            <input
              checked={form.is_hot}
              disabled={hotLimitReached}
              name="is_hot"
              type="checkbox"
              onChange={handleChange}
            />
            <span>
              <strong>
                Phim hot ({hotMovieIds.size}/{MAX_HOT_MOVIES})
              </strong>
              {hotLimitReached
                ? "Đã đủ 8 phim. Hãy bỏ chọn một phim hot và lưu trước."
                : "Hiển thị phim này trong khu vực nổi bật ở trang chủ"}
            </span>
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu phim"}
            </button>
            <button className="ghost-button" type="button" onClick={resetForm}>
              Làm mới
            </button>
          </div>
        </form>

        <div className="movie-list-panel">
          {error && <ErrorState message={error} onRetry={refetch} />}
          {loading ? (
            <LoadingState label="Đang tải danh sách phim..." />
          ) : (
            <div className="movie-grid">
              {movies.map((movie) => (
                <article className="movie-card" key={getMovieId(movie)}>
                  <div className="movie-poster">
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
                  <div className="movie-card-body">
                    <div className="movie-card-title">
                      <h3>{movie.title || movie.name}</h3>
                      {hotMovieIds.has(String(getMovieId(movie))) && (
                        <span>HOT</span>
                      )}
                    </div>
                    <p>{movie.genre || "Chưa có thể loại"}</p>
                    <small>
                      {movie.duration
                        ? `${movie.duration} phút`
                        : "Chưa có thời lượng"}
                    </small>
                  </div>
                  <div className="movie-card-actions">
                    <button type="button" onClick={() => handleEdit(movie)}>
                      Sửa
                    </button>
                    <button type="button" onClick={() => handleDelete(movie)}>
                      Xóa
                    </button>
                  </div>
                </article>
              ))}

              {!movies.length && (
                <p className="empty-state">Chưa có phim phù hợp.</p>
              )}
            </div>
          )}

          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>
    </section>
  );
};

export default MovieManagementPage;
