import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getUserDisplayName } from "../utils/userHelper";
import "../assets/styles/AppShell.css";

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="app-shell admin-shell">
      <aside className="app-sidebar admin-sidebar">
        <Link to="/admin/movies" className="app-brand" aria-label="QTIK admin home">
          <span className="app-brand-mark">A</span>
          <span>
            <strong>QTIK Admin</strong>
            <small>Back Office</small>
          </span>
        </Link>

        <nav className="app-nav" aria-label="Admin navigation">
          <NavLink to="/admin/movies">Quản lý phim</NavLink>
          <NavLink to="/admin/rooms">Phòng chiếu</NavLink>
          <NavLink to="/admin/events">Suất chiếu</NavLink>
          <NavLink to="/admin/bookings">Đơn hàng</NavLink>
          <NavLink to="/admin/users">Người dùng</NavLink>
          <NavLink to="/">Về trang khách</NavLink>
        </nav>

        <div className="app-user">
          <span>{getUserDisplayName(currentUser, "QTIK Admin")}</span>
          <button type="button" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
