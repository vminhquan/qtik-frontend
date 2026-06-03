import { useCallback, useEffect, useState } from "react";
import { userService } from "../api/userService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/AdminPages.css";

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
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

  return (
    <section className="admin-page">
      <header className="page-header">
        <div><span className="page-kicker">Admin</span><h1>Quản lý người dùng</h1></div>
        <label className="search-box"><span>Tìm kiếm</span><input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Email, tên, SĐT..." /></label>
      </header>
      {error && <ErrorState message={error} onRetry={fetchUsers} />}
      <div className="admin-panel">
        {loading ? <LoadingState /> : users.map((user) => (
          <div className="admin-row" key={user.id || user._id}>
            <strong>{user.full_name || user.name || user.email}</strong>
            <span>{user.email}</span>
            <span>{user.role || "user"}</span>
            <button type="button" onClick={async () => { await userService.deleteUser(user.id || user._id); await fetchUsers(); }}>Xóa</button>
          </div>
        ))}
      </div>
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
    </section>
  );
};

export default AdminUserManagementPage;
