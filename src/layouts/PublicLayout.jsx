import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CalendarRange,
  Globe2,
  House,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  ShoppingBag,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import FloatingChatbot from "../components/FloatingChatbot";
import ThemeToggle from "../components/ThemeToggle";
import { CHAT_STORAGE_KEY } from "../constants/storageKeys";
import { useAuth } from "../hooks/useAuth";
import { getUserDisplayName } from "../utils/userHelper";
import "../assets/styles/PublicLayout.css";
import icon from "/src/assets/icon.png";

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "QT";

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};
const getAccountItemClass = ({ isActive }) =>
  isActive ? "account-menu-item is-active" : "account-menu-item";

const PublicLayout = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const accountRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const displayName = getUserDisplayName(
    currentUser,
    currentUser?.email || "QTIK User",
  );
  const userInitials = useMemo(() => getInitials(displayName), [displayName]);

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
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
          <span>
            <strong>QTIK</strong>
            <small>Flash Cinemax</small>
          </span>
        </Link>
        <button
          className="public-mobile-menu"
          type="button"
          aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? (
            <X aria-hidden="true" />
          ) : (
            <Menu aria-hidden="true" />
          )}
        </button>
        <nav className={mobileMenuOpen ? "is-open" : ""}>
          <NavLink to="/" onClick={() => setMobileMenuOpen(false)}>
            <House aria-hidden="true" />
            Trang chủ
          </NavLink>

          {isAuthenticated ? (
            <>
              <Link
                to="/#movie-catalog"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Ticket aria-hidden="true" />
                Đặt vé
              </Link>
              {isAdmin && (
                <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <LayoutDashboard aria-hidden="true" />
                  Quản trị
                </NavLink>
              )}
              <NavLink to="/showtimes" onClick={() => setMobileMenuOpen(false)}>
                <CalendarRange aria-hidden="true" />
                Lịch chiếu theo rạp
              </NavLink>
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
                  <div
                    className="public-account-menu"
                    role="menu"
                    aria-label="Menu tài khoản"
                  >
                    <div className="public-account-summary" role="presentation">
                      <span className="public-account-avatar">
                        {userInitials}
                      </span>
                      <div>
                        <strong>{displayName}</strong>
                        {currentUser?.email && (
                          <small>{currentUser.email}</small>
                        )}
                      </div>
                    </div>
                    <NavLink
                      end
                      className={getAccountItemClass}
                      to="/profile"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <UserRound aria-hidden="true" />
                      Thông tin cá nhân
                    </NavLink>
                    <NavLink
                      className={getAccountItemClass}
                      to="/profile/orders"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <ShoppingBag aria-hidden="true" />
                      Đơn hàng của tôi
                    </NavLink>
                    <NavLink
                      className={getAccountItemClass}
                      to="/profile/password"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <KeyRound aria-hidden="true" />
                      Đổi mật khẩu
                    </NavLink>
                    {isAdmin && (
                      <NavLink
                        className={getAccountItemClass}
                        to="/admin"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Trang quản trị
                      </NavLink>
                    )}
                    <button
                      className="account-menu-item danger"
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOut aria-hidden="true" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <NavLink to="/login" onClick={() => setMobileMenuOpen(false)}>
              <LogIn aria-hidden="true" />
              Đăng nhập
            </NavLink>
          )}
          <ThemeToggle compact />
        </nav>
      </header>
      <Outlet />
      <footer className="public-footer">
        <div className="public-footer-content">
          <section className="public-footer-brand">
            <Link to="/" className="public-brand">
              <img className="app-brand-mark" src={icon} alt="QTIK" />
              <span>
                <strong>QTIK</strong>
                <small>Flash Cinemax</small>
              </span>
            </Link>
          </section>

          <nav className="public-footer-links" aria-label="Điều hướng nhanh">
            <strong>Khám phá</strong>
            <Link to="/">
              <House aria-hidden="true" />
              Trang chủ
            </Link>
            <Link to="/showtimes">
              <CalendarRange aria-hidden="true" />
              Lịch chiếu theo rạp
            </Link>
            <Link to="/#movie-catalog">
              <Ticket aria-hidden="true" />
              Đặt vé
            </Link>
          </nav>

          <nav className="public-footer-links" aria-label="Tài khoản">
            <strong>Tài khoản</strong>
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <UserRound aria-hidden="true" />
                  Thông tin cá nhân
                </Link>
                <Link to="/profile/orders">
                  <ShoppingBag aria-hidden="true" />
                  Đơn hàng của tôi
                </Link>
              </>
            ) : (
              <Link to="/login">
                <LogIn aria-hidden="true" />
                Đăng nhập
              </Link>
            )}
          </nav>

          <section className="public-footer-contact">
            <strong>Liên hệ</strong>
            <a href="https://qtik.io.vn" target="_blank" rel="noreferrer">
              <Globe2 aria-hidden="true" />
              qtik.io.vn
            </a>
            <a href="mailto:contact@qtik.io.vn">
              <Mail aria-hidden="true" />
              vmquan44@gmail.com
            </a>
          </section>
        </div>
        <div className="public-footer-bottom">
          <span>© {new Date().getFullYear()} QTIK</span>
          <span>Đặt vé nhanh, xem phim đúng ghế.</span>
        </div>
      </footer>
      <FloatingChatbot />
    </div>
  );
};

export default PublicLayout;
