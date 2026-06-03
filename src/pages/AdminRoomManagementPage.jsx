import { useEffect, useState } from "react";
import { movieRoomService } from "../api/movieRoomService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/AdminPages.css";

const AdminRoomManagementPage = () => {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ name: "", capacity: 100 });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await movieRoomService.getRooms();
      setRooms(Array.isArray(response) ? response : response?.data || response?.items || []);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải phòng chiếu."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { ...form, capacity: Number(form.capacity) };
    if (editing) await movieRoomService.updateRoom(editing.id || editing._id, payload);
    else await movieRoomService.createRoom(payload);
    setForm({ name: "", capacity: 100 });
    setEditing(null);
    await fetchRooms();
  };

  return (
    <section className="admin-page">
      <header className="page-header"><div><span className="page-kicker">Admin</span><h1>Quản lý phòng chiếu</h1></div></header>
      {error && <ErrorState message={error} onRetry={fetchRooms} />}
      <div className="admin-grid">
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editing ? "Sửa phòng" : "Thêm phòng"}</h2>
          <label>Tên phòng<input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required /></label>
          <label>Sức chứa<input type="number" min="1" value={form.capacity} onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))} required /></label>
          <button className="primary-button" type="submit">Lưu phòng</button>
        </form>
        <div className="admin-panel">
          {loading ? <LoadingState /> : rooms.map((room) => (
            <div className="admin-row" key={room.id || room._id}>
              <strong>{room.name}</strong><span>{room.capacity} ghế</span>
              <button type="button" onClick={() => { setEditing(room); setForm({ name: room.name || "", capacity: room.capacity || 100 }); }}>Sửa</button>
              <button type="button" onClick={async () => { await movieRoomService.deleteRoom(room.id || room._id); await fetchRooms(); }}>Xóa</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminRoomManagementPage;
