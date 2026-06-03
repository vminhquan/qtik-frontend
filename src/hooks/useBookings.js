import { useCallback, useEffect, useMemo, useState } from "react";
import { bookingService } from "../api/bookingService";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";

const normalizeList = (response) => {
  if (Array.isArray(response)) return { items: response, total: response.length };
  return {
    items: response?.items || response?.data || response?.results || response?.tickets || [],
    total: response?.total || response?.count || response?.pagination?.total || 0,
  };
};

export const useBookings = ({ admin = false, initialPage = 1, initialLimit = 10 } = {}) => {
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => buildListParams({ page, limit, search }), [page, limit, search]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = admin
        ? await bookingService.getAllTickets(params)
        : await bookingService.getMyTickets(params);
      const { items, total: nextTotal } = normalizeList(response);
      setBookings(items);
      setTotal(nextTotal || items.length);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách vé."));
    } finally {
      setLoading(false);
    }
  }, [admin, params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    page,
    limit,
    total,
    search,
    loading,
    error,
    setPage,
    setLimit,
    setSearch,
    refetch: fetchBookings,
    createBooking: bookingService.createBooking,
    payBooking: bookingService.payBooking,
    deleteBooking: bookingService.deleteBooking,
  };
};

export default useBookings;
