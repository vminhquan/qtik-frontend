import { useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../api/authService";
import { userService } from "../api/userService";
import { AuthContext } from "./authContextValue";
import {
  getAccessToken,
  removeTokens,
  setAccessToken,
  setRefreshToken,
} from "../utils/tokenHelper";
import { decodeJwtPayload } from "../utils/jwtHelper";
import { isEmailLike } from "../utils/userHelper";

const extractAccessToken = (payload) =>
  payload?.accessToken || payload?.access_token || payload?.token || payload?.data?.accessToken || payload?.data?.access_token;

const extractRefreshToken = (payload) =>
  payload?.refreshToken || payload?.refresh_token || payload?.data?.refreshToken || payload?.data?.refresh_token;

const extractUser = (payload) => payload?.user || payload?.data?.user || payload?.profile || null;

const normalizeJwtUser = (jwtUser, fallbackEmail) => ({
  id: jwtUser?.id || jwtUser?.user_id || jwtUser?.sub,
  full_name: jwtUser?.full_name || jwtUser?.fullName || jwtUser?.name,
  username: jwtUser?.username,
  email: jwtUser?.email || (isEmailLike(jwtUser?.sub) ? jwtUser.sub : fallbackEmail),
  role: jwtUser?.role || "user",
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()));
  const [loading, setLoading] = useState(true);

  const hydrateAuth = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const jwtUser = decodeJwtPayload(token);
      setIsAuthenticated(true);
      setCurrentUser((prev) => prev || normalizeJwtUser(jwtUser));
    } catch {
      removeTokens();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hydrateAuth();
  }, [hydrateAuth]);

  const login = useCallback(async (credentialsOrEmail, password) => {
    const credentials =
      typeof credentialsOrEmail === "string"
        ? { email: credentialsOrEmail, password }
        : credentialsOrEmail;

    const response = await authService.login(credentials);
    const accessToken = extractAccessToken(response);
    const refreshToken = extractRefreshToken(response);

    if (!accessToken) {
      throw new Error("Login response does not contain access token.");
    }

    setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);

    const jwtUser = decodeJwtPayload(accessToken);
    const responseUser = extractUser(response);
    const user = responseUser
      ? {
          ...normalizeJwtUser(jwtUser, credentials.email),
          ...responseUser,
          role: responseUser.role || response?.role || response?.data?.role || jwtUser?.role || "user",
        }
      : {
          ...normalizeJwtUser(jwtUser, credentials.email),
          role: response?.role || response?.data?.role || jwtUser?.role || "user",
        };

    setCurrentUser(user);
    setIsAuthenticated(true);

    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await userService.logout();
    } catch {
      // Vẫn xóa token local để đảm bảo phiên frontend kết thúc.
    } finally {
      removeTokens();
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateCurrentUser = useCallback((user) => {
    setCurrentUser(user);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated,
      loading,
      login,
      logout,
      updateCurrentUser,
    }),
    [currentUser, isAuthenticated, loading, login, logout, updateCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
