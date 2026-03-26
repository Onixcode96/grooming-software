import { useEffect } from "react";
import { useSettings } from "./useSettings";

export const THEME_PRESETS = {
  rose: {
    label: "Rosa",
    emoji: "🌸",
    primary: "333 82% 75%",
    primaryForeground: "0 0% 100%",
    ring: "333 82% 75%",
    accent: "340 60% 95%",
  },
  sky: {
    label: "Azzurro",
    emoji: "🌊",
    primary: "199 89% 68%",
    primaryForeground: "0 0% 100%",
    ring: "199 89% 68%",
    accent: "199 60% 94%",
  },
  teal: {
    label: "Verde Acqua",
    emoji: "🍃",
    primary: "168 60% 58%",
    primaryForeground: "0 0% 100%",
    ring: "168 60% 58%",
    accent: "168 40% 92%",
  },
  lilac: {
    label: "Lilla",
    emoji: "💜",
    primary: "270 60% 72%",
    primaryForeground: "0 0% 100%",
    ring: "270 60% 72%",
    accent: "270 40% 94%",
  },
  sand: {
    label: "Sabbia",
    emoji: "🏖️",
    primary: "30 55% 65%",
    primaryForeground: "0 0% 100%",
    ring: "30 55% 65%",
    accent: "30 40% 93%",
  },
  peach: {
    label: "Pesca",
    emoji: "🍑",
    primary: "15 80% 72%",
    primaryForeground: "0 0% 100%",
    ring: "15 80% 72%",
    accent: "15 50% 94%",
  },
} as const;

export type ThemeColorKey = keyof typeof THEME_PRESETS;

export const applyThemeColor = (key: string) => {
  const preset = THEME_PRESETS[key as ThemeColorKey];
  if (!preset) return;

  const root = document.documentElement;
  root.style.setProperty("--primary", preset.primary);
  root.style.setProperty("--primary-foreground", preset.primaryForeground);
  root.style.setProperty("--ring", preset.ring);
  root.style.setProperty("--sidebar-primary", preset.primary);
  root.style.setProperty("--sidebar-primary-foreground", preset.primaryForeground);
  root.style.setProperty("--sidebar-ring", preset.ring);
};

/**
 * Reads theme_color from settings and applies it to CSS variables.
 * Runs on every settings change (including realtime sync).
 */
export const useThemeColor = () => {
  const { data: settings } = useSettings();

  useEffect(() => {
    const color = (settings as any)?.theme_color || "rose";
    applyThemeColor(color);
  }, [settings]);
};
