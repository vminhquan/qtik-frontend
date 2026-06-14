import axiosClient from "./axiosClient";
import { MOVIE_API } from "../constants/apiEndpoints";

export const movieService = {
  createMovie: (data) => axiosClient.post(MOVIE_API.CREATE, data),
  getMovies: (params, config = {}) => axiosClient.get(MOVIE_API.GET_ALL, { ...config, params }),
  getHotMovies: (config = {}) => axiosClient.get(MOVIE_API.HOT, config),
  getMovieById: (id, config = {}) => axiosClient.get(MOVIE_API.DETAIL(id), config),
  updateMovie: (id, data) => axiosClient.put(MOVIE_API.DETAIL(id), data),
  deleteMovie: (id) => axiosClient.delete(MOVIE_API.DETAIL(id)),
};

export default movieService;
