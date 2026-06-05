import { useCallback, useEffect, useMemo, useState } from "react";
import { bookingService } from "../api/bookingService";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";
import { buildNextPageProbeParams, resolvePaginatedResponse } from "../utils/paginationHelper";

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
      const requestPage = (nextParams) => (
        admin
          ? bookingService.getAllTickets(nextParams)
          : bookingService.getMyTickets(nextParams)
      );
      const { items, total: nextTotal } = await resolvePaginatedResponse({
        response,
        page,
        limit,
        listKeys: ["tickets", "bookings"],
        probeNextPage: () => requestPage(buildNextPageProbeParams(params, page, limit)),
      });

      if (page > 1 && items.length === 0) {
        setPage((currentPage) => Math.max(currentPage - 1, 1));
        return;
      }

      setBookings(items);
      setTotal(nextTotal);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách vé."));
    } finally {
      setLoading(false);
    }
  }, [admin, limit, page, params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
  }, [fetchBookings]);

  const updateSearch = useCallback((value) => {
    setPage(1);
    setSearch(value);
  }, []);

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
    setSearch: updateSearch,
    refetch: fetchBookings,
    createBooking: bookingService.createBooking,
    payBooking: bookingService.payBooking,
    deleteBooking: bookingService.deleteBooking,
  };
};

export default useBookings;
