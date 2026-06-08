import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import FloatingChatbot from "../components/FloatingChatbot";
import ThemeToggle from "../components/ThemeToggle";
import { CHAT_STORAGE_KEY } from "../constants/storageKeys";
import { useAuth } from "../hooks/useAuth";
import { getUserDisplayName } from "../utils/userHelper";
import "../assets/styles/PublicLayout.css";
import icon from "/src/assets/icon.png";

const getInitials = (name = "") => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "QT";

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};
const getAccountItemClass = ({ isActive }) => (isActive ? "account-menu-item is-active" : "account-menu-item");

const PublicLayout = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const accountRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navigate = useNavigate();
  const displayName = getUserDisplayName(currentUser, currentUser?.email || "QTIK User");
  const userInitials = useMemo(() => getInitials(displayName), [displayName]);

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await logout();
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  return (
    <div className="public-layout">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <img className="app-brand-mark" src={icon} alt="QTIK" />
          <strong>QTIK</strong>
        </Link>
        <nav>
          <NavLink to="/">Trang chủ</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/booking">Đặt vé</NavLink>
              {isAdmin && <NavLink to="/admin">Quản trị</NavLink>}
              <div className="public-account" ref={accountRef}>
                <button
                  className="public-avatar-button"
                  type="button"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Mở menu tài khoản"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                >
                  {userInitials}
                </button>
                {accountMenuOpen && (
                  <div className="public-account-menu" role="menu" aria-label="Menu tài khoản">
                    <div className="public-account-summary" role="presentation">
                      <span className="public-account-avatar">{userInitials}</span>
                      <div>
                        <strong>{displayName}</strong>
                        {currentUser?.email && <small>{currentUser.email}</small>}
                      </div>
                    </div>
                    <NavLink end className={getAccountItemClass} to="/profile" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Thông tin cá nhân</NavLink>
                    <NavLink className={getAccountItemClass} to="/profile/orders" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Đơn hàng của tôi</NavLink>
                    <NavLink className={getAccountItemClass} to="/profile/password" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Đổi mật khẩu</NavLink>
                    {isAdmin && <NavLink className={getAccountItemClass} to="/admin" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Trang quản trị</NavLink>}
                    <button className="account-menu-item danger" type="button" role="menuitem" onClick={handleLogout}>Đăng xuất</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <NavLink to="/login">Đăng nhập</NavLink>
          )}
          <ThemeToggle compact />
        </nav>
      </header>
      <Outlet />
      <FloatingChatbot />
    </div>
  );
};

export default PublicLayout;
