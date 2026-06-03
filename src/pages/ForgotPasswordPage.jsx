import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../api/userService";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/AuthPages.css";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await userService.forgotPassword({ email: email.trim() });
      navigate("/reset-password", {
        state: {
          email: email.trim(),
          message: "OTP đặt lại mật khẩu đã được gửi tới email của bạn.",
        },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Không thể gửi OTP đặt lại mật khẩu."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page compact-auth">
      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <span className="auth-kicker">Recovery</span>
            <h2>Quên mật khẩu</h2>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>

          <p className="auth-link"><Link to="/login">Quay lại đăng nhập</Link></p>
        </form>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
