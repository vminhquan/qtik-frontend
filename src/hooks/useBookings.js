import { useCallback, useEffect, useMemo, useState } from "react";
import { bookingService } from "../api/bookingService";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";
import {
  buildNextPageProbeParams,
  normalizePaginatedResponse,
  resolvePaginatedResponse,
} from "../utils/paginationHelper";

export const useBookings = ({
  admin = false,
  ticketsOnly = false,
  initialPage = 1,
  initialLimit = 10,
} = {}) => {
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestPageNumber = ticketsOnly ? 1 : page;
  const requestLimit = ticketsOnly ? 100 : limit;
  const requestSearch = ticketsOnly ? "" : search;
  const params = useMemo(
    () => buildListParams({
      page: requestPageNumber,
      limit: requestLimit,
      search: requestSearch,
    }),
    [requestLimit, requestPageNumber, requestSearch]
  );

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (ticketsOnly && !admin) {
        const allBookings = [];
        const seenBookingIds = new Set();
        let skip = 0;

        while (true) {
          const response = await bookingService.getMyTickets({
            skip,
            limit: requestLimit,
          });
          const batch = normalizePaginatedResponse(
            response,
            ["tickets", "bookings"]
          ).items;
          const unseenBookings = batch.filter((booking) => {
            const id = String(booking?.id || "");
            if (!id || seenBookingIds.has(id)) return false;
            seenBookingIds.add(id);
            return true;
          });

          allBookings.push(...unseenBookings);
          if (batch.length < requestLimit || unseenBookings.length === 0) break;
          skip += batch.length;
        }

        setBookings(
          allBookings.filter((booking) =>
            (booking?.booking_items || []).some((item) => item?.ticket)
          )
        );
        return;
      }

      const response = admin
        ? await bookingService.getAllBookings(params)
        : await bookingService.getMyTickets(params);
      const requestPage = (nextParams) => (
        admin
          ? bookingService.getAllBookings(nextParams)
          : bookingService.getMyTickets(nextParams)
      );
      const { items, total: nextTotal } = await resolvePaginatedResponse({
        response,
        page: requestPageNumber,
        limit: requestLimit,
        listKeys: ["tickets", "bookings"],
        probeNextPage: () =>
          requestPage(
            buildNextPageProbeParams(params, requestPageNumber, requestLimit)
          ),
      });

      if (requestPageNumber > 1 && items.length === 0) {
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
  }, [admin, params, requestLimit, requestPageNumber, ticketsOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
  }, [fetchBookings]);

  const updateSearch = useCallback((value) => {
    setPage(1);
    setSearch(value);
  }, []);

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return bookings;
    return bookings.filter((booking) =>
      [
        booking.id,
        booking.event_id,
        booking.status,
        ...((booking.booking_items || []).map((item) => item.ticket?.qr_token)),
      ].some((value) => String(value || "").toLowerCase().includes(keyword))
    );
  }, [bookings, search]);

  const visibleBookings = useMemo(() => {
    if (!ticketsOnly) return filteredBookings;
    const offset = Math.max(page - 1, 0) * limit;
    return filteredBookings.slice(offset, offset + limit);
  }, [filteredBookings, limit, page, ticketsOnly]);

  return {
    bookings: visibleBookings,
    page,
    limit,
    total: ticketsOnly ? filteredBookings.length : total,
    search,
    loading,
    error,
    setPage,
    setLimit,
    setSearch: updateSearch,
    refetch: fetchBookings,
    createBooking: bookingService.createBooking,
    cancelBooking: bookingService.cancelBooking,
  };
};

export default useBookings;
