import { useEffect } from "react";
import { THEME_STORAGE_KEY, applyTheme, getStoredTheme } from "../utils/themeManager";

const ThemeSync = () => {
  useEffect(() => {
    const syncTheme = () => applyTheme(getStoredTheme());
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

    syncTheme();

    const handleSystemThemeChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };

    const handleStorageChange = (event) => {
      if (event.key === THEME_STORAGE_KEY) syncTheme();
    };

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      mediaQuery?.addListener?.(handleSystemThemeChange);
    }
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        mediaQuery?.removeListener?.(handleSystemThemeChange);
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return null;
};

export default ThemeSync;
