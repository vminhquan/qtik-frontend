import { Navigate, Route, Routes, useParams } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import PublicLayout from "../layouts/PublicLayout";
import AdminBookingManagementPage from "../pages/AdminBookingManagementPage";
import AdminEventManagementPage from "../pages/AdminEventManagementPage";
import AdminLoginPage from "../pages/AdminLoginPage";
import AdminRoomManagementPage from "../pages/AdminRoomManagementPage";
import AdminUserManagementPage from "../pages/AdminUserManagementPage";
import BookingPage from "../pages/BookingPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import MovieManagementPage from "../pages/MovieManagementPage";
import MoviesPage from "../pages/MoviesPage";
import PaymentPage from "../pages/PaymentPage";
import PaymentResultPage from "../pages/PaymentResultPage";
import ProfilePage, { ChangePasswordPage } from "../pages/ProfilePage";
import { OrderDetailPage, OrdersPage } from "../pages/OrderPage";
import RegisterPage from "../pages/RegisterPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import TheaterSchedulePage from "../pages/TheaterSchedulePage";
import VerifyOtpPage from "../pages/VerifyOtpPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

const BookingPageWrapper = () => {
  const { eventId } = useParams();
  return <BookingPage key={eventId || "all-showtimes"} eventId={eventId || null} />;
};

const AppRoutes = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/movies" element={<MoviesPage />} />
      <Route path="/showtimes" element={<TheaterSchedulePage />} />
      <Route path="/movies/:id" element={<Navigate to="/movies" replace />} />
      <Route path="/booking" element={<Navigate to="/#movie-catalog" replace />} />
      <Route path="/booking/movie/:filmId" element={<Navigate to="/#movie-catalog" replace />} />
    </Route>

    <Route path="/login" element={<LoginPage />} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/verify-otp" element={<VerifyOtpPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<PublicLayout />}>
        <Route path="/booking/:eventId" element={<BookingPageWrapper />} />
        <Route path="/payment/:orderId" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentResultPage />} />
        <Route path="/payment/cancel" element={<PaymentResultPage cancelled />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/password" element={<ChangePasswordPage />} />
        <Route path="/profile/orders" element={<OrdersPage />} />
        <Route path="/profile/orders/:orderId" element={<OrderDetailPage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute loginPath="/admin/login" />}>
      <Route element={<RoleRoute roles={["admin"]} redirectTo="/admin/login" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/movies" replace />} />
          <Route path="/admin/movies" element={<MovieManagementPage />} />
          <Route path="/admin/rooms" element={<AdminRoomManagementPage />} />
          <Route path="/admin/events" element={<AdminEventManagementPage />} />
          <Route path="/admin/bookings" element={<AdminBookingManagementPage />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
