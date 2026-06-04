import { useEffect, useState } from "react";
import {
  THEME_OPTIONS,
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  storeTheme,
} from "../utils/themeManager";
import "../assets/styles/ThemeToggle.css";

const getNextTheme = (theme) => {
  const currentIndex = THEME_OPTIONS.indexOf(theme);
  return THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length] || "system";
};

const getToggleLabel = (theme, resolvedTheme) => {
  if (theme === "system") {
    return `Đang theo hệ điều hành (${resolvedTheme === "dark" ? "tối" : "sáng"}). Bấm để chọn giao diện sáng.`;
  }
  if (theme === "light") return "Đang dùng giao diện sáng. Bấm để chọn giao diện tối.";
  return "Đang dùng giao diện tối. Bấm để quay về theo hệ điều hành.";
};

const ThemeToggle = ({ compact = false }) => {
  const [theme, setTheme] = useState(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme, resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return undefined;

    const handleChange = () => {
      const nextSystemTheme = getSystemTheme();
      setSystemTheme(nextSystemTheme);
      if (theme === "system") applyTheme("system");
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener?.(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener?.(handleChange);
      }
    };
  }, [theme]);

  const label = getToggleLabel(theme, resolvedTheme);

  return (
    <button
      className={compact ? "theme-toggle compact" : "theme-toggle"}
      type="button"
      onClick={() => setTheme((currentTheme) => getNextTheme(currentTheme))}
      aria-label={label}
      title={label}
    >
      {theme === "system" ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5.8A2.8 2.8 0 0 1 6.8 3h10.4A2.8 2.8 0 0 1 20 5.8v7.9a2.8 2.8 0 0 1-2.8 2.8H6.8A2.8 2.8 0 0 1 4 13.7V5.8Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 21h6M12 16.5V21M8 7.6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : resolvedTheme === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20.2 15.44A7.7 7.7 0 0 1 8.56 3.8 8.6 8.6 0 1 0 20.2 15.44Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5.64 5.64 4.22 4.22M19.78 19.78l-1.42-1.42M18.36 5.64l1.42-1.42M4.22 19.78l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
