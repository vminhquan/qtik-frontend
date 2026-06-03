import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { userService } from "../api/userService";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/AuthPages.css";

const RESEND_SECONDS = 60;

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || "", otp: "" });
  const [message, setMessage] = useState(location.state?.message || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(location.state?.email ? RESEND_SECONDS : 0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await userService.verifyOTP({ email: form.email.trim(), otp: form.otp.trim() });
      navigate("/login", {
        state: { message: "Kích hoạt tài khoản thành công. Vui lòng đăng nhập." },
        replace: true,
      });
    } catch (err) {
      setError(getErrorMessage(err, "OTP không hợp lệ hoặc đã hết hạn."));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!form.email.trim() || resendCooldown > 0) return;

    setResending(true);
    setError("");
    setMessage("");

    try {
      await userService.resendOTP({ email: form.email.trim() });
      setMessage("Mã OTP mới đã được gửi. Vui lòng kiểm tra email.");
      setResendCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể gửi lại OTP."));
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="auth-page compact-auth">
      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <span className="auth-kicker">Verify</span>
            <h2>Nhập OTP</h2>
          </div>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="success-banner">{message}</p>}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              autoComplete="email"
              required
            />
          </label>

          <label>
            OTP 6 số
            <input
              value={form.otp}
              inputMode="numeric"
              maxLength="6"
              placeholder="123456"
              onChange={(event) => setForm((prev) => ({ ...prev, otp: event.target.value.replace(/\D/g, "") }))}
              required
            />
          </label>

          <button className="primary-button" disabled={loading || form.otp.length !== 6} type="submit">
            {loading ? "Đang xác thực..." : "Xác nhận"}
          </button>

          <button className="ghost-button" disabled={resending || resendCooldown > 0 || !form.email.trim()} type="button" onClick={handleResendOTP}>
            {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : resending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
          </button>

          <p className="auth-link"><Link to="/login">Quay lại đăng nhập</Link></p>
        </form>
      </section>
    </main>
  );
};

export default VerifyOtpPage;
