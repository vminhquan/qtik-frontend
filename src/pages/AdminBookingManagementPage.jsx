import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import Pagination from "../components/Pagination";
import useBookings from "../hooks/useBookings";
import "../assets/styles/AdminPages.css";

const AdminBookingManagementPage = () => {
  const { bookings, page, limit, total, search, loading, error, setPage, setSearch, refetch } = useBookings({ admin: true });

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
        {loading ? <LoadingState /> : bookings.map((booking) => (
          <div className="admin-row" key={booking.id || booking._id || booking.booking_id}>
            <strong>#{booking.id || booking._id || booking.booking_id}</strong>
            <span>{booking.user?.email || booking.email || "Khách hàng"}</span>
            <span className={`status-pill ${String(booking.status || "pending").toLowerCase()}`}>{booking.status || "PENDING"}</span>
            <span>{Number(booking.total_price || booking.totalPrice || 0).toLocaleString("vi-VN")} VNĐ</span>
          </div>
        ))}
      </div>
      <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
    </section>
  );
};

export default AdminBookingManagementPage;
