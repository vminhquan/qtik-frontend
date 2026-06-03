import { useEffect, useState } from "react";
import { eventService } from "../api/eventService";
import { movieRoomService } from "../api/movieRoomService";
import { movieService } from "../api/movieService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/AdminPages.css";

const asList = (response) => (Array.isArray(response) ? response : response?.data || response?.items || response?.results || []);

const AdminEventManagementPage = () => {
  const [events, setEvents] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ film_id: "", room_id: "", start_time: "", price: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [eventResponse, movieResponse, roomResponse] = await Promise.all([
        eventService.getEvents(),
        movieService.getMovies({ limit: 100 }),
        movieRoomService.getRooms({ limit: 100 }),
      ]);
      setEvents(asList(eventResponse));
      setMovies(asList(movieResponse));
      setRooms(asList(roomResponse));
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải dữ liệu suất chiếu."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await eventService.createEvent({
      ...form,
      film_id: Number(form.film_id),
      movie_id: Number(form.film_id),
      room_id: Number(form.room_id),
      price: Number(form.price),
    });
    setForm({ film_id: "", room_id: "", start_time: "", price: "" });
    await fetchData();
  };

  return (
    <section className="admin-page">
      <header className="page-header">
        <div><span className="page-kicker">Admin</span><h1>Quản lý suất chiếu</h1><p>Backend tự tính giờ kết thúc và tạo ghế khi tạo suất chiếu.</p></div>
      </header>
      {error && <ErrorState message={error} onRetry={fetchData} />}
      <div className="admin-grid">
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>Thêm suất chiếu</h2>
          <label>Phim<select value={form.film_id} onChange={(event) => setForm((prev) => ({ ...prev, film_id: event.target.value }))} required>
            <option value="">Chọn phim</option>
            {movies.map((movie) => <option key={movie.id || movie._id} value={movie.id || movie._id}>{movie.title || movie.name}</option>)}
          </select></label>
          <label>Phòng<select value={form.room_id} onChange={(event) => setForm((prev) => ({ ...prev, room_id: event.target.value }))} required>
            <option value="">Chọn phòng</option>
            {rooms.map((room) => <option key={room.id || room._id} value={room.id || room._id}>{room.name}</option>)}
          </select></label>
          <label>Giờ bắt đầu<input type="datetime-local" value={form.start_time} onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))} required /></label>
          <label>Giá vé<input type="number" min="0" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} required /></label>
          <button className="primary-button" type="submit">Tạo suất chiếu</button>
        </form>
        <div className="admin-panel">
          {loading ? <LoadingState /> : events.map((item) => (
            <div className="admin-row" key={item.id || item._id}>
              <strong>{item.film?.title || item.movie?.title || item.title || `Event #${item.id || item._id}`}</strong>
              <span>{String(item.start_time || item.startTime || "").replace("T", " ").slice(0, 16)}</span>
              <button type="button" onClick={async () => { await eventService.deleteEvent(item.id || item._id); await fetchData(); }}>Xóa</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminEventManagementPage;
