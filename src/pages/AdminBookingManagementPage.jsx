import { useEffect, useMemo, useState } from "react";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import { userService } from "../api/userService";
import useBookings from "../hooks/useBookings";
import "../assets/styles/AdminPages.css";

const getBookingUserId = (booking) => booking?.user_id;
const getBookingId = (booking) => booking.id || booking._id || booking.booking_id;
const getUserEmail = (response) => response?.data?.email || response?.email || "";

const AdminBookingManagementPage = () => {
  const { bookings, page, limit, total, search, loading, error, setPage, setSearch, refetch } = useBookings({ admin: true });
  const [userEmailsById, setUserEmailsById] = useState({});

  const bookingUserIds = useMemo(
    () => [...new Set(bookings.map(getBookingUserId).filter((userId) => userId !== null && userId !== undefined).map(String))],
    [bookings]
  );

  useEffect(() => {
    const missingUserIds = bookingUserIds.filter((userId) => !userEmailsById[userId]);
    if (!missingUserIds.length) return undefined;

    let ignore = false;

    const fetchBookingUsers = async () => {
      const responses = await Promise.allSettled(missingUserIds.map((userId) => userService.getUserById(userId)));
      if (ignore) return;

      const nextEmails = responses.reduce((acc, result, index) => {
        if (result.status !== "fulfilled") return acc;

        const email = getUserEmail(result.value);
        if (email) acc[missingUserIds[index]] = email;

        return acc;
      }, {});

      if (Object.keys(nextEmails).length) {
        setUserEmailsById((prev) => ({ ...prev, ...nextEmails }));
      }
    };

    fetchBookingUsers();

    return () => {
      ignore = true;
    };
  }, [bookingUserIds, userEmailsById]);

  const revenue = bookings
    .filter((item) => String(item.status || "").toLowerCase() === "completed" || String(item.status || "").toLowerCase() === "paid")
    .reduce((sum, item) => sum + Number(item.total_price || item.totalPrice || item.price || 0), 0);

  return (
    <section className="admin-page">
      <header className="page-header">
        <div><span className="page-kicker">Admin</span><h1>Đơn hàng & doanh thu</h1><p>Doanh thu trang hiện tại: {revenue.toLocaleString("vi-VN")} VNĐ</p></div>
        <label className="search-box"><span>Lọc trạng thái</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="COMPLETED, CANCELLED..." /></label>
      </header>
      {error && <ErrorState message={error} onRetry={refetch} />}
      <div className="admin-panel">
        {loading ? <LoadingState /> : bookings.map((booking) => {
          const status = booking.status || "PENDING";
          const userEmail = userEmailsById[String(getBookingUserId(booking))] || "Khách hàng";

          return (
            <div className="admin-row" key={getBookingId(booking)}>
              <strong>#{getBookingId(booking)}</strong>
              <span>{userEmail}</span>
              <span className={`status-pill ${String(status).toLowerCase()}`}>{status}</span>
              <span>{Number(booking.total_price || booking.totalPrice || 0).toLocaleString("vi-VN")} VNĐ</span>
            </div>
          );
        })}
      </div>
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
    </section>
  );
};

export default AdminBookingManagementPage;
