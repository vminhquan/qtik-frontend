import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { userService } from "../api/userService";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/AuthPages.css";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message] = useState(location.state?.message || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);

    try {
      await userService.resetPassword({
        email: form.email.trim(),
        otp: form.otp.trim(),
        new_password: form.newPassword,
      });

      navigate("/login", {
        state: { message: "Đổi mật khẩu thành công, vui lòng đăng nhập lại." },
        replace: true,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Không thể đặt lại mật khẩu."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page compact-auth">
      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <span className="auth-kicker">Reset</span>
            <h2>Đặt lại mật khẩu</h2>
          </div>

          {message && <p className="success-banner">{message}</p>}
          {error && <p className="auth-error">{error}</p>}

          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} autoComplete="email" required />
          </label>
          <label>
            OTP
            <input value={form.otp} inputMode="numeric" maxLength="6" onChange={(event) => setForm((prev) => ({ ...prev, otp: event.target.value.replace(/\D/g, "") }))} required />
          </label>
          <label>
            Mật khẩu mới
            <input type="password" value={form.newPassword} onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))} autoComplete="new-password" required />
          </label>
          <label>
            Nhập lại mật khẩu mới
            <input type="password" value={form.confirmPassword} onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} autoComplete="new-password" required />
          </label>

          <button className="primary-button" disabled={loading || form.otp.length !== 6} type="submit">
            {loading ? "Đang cập nhật..." : "Xác nhận"}
          </button>

          <p className="auth-link"><Link to="/login">Quay lại đăng nhập</Link></p>
        </form>
      </section>
    </main>
  );
};

export default ResetPasswordPage;
