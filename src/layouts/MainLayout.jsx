import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import FloatingChatbot from "../components/FloatingChatbot";
import ThemeToggle from "../components/ThemeToggle";
import { CHAT_STORAGE_KEY } from "../constants/storageKeys";
import { useAuth } from "../hooks/useAuth";
import { getUserDisplayName } from "../utils/userHelper";
import "../assets/styles/AppShell.css";
import icon from "/src/assets/icon.png";

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    navigate("/", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to="/booking" className="app-brand" aria-label="QTIK home">
          <img className="app-brand-mark" src={icon} alt="QTIK" />
          <span>
            <strong>QTIK</strong>
            <small>Ticket OS</small>
          </span>
        </Link>

        <nav className="app-nav" aria-label="Main navigation">
          <NavLink to="/">Trang chủ</NavLink>
          <NavLink to="/booking">Đặt vé</NavLink>
          <NavLink to="/profile/tickets">Vé của tôi</NavLink>
          <NavLink to="/profile" end>Tài khoản</NavLink>
        </nav>

        <div className="app-user">
          <ThemeToggle />
          <span>{getUserDisplayName(currentUser, "Tài khoản của tôi")}</span>
          <button type="button" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
      <FloatingChatbot />
    </div>
  );
};

export default MainLayout;
