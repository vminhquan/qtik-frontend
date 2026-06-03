const ACCESS_TOKEN_KEY = "qtik_access_token";
const REFRESH_TOKEN_KEY = "qtik_refresh_token";

const storage = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export const getAccessToken = () => storage()?.getItem(ACCESS_TOKEN_KEY) || null;

export const setAccessToken = (token) => {
  if (!token) return;
  storage()?.setItem(ACCESS_TOKEN_KEY, token);
};

export const getRefreshToken = () => storage()?.getItem(REFRESH_TOKEN_KEY) || null;

export const setRefreshToken = (token) => {
  if (!token) return;
  storage()?.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeTokens = () => {
  storage()?.removeItem(ACCESS_TOKEN_KEY);
  storage()?.removeItem(REFRESH_TOKEN_KEY);
};

export const setTokens = ({ accessToken, refreshToken }) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};
