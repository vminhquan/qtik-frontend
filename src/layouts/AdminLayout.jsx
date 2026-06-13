import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Armchair,
  CalendarClock,
  Film,
  LogOut,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../hooks/useAuth";
import { getUserDisplayName } from "../utils/userHelper";
import "../assets/styles/AppShell.css";
import icon from "/src/assets/icon.png";

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="app-shell admin-shell">
      <aside className="app-sidebar admin-sidebar">
        <Link to="/admin/movies" className="app-brand" aria-label="QTIK admin home">
          <img className="app-brand-mark" src={icon}/>
          <span>
            <strong>QTIK Admin</strong>
            <small>Back Office</small>
          </span>
        </Link>

        <nav className="app-nav" aria-label="Admin navigation">
          <NavLink to="/admin/movies"><Film aria-hidden="true" />Quản lý phim</NavLink>
          <NavLink to="/admin/rooms"><Armchair aria-hidden="true" />Phòng chiếu</NavLink>
          <NavLink to="/admin/events"><CalendarClock aria-hidden="true" />Suất chiếu</NavLink>
          <NavLink to="/admin/bookings"><ShoppingBag aria-hidden="true" />Đơn hàng</NavLink>
          <NavLink to="/admin/users"><Users aria-hidden="true" />Người dùng</NavLink>
          <NavLink to="/"><Store aria-hidden="true" />Về trang khách</NavLink>
        </nav>

        <div className="app-user">
          <ThemeToggle />
          <span>{getUserDisplayName(currentUser, "QTIK Admin")}</span>
          <button type="button" onClick={handleLogout}><LogOut aria-hidden="true" />Đăng xuất</button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
