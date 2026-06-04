import { useEffect, useState } from "react";
import { eventService } from "../api/eventService";
import { movieRoomService } from "../api/movieRoomService";
import { movieService } from "../api/movieService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/AdminPages.css";

const asList = (response) => (Array.isArray(response) ? response : response?.data || response?.items || response?.results || []);
const getEventId = (event) => event.id || event._id || event.event_id;
const getEventMovieId = (event) => event.film_id || event.movie_id || event.film?.id || event.movie?.id;
const getEventStartTime = (event) => event.start_time || event.startTime || event.started_at || event.show_time || event.showTime;
const getEventEndTime = (event) =>
  event.end_time || event.endTime || event.ended_at || event.finish_time || event.finishTime || event.completed_at;
const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};
const formatDateTime = (value) => {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 16);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const AdminEventManagementPage = () => {
  const [events, setEvents] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ film_id: "", room_id: "", start_time: "", price: "" });
  const [editingEvent, setEditingEvent] = useState(null);
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
    const payload = {
      ...form,
      film_id: Number(form.film_id),
      movie_id: Number(form.film_id),
      room_id: Number(form.room_id),
      price: Number(form.price),
    };

    if (editingEvent) {
      await eventService.updateEvent(getEventId(editingEvent), payload);
    } else {
      await eventService.createEvent(payload);
    }

    setForm({ film_id: "", room_id: "", start_time: "", price: "" });
    setEditingEvent(null);
    await fetchData();
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setForm({
      film_id: String(event.film_id || event.movie_id || event.film?.id || event.movie?.id || ""),
      room_id: String(event.room_id || event.room?.id || ""),
      start_time: toDateTimeLocal(event.start_time || event.startTime || event.started_at || event.show_time || event.showTime),
      price: String(event.price || event.ticket_price || event.ticketPrice || ""),
    });
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setForm({ film_id: "", room_id: "", start_time: "", price: "" });
  };

  const resolveEventEndTime = (event) => {
    const explicitEndTime = getEventEndTime(event);
    if (explicitEndTime) return explicitEndTime;

    const startTime = getEventStartTime(event);
    const movie = movies.find((item) => String(item.id || item._id) === String(getEventMovieId(event)));
    const duration = Number(event.film?.duration || event.movie?.duration || movie?.duration || 0);
    const startDate = new Date(startTime);
    if (!duration || Number.isNaN(startDate.getTime())) return null;

    return new Date(startDate.getTime() + duration * 60000).toISOString();
  };

  return (
    <section className="admin-page">
      <header className="page-header">
        <div><span className="page-kicker">Admin</span><h1>Quản lý suất chiếu</h1><p>Backend tự tính giờ kết thúc và tạo ghế khi tạo suất chiếu.</p></div>
      </header>
      {error && <ErrorState message={error} onRetry={fetchData} />}
      <div className="admin-grid">
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingEvent ? "Sửa suất chiếu" : "Thêm suất chiếu"}</h2>
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
          <button className="primary-button" type="submit">{editingEvent ? "Cập nhật suất chiếu" : "Tạo suất chiếu"}</button>
          {editingEvent && <button className="ghost-button" type="button" onClick={cancelEdit}>Hủy sửa</button>}
        </form>
        <div className="admin-panel">
          {loading ? <LoadingState /> : events.map((item) => (
            <div className="admin-row admin-event-row" key={getEventId(item)}>
              <strong>{item.film?.title || item.movie?.title || item.title || `Event #${getEventId(item)}`}</strong>
              <span>Bắt đầu: {formatDateTime(getEventStartTime(item))}</span>
              <span>Kết thúc: {formatDateTime(resolveEventEndTime(item))}</span>
              <button type="button" onClick={() => handleEditEvent(item)}>Sửa</button>
              <button type="button" onClick={async () => { await eventService.deleteEvent(getEventId(item)); await fetchData(); }}>Xóa</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminEventManagementPage;
