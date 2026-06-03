import { useCallback, useEffect, useMemo, useState } from "react";
import { movieService } from "../api/movieService";
import { buildListParams, getErrorMessage } from "../utils/errorHandler";

const normalizeList = (response) => {
  if (Array.isArray(response)) return { items: response, total: response.length };
  return {
    items: response?.items || response?.data || response?.results || response?.films || [],
    total: response?.total || response?.count || response?.pagination?.total || 0,
  };
};

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
      const { items, total: nextTotal } = normalizeList(response);
      setMovies(items);
      setTotal(nextTotal || items.length);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách phim."));
    } finally {
      setLoading(false);
    }
  }, [params, publicMode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMovies();
  }, [fetchMovies]);

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
    setSearch,
    refetch: fetchMovies,
    createMovie,
    updateMovie,
    deleteMovie,
  };
};

export default useMovies;
