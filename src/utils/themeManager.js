export const THEME_STORAGE_KEY = "qtik_theme_preference";
export const THEME_OPTIONS = ["system", "light", "dark"];

export const isThemeOption = (theme) => THEME_OPTIONS.includes(theme);

export const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const getStoredTheme = () => {
  if (typeof window === "undefined") return "system";
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeOption(theme) ? theme : "system";
};

export const getResolvedTheme = (theme = getStoredTheme()) => (
  theme === "system" ? getSystemTheme() : theme
);

export const storeTheme = (theme) => {
  if (typeof window === "undefined" || !isThemeOption(theme)) return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const applyTheme = (theme = getStoredTheme()) => {
  if (typeof document === "undefined") return getResolvedTheme(theme);

  const safeTheme = isThemeOption(theme) ? theme : "system";
  const resolvedTheme = getResolvedTheme(safeTheme);
  const root = document.documentElement;

  root.dataset.theme = safeTheme;
  root.dataset.resolvedTheme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
  document.body?.classList.toggle("dark-theme", resolvedTheme === "dark");

  return resolvedTheme;
};
