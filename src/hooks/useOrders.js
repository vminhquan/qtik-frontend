import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { orderService } from "../api/orderService";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";
import {
  buildNextPageProbeParams,
  normalizePaginatedResponse,
  resolvePaginatedResponse,
} from "../utils/paginationHelper";

const isVisibleUserOrder = (order) =>
  ["pending", "paid"].includes(String(order?.status || "").toLowerCase());

export const useOrders = ({
  admin = false,
  initialPage = 1,
  initialLimit = 10,
} = {}) => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const params = useMemo(
    () =>
      buildListParams({
        page,
        limit,
        search: admin ? "" : requestSearch,
      }),
    [admin, limit, page, requestSearch],
  );

  useEffect(() => {
    if (admin) return undefined;

    const timer = window.setTimeout(() => {
      setPage(1);
      setRequestSearch(search.trim().replace(/\s+/g, " "));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [admin, search]);

  const fetchOrders = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError("");

    try {
      const request = (nextParams) =>
        admin
          ? orderService.getAllOrders(nextParams)
          : orderService.getMyOrders(nextParams);
      const response = await request(params);
      const result = admin
        ? await resolvePaginatedResponse({
            response,
            page,
            limit,
            listKeys: ["orders"],
            probeNextPage: () =>
              request(buildNextPageProbeParams(params, page, limit)),
          })
        : normalizePaginatedResponse(response, ["orders"]);
      if (requestIdRef.current !== requestId) return;

      const { items, total: nextTotal } = result;

      if (page > 1 && items.length === 0) {
        setPage((current) => Math.max(current - 1, 1));
        return;
      }

      const visibleItems = admin
        ? items
        : items.filter(isVisibleUserOrder);
      setOrders(visibleItems);
      setTotal(nextTotal ?? visibleItems.length);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(getErrorMessage(err, "Không thể tải danh sách đơn hàng."));
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [admin, limit, page, params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (!admin) return orders;

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
  }, [admin, orders, search]);

  const updateSearch = useCallback((value) => {
    if (admin) setPage(1);
    setSearch(value);
  }, [admin]);

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
