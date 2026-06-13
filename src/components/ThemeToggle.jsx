import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
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
        <Monitor aria-hidden="true" />
      ) : resolvedTheme === "dark" ? (
        <Moon aria-hidden="true" />
      ) : (
        <Sun aria-hidden="true" />
      )}
    </button>
  );
};

export default ThemeToggle;
