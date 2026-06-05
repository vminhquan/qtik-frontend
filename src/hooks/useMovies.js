import { useCallback, useEffect, useMemo, useState } from "react";
import { movieService } from "../api/movieService";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";
import { buildNextPageProbeParams, resolvePaginatedResponse } from "../utils/paginationHelper";

export const useMovies = ({ initialPage = 1, initialLimit = 8, publicMode = false } = {}) => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => buildListParams({ page, limit, search }), [page, limit, search]);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await movieService.getMovies(
        params,
        publicMode ? { skipAuth: true, skipAuthRedirect: true } : {}
      );
      const { items, total: nextTotal } = await resolvePaginatedResponse({
        response,
        page,
        limit,
        listKeys: ["films", "movies"],
        probeNextPage: () => movieService.getMovies(
          buildNextPageProbeParams(params, page, limit),
          publicMode ? { skipAuth: true, skipAuthRedirect: true } : {}
        ),
      });

      if (page > 1 && items.length === 0) {
        setPage((currentPage) => Math.max(currentPage - 1, 1));
        return;
      }

      setMovies(items);
      setTotal(nextTotal);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách phim."));
    } finally {
      setLoading(false);
    }
  }, [limit, page, params, publicMode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMovies();
  }, [fetchMovies]);

  const updateSearch = useCallback((value) => {
    setPage(1);
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
