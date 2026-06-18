import type { PiUser } from "./pi";

const KEY = "pi_user_session_v1";

export function saveSession(user: PiUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("pi:session"));
}

export function loadSession(): PiUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PiUser) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("pi:session"));
}
