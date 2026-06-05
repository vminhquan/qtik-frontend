import { useMemo, useState } from "react";
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
};

const getMovieId = (movie) => movie.id || movie._id || movie.film_id;

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
  } = useMovies({ initialLimit: 8 });

  const [form, setForm] = useState(emptyForm);
  const [editingMovie, setEditingMovie] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const title = useMemo(
    () => (editingMovie ? `Cập nhật ${editingMovie.title || editingMovie.name}` : "Thêm phim mới"),
    [editingMovie]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMovie(null);
    setFormError("");
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setForm({
      title: movie.title || movie.name || "",
      genre: movie.genre || "",
      duration: movie.duration || "",
      release_date: movie.release_date || movie.releaseDate || "",
      poster_url: movie.poster_url || movie.posterUrl || "",
      description: movie.description || "",
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

      resetForm();
    } catch (err) {
      setFormError(getErrorMessage(err, "Không thể lưu thông tin phim."));
    } finally {
      setSaving(false);
    }
  };

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
            placeholder="Tên phim, thể loại..."
          />
        </label>
      </header>

      <div className="movie-admin-layout">
        <form className="movie-form" onSubmit={handleSubmit}>
          <h2>{title}</h2>
          {formError && <p className="auth-error">{formError}</p>}

          <label>
            Tên phim
            <input name="title" value={form.title} onChange={handleChange} required />
          </label>
          <label>
            Thể loại
            <input name="genre" value={form.genre} onChange={handleChange} />
          </label>
          <label>
            Thời lượng
            <input name="duration" type="number" min="1" value={form.duration} onChange={handleChange} />
          </label>
          <label>
            Ngày phát hành
            <input name="release_date" type="date" value={form.release_date} onChange={handleChange} />
          </label>
          <label>
            Poster URL
            <input name="poster_url" value={form.poster_url} onChange={handleChange} />
          </label>
          <label>
            Mô tả
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" />
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
                      <img src={movie.poster_url || movie.posterUrl} alt={movie.title || movie.name} />
                    ) : (
                      <span>{(movie.title || movie.name || "QT").slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="movie-card-body">
                    <h3>{movie.title || movie.name}</h3>
                    <p>{movie.genre || "Chưa có thể loại"}</p>
                    <small>{movie.duration ? `${movie.duration} phút` : "Chưa có thời lượng"}</small>
                  </div>
                  <div className="movie-card-actions">
                    <button type="button" onClick={() => handleEdit(movie)}>Sửa</button>
                    <button type="button" onClick={() => handleDelete(movie)}>Xóa</button>
                  </div>
                </article>
              ))}

              {!movies.length && <p className="empty-state">Chưa có phim phù hợp.</p>}
            </div>
          )}

          <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
        </div>
      </div>
    </section>
  );
};

export default MovieManagementPage;
