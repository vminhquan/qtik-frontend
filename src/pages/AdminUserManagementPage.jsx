import { useCallback, useEffect, useState } from "react";
import { userService } from "../api/userService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/AdminPages.css";

const getOtpStatus = (user) => {
  const isActive = user?.is_active ?? user?.isActive;
  if (isActive === true || isActive === 1) return { className: "active", label: "Đã xác nhận OTP" };
  if (isActive === false || isActive === 0) return { className: "inactive", label: "Chưa xác nhận OTP" };
  return { className: "unknown", label: "Chưa rõ OTP" };
};

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ full_name: "", email: "", phone_number: "", role: "user" });
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userService.getUsers(buildListParams({ page, limit, search }));
      const items = Array.isArray(response) ? response : response?.data || response?.items || response?.results || [];
      setUsers(items);
      setTotal(response?.total || response?.count || items.length);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải người dùng."));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const getUserId = (user) => user.id || user._id || user.user_id;

  const handleEditUser = (user) => {
    setEditingUser(user);
    setForm({
      full_name: user.full_name || user.fullName || user.name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      role: user.role || "user",
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setForm({ full_name: "", email: "", phone_number: "", role: "user" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editingUser) return;

    await userService.updateUser(getUserId(editingUser), {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      role: form.role,
    });
    cancelEdit();
    await fetchUsers();
  };

  return (
    <section className="admin-page">
      <header className="page-header">
        <div><span className="page-kicker">Admin</span><h1>Quản lý người dùng</h1></div>
        <label className="search-box"><span>Tìm kiếm</span><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Email, tên, SĐT..." /></label>
      </header>
      {error && <ErrorState message={error} onRetry={fetchUsers} />}
      <div className="admin-grid">
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editingUser ? "Sửa người dùng" : "Chọn người dùng"}</h2>
          <label>Họ tên<input value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} disabled={!editingUser} /></label>
          <label>Email<input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} disabled={!editingUser} /></label>
          <label>Số điện thoại<input value={form.phone_number} onChange={(event) => setForm((prev) => ({ ...prev, phone_number: event.target.value }))} disabled={!editingUser} /></label>
          <label>Vai trò<select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} disabled={!editingUser}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select></label>
          <button className="primary-button" type="submit" disabled={!editingUser}>Cập nhật người dùng</button>
          {editingUser && <button className="ghost-button" type="button" onClick={cancelEdit}>Hủy sửa</button>}
        </form>
        <div className="admin-panel">
          {loading ? <LoadingState /> : users.map((user) => {
            const otpStatus = getOtpStatus(user);

            return (
              <div className="admin-row admin-user-row" key={getUserId(user)}>
                <strong>{user.full_name || user.name || user.email}</strong>
                <span>{user.email}</span>
                <span>{user.role || "user"}</span>
                <span className={`admin-status-pill ${otpStatus.className}`}>{otpStatus.label}</span>
                <button type="button" onClick={() => handleEditUser(user)}>Sửa</button>
                <button type="button" onClick={async () => { await userService.deleteUser(getUserId(user)); await fetchUsers(); }}>Xóa</button>
              </div>
            );
          })}
        </div>
      </div>
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
    </section>
  );
};

export default AdminUserManagementPage;
