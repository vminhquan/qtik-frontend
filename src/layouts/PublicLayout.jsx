import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import FloatingChatbot from "../components/FloatingChatbot";
import { useAuth } from "../hooks/useAuth";
import "../assets/styles/PublicLayout.css";

const PublicLayout = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="public-layout">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <span>Q</span>
          <strong>QTIK</strong>
        </Link>
        <nav>
          <NavLink to="/">Trang chủ</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/booking">Đặt vé</NavLink>
              <NavLink to="/profile/tickets">Vé của tôi</NavLink>
              {isAdmin && <NavLink to="/admin">Quản trị</NavLink>}
              <button className="public-nav-button" type="button" onClick={handleLogout}>Đăng xuất</button>
            </>
          ) : (
            <NavLink to="/login">Đăng nhập</NavLink>
          )}
        </nav>
      </header>
      <Outlet />
      <FloatingChatbot />
    </div>
  );
};

export default PublicLayout;
