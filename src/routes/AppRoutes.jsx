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
import MovieDetailPage from "../pages/MovieDetailPage";
import MovieManagementPage from "../pages/MovieManagementPage";
import PaymentPage from "../pages/PaymentPage";
import ProfilePage, { ChangePasswordPage, TicketDetailPage, TicketsPage } from "../pages/ProfilePage";
import RegisterPage from "../pages/RegisterPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import VerifyOtpPage from "../pages/VerifyOtpPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

const BookingPageWrapper = () => {
  const { eventId } = useParams();
  const parsedEventId = Number(eventId) || null;
  return <BookingPage key={parsedEventId || "all-showtimes"} eventId={parsedEventId} />;
};

const MovieShowtimesPageWrapper = () => {
  const { filmId } = useParams();
  const parsedFilmId = Number(filmId) || null;
  return <BookingPage key={`film-${parsedFilmId || "all"}`} filmId={parsedFilmId} />;
};

const AppRoutes = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/movies/:id" element={<MovieDetailPage />} />
    </Route>

    <Route path="/login" element={<LoginPage />} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/verify-otp" element={<VerifyOtpPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<PublicLayout />}>
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/movie/:filmId" element={<MovieShowtimesPageWrapper />} />
        <Route path="/booking/:eventId" element={<BookingPageWrapper />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/password" element={<ChangePasswordPage />} />
        <Route path="/profile/tickets" element={<TicketsPage />} />
        <Route path="/profile/tickets/:bookingId" element={<TicketDetailPage />} />
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
