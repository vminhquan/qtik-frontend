import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../api/userService";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/RegisterPage.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!EMAIL_PATTERN.test(formData.email.trim())) {
      return "Email không đúng định dạng.";
    }

    if (formData.password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Mật khẩu nhập lại không khớp.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        password: formData.password,
      };

      const response = await userService.register(payload);

      navigate("/verify-otp", {
        state: {
          email: payload.email,
          message: response?.message || "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.",
        },
        replace: true,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Đăng ký thất bại. Email hoặc số điện thoại có thể đã tồn tại."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <form className="register-page-box" onSubmit={handleSubmit}>
        <h2 className="register-page-title">Tạo Tài Khoản QTIK</h2>

        {error && <p className="register-page-error">{error}</p>}

        <input className="register-page-input" type="text" name="full_name" placeholder="Họ và tên" value={formData.full_name} onChange={handleChange} required />
        <input className="register-page-input" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} autoComplete="email" required />
        <input className="register-page-input" type="tel" name="phone_number" placeholder="Số điện thoại" value={formData.phone_number} onChange={handleChange} required />
        <input className="register-page-input" type="password" name="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} autoComplete="new-password" required />
        <input className="register-page-input" type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" required />

        <button className="register-page-btn" type="submit" disabled={isLoading}>
          {isLoading ? "Đang xử lý..." : "Đăng Ký"}
        </button>

        <p className="register-page-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link> hoặc <Link to="/verify-otp">nhập OTP</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
