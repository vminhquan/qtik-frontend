import { useState } from "react";
import { useLocation } from "react-router-dom";
import { authService } from "../api/authService";
import { userService } from "../api/userService";
import { AuthContext } from "./authContextValue";
import {
  getAccessToken,
  getAuthScopeFromPath,
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

const emptySession = { currentUser: null, isAuthenticated: false };

const readStoredSession = (scope) => {
  const token = getAccessToken(scope);
  if (!token) return emptySession;

  try {
    return {
      currentUser: normalizeJwtUser(decodeJwtPayload(token)),
      isAuthenticated: true,
    };
  } catch {
    removeTokens(scope);
    return emptySession;
  }
};

export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const activeScope = getAuthScopeFromPath(location.pathname);
  const [sessions, setSessions] = useState(() => ({
    user: readStoredSession("user"),
    admin: readStoredSession("admin"),
  }));
  const activeSession = sessions[activeScope] || emptySession;
  const { currentUser, isAuthenticated } = activeSession;
  const loading = false;

  const login = async (credentialsOrEmail, passwordOrOptions, maybeOptions) => {
    const credentials =
      typeof credentialsOrEmail === "string"
        ? { email: credentialsOrEmail, password: passwordOrOptions }
        : credentialsOrEmail;
    const options = typeof credentialsOrEmail === "string" ? maybeOptions : passwordOrOptions;
    const scope = options?.scope || activeScope;

    const response = await authService.login(credentials);
    const accessToken = extractAccessToken(response);
    const refreshToken = extractRefreshToken(response);

    if (!accessToken) {
      throw new Error("Login response does not contain access token.");
    }

    setAccessToken(accessToken, scope);
    if (refreshToken) setRefreshToken(refreshToken, scope);

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

    setSessions((prev) => ({
      ...prev,
      [scope]: {
        currentUser: user,
        isAuthenticated: true,
      },
    }));

    return response;
  };

  const logout = async (options = {}) => {
    const scope = options.scope || activeScope;
    try {
      await userService.logout();
    } catch {
      // Vẫn xóa token local để đảm bảo phiên frontend kết thúc.
    } finally {
      removeTokens(scope);
      setSessions((prev) => ({
        ...prev,
        [scope]: emptySession,
      }));
    }
  };

  const updateCurrentUser = (user) => {
    setSessions((prev) => ({
      ...prev,
      [activeScope]: {
        ...prev[activeScope],
        currentUser: user,
      },
    }));
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    authScope: activeScope,
    updateCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
