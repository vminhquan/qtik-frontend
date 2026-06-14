import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { movieService } from "../api/movieService";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";
import { normalizePaginatedResponse } from "../utils/paginationHelper";

export const useMovies = ({
  initialPage = 1,
  initialLimit = 8,
  publicMode = false,
  filters,
} = {}) => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const filtersKey = JSON.stringify(filters || {});
  const requestFilters = useMemo(() => JSON.parse(filtersKey), [filtersKey]);

  const params = useMemo(
    () =>
      buildListParams({
        page,
        limit,
        search: requestSearch,
        filters: requestFilters,
      }),
    [limit, page, requestFilters, requestSearch],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setRequestSearch(search.trim().replace(/\s+/g, " "));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchMovies = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError("");

    try {
      const response = await movieService.getMovies(
        params,
        publicMode ? { skipAuth: true, skipAuthRedirect: true } : {}
      );
      if (requestIdRef.current !== requestId) return;

      const { items, total: nextTotal } = normalizePaginatedResponse(
        response,
        ["films", "movies"],
      );

      if (page > 1 && items.length === 0) {
        setPage((currentPage) => Math.max(currentPage - 1, 1));
        return;
      }

      setMovies(items);
      setTotal(nextTotal ?? items.length);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(getErrorMessage(err, "Không thể tải danh sách phim."));
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [page, params, publicMode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMovies();
  }, [fetchMovies]);

  const updateSearch = useCallback((value) => {
    setSearch(value);
  }, []);

  const createMovie = async (payload) => {
    const response = await movieService.createMovie(payload);
    await fetchMovies();
    return response;
  };

  const updateMovie = async (id, payload) => {
    const response = await movieService.updateMovie(id, payload);
    await fetchMovies();
    return response;
  };

  const deleteMovie = async (id) => {
    const response = await movieService.deleteMovie(id);
    await fetchMovies();
    return response;
  };

  return {
    movies,
    page,
    limit,
    total,
    search,
    loading,
    error,
    setPage,
    setLimit,
    setSearch: updateSearch,
    refetch: fetchMovies,
    createMovie,
    updateMovie,
    deleteMovie,
  };
};

export default useMovies;
