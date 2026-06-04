import { useEffect, useState } from "react";
import "../assets/styles/ThemeToggle.css";

const THEME_STORAGE_KEY = "qtik_theme";
const getStoredTheme = () => {
  if (typeof window === "undefined") return "system";
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  return ["light", "dark", "system"].includes(theme) ? theme : "system";
};

const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme, resolvedTheme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.resolvedTheme = resolvedTheme;
  document.body.classList.toggle("dark-theme", resolvedTheme === "dark");
};

const ThemeToggle = ({ compact = false }) => {
  const [theme, setTheme] = useState(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    applyTheme(theme, resolvedTheme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemTheme(getSystemTheme());
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      className={compact ? "theme-toggle compact" : "theme-toggle"}
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={resolvedTheme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
    >
      {resolvedTheme === "dark" ? (
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
