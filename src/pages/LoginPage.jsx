import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errorHandler";
import { decodeJwtPayload } from "../utils/jwtHelper";
import "../assets/styles/AuthPages.css";

const getLoginRole = (response) => {
  const accessToken = response?.accessToken || response?.access_token || response?.token || response?.data?.accessToken || response?.data?.access_token;
  return response?.user?.role || response?.data?.user?.role || response?.role || response?.data?.role || decodeJwtPayload(accessToken)?.role || "user";
};

const LoginPage = ({ adminMode = false }) => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestedPath = location.state?.from?.pathname;
  const from =
    adminMode && requestedPath && requestedPath !== "/" && requestedPath !== "/login" && requestedPath !== "/admin/login"
      ? requestedPath
      : adminMode
        ? "/admin/movies"
        : "/";
  const successMessage = location.state?.message || "";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const scope = adminMode ? "admin" : "user";
      const response = await login(formData, { scope });
      const role = getLoginRole(response);

      if (adminMode && role !== "admin") {
        await logout({ scope });
        setError("Tài khoản này không có quyền truy cập trang quản trị.");
        return;
      }

      if (!adminMode && role === "admin") {
        await logout({ scope });
        setError("Tài khoản admin vui lòng đăng nhập tại cổng quản trị.");
        return;
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div>
          <span className="auth-kicker">{adminMode ? "QTIK Back Office" : "QTIK Ticket OS"}</span>
          <h1>{adminMode ? "Cổng quản trị dành riêng cho Admin." : "QTIK - ĐẶT VÉ THẦN TỐC"}</h1>
          <p>{adminMode ? "Chỉ tài khoản có role admin mới được truy cập dashboard quản trị." : ""}</p>
        </div>
      </section>

      <section className="auth-panel" aria-label="Đăng nhập">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <span className="auth-kicker">{adminMode ? "Admin Access" : "Welcome back"}</span>
            <h2>{adminMode ? "Đăng nhập quản trị" : "Đăng nhập QTIK"}</h2>
          </div>

          {error && <p className="auth-error">{error}</p>}
          {successMessage && <p className="success-banner">{successMessage}</p>}

          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="admin@qtik.vn"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Mật khẩu
            <input
              type="password"
              name="password"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <p className="auth-link">
            {adminMode ? "Bạn là khách hàng? " : "Chưa có tài khoản? "}
            <Link to={adminMode ? "/login" : "/register"}>{adminMode ? "Đăng nhập người dùng" : "Tạo tài khoản"}</Link>
          </p>
          {!adminMode && (
            <p className="auth-link">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </p>
          )}
        </form>
      </section>
    </main>
  );
};

export default LoginPage;
