import { useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../api/userService";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/errorHandler";
import "../assets/styles/UserPages.css";

const getProfileFormData = (user) => ({
  full_name: user?.full_name || "",
  email: user?.email || "",
  phone_number: user?.phone_number || "",
});
const getProfileInitials = (user) => {
  const name =
    user?.full_name || user?.fullName || user?.name || user?.email || "QT";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};
const isVerifiedEmail = (user) =>
  user?.is_active === true ||
  user?.isActive === true ||
  user?.is_active === 1 ||
  user?.isActive === 1;

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m4 16.8-.8 3.2 3.2-.8L18.9 6.7a2 2 0 0 0-2.8-2.8L4 16.8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m14.5 5.5 3 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m5 12 4.2 4.2L19 6.8"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProfileForm = ({ currentUser, updateCurrentUser }) => {
  const [form, setForm] = useState(() => getProfileFormData(currentUser));
  const [editing, setEditing] = useState({
    full_name: false,
    phone_number: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const verifiedEmail = isVerifiedEmail(currentUser);
  const isDirty =
    form.full_name.trim() !== (currentUser?.full_name || "") ||
    form.phone_number.trim() !== (currentUser?.phone_number || "");

  const toggleEdit = (field) => {
    setMessage("");
    setError("");
    setEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const resetForm = () => {
    setForm(getProfileFormData(currentUser));
    setEditing({ full_name: false, phone_number: false });
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isDirty) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
      };
      const response = await userService.updateProfile(payload);
      const nextUser =
        response?.user ||
        response?.data?.user ||
        response?.profile ||
        response?.data;
      updateCurrentUser({
        ...currentUser,
        ...payload,
        ...(nextUser && typeof nextUser === "object" ? nextUser : {}),
      });
      setEditing({ full_name: false, phone_number: false });
      setMessage("Cập nhật tài khoản thành công.");
    } catch (err) {
      setError(getErrorMessage(err, "Không thể cập nhật tài khoản."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="profile-form profile-card" onSubmit={handleSubmit}>
      <div className="profile-card-head">
        <span className="profile-avatar">
          {getProfileInitials(currentUser)}
        </span>
        <div>
          <h2>{currentUser?.full_name || "Tài khoản QTIK"}</h2>
        </div>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="success-banner">{message}</p>}

      <div className="profile-field-list">
        <div className="profile-field-row">
          <label htmlFor="profile-full-name">Họ và tên</label>
          <div className="profile-field-control">
            <input
              id="profile-full-name"
              value={form.full_name}
              disabled={!editing.full_name || saving}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, full_name: event.target.value }))
              }
              required
            />
            <button
              className="profile-icon-button"
              type="button"
              onClick={() => toggleEdit("full_name")}
              aria-label="Sửa họ và tên"
            >
              <PencilIcon />
            </button>
          </div>
        </div>

        <div className="profile-field-row">
          <label htmlFor="profile-email">Email</label>
          <div className="profile-field-control">
            <input
              id="profile-email"
              type="email"
              value={form.email}
              disabled
              readOnly
            />
            <span
              className={
                verifiedEmail
                  ? "profile-verified-badge"
                  : "profile-unverified-badge"
              }
            >
              {verifiedEmail && <CheckIcon />}
              {verifiedEmail ? "Đã xác thực" : "Chưa xác thực"}
            </span>
          </div>
        </div>

        <div className="profile-field-row">
          <label htmlFor="profile-phone">Số điện thoại</label>
          <div className="profile-field-control">
            <input
              id="profile-phone"
              value={form.phone_number}
              disabled={!editing.phone_number || saving}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  phone_number: event.target.value,
                }))
              }
              required
            />
            <button
              className="profile-icon-button"
              type="button"
              onClick={() => toggleEdit("phone_number")}
              aria-label="Sửa số điện thoại"
            >
              <PencilIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button
          className="ghost-button"
          type="button"
          onClick={resetForm}
          disabled={saving}
        >
          Hủy
        </button>
        <button
          className="primary-button"
          disabled={saving || !isDirty}
          type="submit"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
};

const passwordInitialState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  otp: "",
};

const getCurrentUserEmail = (user) => user?.email || user?.user?.email || "";

export const ChangePasswordPage = () => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(passwordInitialState);
  const [step, setStep] = useState("password");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validatePasswordForm = () => {
    if (!getCurrentUserEmail(currentUser))
      return "Không tìm thấy email tài khoản để gửi OTP.";
    if (!form.currentPassword) return "Vui lòng nhập mật khẩu hiện tại.";
    if (form.newPassword.length < 6)
      return "Mật khẩu mới phải có ít nhất 6 ký tự.";
    if (form.newPassword !== form.confirmPassword)
      return "Mật khẩu nhập lại không khớp.";
    if (form.currentPassword === form.newPassword)
      return "Mật khẩu mới phải khác mật khẩu hiện tại.";
    return "";
  };

  const buildResetPasswordPayload = () => ({
    email: getCurrentUserEmail(currentUser).trim(),
    otp: form.otp.trim(),
    new_password: form.newPassword,
  });

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const validationError = validatePasswordForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const email = getCurrentUserEmail(currentUser).trim();
      await userService.login({ email, password: form.currentPassword });
      const response = await userService.forgotPassword({ email });
      setStep("otp");
      setMessage(
        response?.message || "Mã OTP xác nhận đã được gửi tới email của bạn.",
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Mật khẩu hiện tại không đúng hoặc chưa thể gửi OTP.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();

    if (form.otp.trim().length !== 6) {
      setError("Vui lòng nhập OTP 6 số.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await userService.resetPassword(
        buildResetPasswordPayload(),
      );
      setForm(passwordInitialState);
      setStep("password");
      setMessage(response?.message || "Đổi mật khẩu thành công.");
    } catch (err) {
      setError(getErrorMessage(err, "OTP không hợp lệ hoặc đã hết hạn."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="user-page password-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Security</span>
          <h1>Đổi mật khẩu</h1>
        </div>
      </header>

      <div className="password-card">
        <div className="password-steps" aria-label="Tiến trình đổi mật khẩu">
          <span className={step === "password" ? "active" : ""}>
            1. Mật khẩu
          </span>
          <span className={step === "otp" ? "active" : ""}>2. OTP</span>
        </div>

        {message && <p className="success-banner">{message}</p>}
        {error && <p className="auth-error">{error}</p>}

        {step === "password" ? (
          <form className="password-form" onSubmit={handlePasswordSubmit}>
            <label>
              Mật khẩu hiện tại
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  updateForm("currentPassword", event.target.value)
                }
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) =>
                  updateForm("newPassword", event.target.value)
                }
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              Nhập lại mật khẩu mới
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  updateForm("confirmPassword", event.target.value)
                }
                autoComplete="new-password"
                required
              />
            </label>
            <div className="profile-actions">
              <Link className="ghost-button" to="/profile">
                Hủy
              </Link>
              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Đang kiểm tra..." : "Tiếp tục"}
              </button>
            </div>
          </form>
        ) : (
          <form className="password-form" onSubmit={handleOtpSubmit}>
            <label>
              OTP 6 số
              <input
                value={form.otp}
                inputMode="numeric"
                maxLength="6"
                placeholder="123456"
                onChange={(event) =>
                  updateForm("otp", event.target.value.replace(/\D/g, ""))
                }
                required
              />
            </label>
            <div className="profile-actions">
              <Link className="ghost-button" to="/profile">
                Hủy
              </Link>
              <button
                className="primary-button"
                type="submit"
                disabled={loading || form.otp.length !== 6}
              >
                {loading ? "Đang xác thực..." : "Xác nhận đổi mật khẩu"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

const ProfilePage = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const profileKey = [
    currentUser?.id || currentUser?.email || "profile",
    currentUser?.full_name || currentUser?.fullName || currentUser?.name || "",
    currentUser?.email || "",
    currentUser?.phone_number || "",
    currentUser?.is_active ?? currentUser?.isActive ?? "",
  ].join("-");

  return (
    <section className="user-page profile-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Profile</span>
          <h1>Tài khoản của tôi</h1>
        </div>
      </header>

      <ProfileForm
        key={profileKey}
        currentUser={currentUser}
        updateCurrentUser={updateCurrentUser}
      />
    </section>
  );
};

export default ProfilePage;
