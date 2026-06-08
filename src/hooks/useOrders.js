import { useCallback, useEffect, useMemo, useState } from "react";
import { orderService } from "../api/orderService";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";
import {
  buildNextPageProbeParams,
  resolvePaginatedResponse,
} from "../utils/paginationHelper";

export const useOrders = ({
  admin = false,
  initialPage = 1,
  initialLimit = 10,
} = {}) => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(
    () => buildListParams({ page, limit }),
    [page, limit]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const request = (nextParams) =>
        admin
          ? orderService.getAllOrders(nextParams)
          : orderService.getMyOrders(nextParams);
      const response = await request(params);
      const { items, total: nextTotal } = await resolvePaginatedResponse({
        response,
        page,
        limit,
        listKeys: ["orders"],
        probeNextPage: () =>
          request(buildNextPageProbeParams(params, page, limit)),
      });

      if (page > 1 && items.length === 0) {
        setPage((current) => Math.max(current - 1, 1));
        return;
      }

      setOrders(items);
      setTotal(nextTotal);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách đơn hàng."));
    } finally {
      setLoading(false);
    }
  }, [admin, limit, page, params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) =>
      [
        order.id,
        order.order_code,
        order.status,
        order.description,
        order.customer?.full_name,
        order.customer?.email,
        order.customer?.phone_number,
        order.provider_order_code,
        order.movie_title,
        ...(order.seat_codes || []),
      ].some((value) => String(value || "").toLowerCase().includes(keyword))
    );
  }, [orders, search]);

  const updateSearch = useCallback((value) => {
    setPage(1);
    setSearch(value);
  }, []);

  return {
    orders: filteredOrders,
    page,
    limit,
    total,
    search,
    loading,
    error,
    setPage,
    setLimit,
    setSearch: updateSearch,
    refetch: fetchOrders,
  };
};

export default useOrders;
