// Lightweight app-wide settings persisted to localStorage.
// Consumers subscribe via the "pi:settings" custom event.

export type AppSettings = {
  desktopSite: boolean;
  reducedMotion: boolean;
  aiCopilot: boolean;
  notifications: boolean;
  analytics: boolean;
};

const KEY = "pitrade_app_settings_v1";
const EVT = "pi:settings";

export const DEFAULT_SETTINGS: AppSettings = {
  desktopSite: false,
  reducedMotion: false,
  aiCopilot: true,
  notifications: false,
  analytics: true,
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(next: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVT, { detail: next }));
  applySettings(next);
}

export function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  const cur = loadSettings();
  saveSettings({ ...cur, [key]: value });
}

/** Apply settings that require DOM side-effects (viewport, motion class). */
export function applySettings(s: AppSettings) {
  if (typeof document === "undefined") return;
  // Desktop site: force a wide viewport so the mobile browser scales the page like a desktop.
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) {
    vp.setAttribute(
      "content",
      s.desktopSite
        ? "width=1280, initial-scale=0.35, maximum-scale=5"
        : "width=device-width, initial-scale=1",
    );
  }
  document.documentElement.dataset.desktopSite = s.desktopSite ? "true" : "false";
  document.documentElement.dataset.reducedMotion = s.reducedMotion ? "true" : "false";
}

export function subscribeSettings(cb: (s: AppSettings) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<AppSettings>).detail);
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
