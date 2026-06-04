const TOKEN_KEYS = {
  user: {
    access: "qtik_access_token",
    refresh: "qtik_refresh_token",
  },
  admin: {
    access: "qtik_admin_access_token",
    refresh: "qtik_admin_refresh_token",
  },
};

const getTokenKeys = (scope = "user") => TOKEN_KEYS[scope] || TOKEN_KEYS.user;

const storage = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export const getAuthScopeFromPath = (pathname = "") => (pathname.startsWith("/admin") ? "admin" : "user");

export const getAccessToken = (scope = "user") => storage()?.getItem(getTokenKeys(scope).access) || null;

export const setAccessToken = (token, scope = "user") => {
  if (!token) return;
  storage()?.setItem(getTokenKeys(scope).access, token);
};

export const getRefreshToken = (scope = "user") => storage()?.getItem(getTokenKeys(scope).refresh) || null;

export const setRefreshToken = (token, scope = "user") => {
  if (!token) return;
  storage()?.setItem(getTokenKeys(scope).refresh, token);
};

export const removeTokens = (scope = "user") => {
  storage()?.removeItem(getTokenKeys(scope).access);
  storage()?.removeItem(getTokenKeys(scope).refresh);
};

export const setTokens = ({ accessToken, refreshToken }, scope = "user") => {
  setAccessToken(accessToken, scope);
  setRefreshToken(refreshToken, scope);
};
