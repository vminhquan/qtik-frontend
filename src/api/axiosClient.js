import axios from "axios";
import { BASE_URL, USER_API } from "../constants/apiEndpoints";
import {
  getAccessToken,
  getAuthScopeFromPath,
  getRefreshToken,
  removeTokens,
  setAccessToken,
  setRefreshToken,
} from "../utils/tokenHelper";
import { normalizeApiError } from "../utils/errorHandler";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshQueue = [];

const resolveRefreshQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

const extractAccessToken = (payload) =>
  payload?.accessToken || payload?.access_token || payload?.token || payload?.data?.accessToken || payload?.data?.access_token;

const extractRefreshToken = (payload) =>
  payload?.refreshToken || payload?.refresh_token || payload?.data?.refreshToken || payload?.data?.refresh_token;

const getRequestScope = (config = {}) => {
  if (config.authScope) return config.authScope;
  if (typeof window === "undefined") return "user";
  return getAuthScopeFromPath(window.location.pathname);
};

const redirectToLogin = (scope = "user") => {
  removeTokens(scope);
  if (typeof window !== "undefined") {
    const loginPath = scope === "admin" ? "/admin/login" : "/login";
    if (window.location.pathname !== loginPath) {
      window.location.assign(loginPath);
    }
  }
};

axiosClient.interceptors.request.use(
  (config) => {
    if (config.skipAuth) {
      delete config.headers.Authorization;
      return config;
    }

    const scope = getRequestScope(config);
    config.authScope = scope;

    const token = getAccessToken(scope);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const scope = getRequestScope(originalRequest);
    const isPublicRequest = originalRequest?.skipAuth || originalRequest?.skipAuthRedirect;
    const requestUrl = originalRequest?.url || "";
    const isAuthRequest =
      requestUrl.includes(USER_API.LOGIN) ||
      requestUrl.includes(USER_API.REFRESH_TOKEN) ||
      requestUrl.includes(USER_API.REGISTER);

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest || isPublicRequest) {
      return Promise.reject(normalizeApiError(error));
    }

    const refreshToken = getRefreshToken(scope);
    if (!refreshToken) {
      redirectToLogin(scope);
      return Promise.reject(normalizeApiError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(`${BASE_URL}${USER_API.REFRESH_TOKEN}`, {
        refreshToken,
        refresh_token: refreshToken,
      });

      const newAccessToken = extractAccessToken(refreshResponse.data);
      const newRefreshToken = extractRefreshToken(refreshResponse.data);

      if (!newAccessToken) {
        throw new Error("Refresh token response does not contain access token.");
      }

      setAccessToken(newAccessToken, scope);
      if (newRefreshToken) setRefreshToken(newRefreshToken, scope);

      resolveRefreshQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return axiosClient(originalRequest);
    } catch (refreshError) {
      resolveRefreshQueue(refreshError, null);
      redirectToLogin(scope);
      return Promise.reject(normalizeApiError(refreshError));
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
