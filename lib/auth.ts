export type StoredUser = {
  user_id?: string;
  email?: string;
  username?: string;
};

export type AuthUser = StoredUser;

function safeParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  const fromAuthUser = safeParse(localStorage.getItem("auth_user"));
  if (fromAuthUser && typeof fromAuthUser === "object") return fromAuthUser as StoredUser;

  const fromUser = safeParse(localStorage.getItem("user"));
  if (fromUser && typeof fromUser === "object") return fromUser as StoredUser;

  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const fallbackUser = {
        user_id: payload?.sub || payload?.user_id || payload?.username || "",
        email: payload?.email || "",
        username: payload?.username || payload?.sub || "",
      };
      if (fallbackUser.user_id) {
        localStorage.setItem("auth_user", JSON.stringify(fallbackUser));
        localStorage.setItem("user", JSON.stringify(fallbackUser));
        return fallbackUser;
      }
    } catch {}
  }

  return null;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setStoredSession(token: string, user: StoredUser) {
  if (typeof window === "undefined") return;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("auth_user", JSON.stringify(user));

  window.dispatchEvent(new Event("coin2win-auth-changed"));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("auth_user");

  window.dispatchEvent(new Event("coin2win-auth-changed"));
}

/* backward compatibility */
export function clearAuth() {
  clearStoredSession();
}

function buildAuthHeaders(extra?: Record<string, string>) {
  const token = getStoredToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

export async function apiAuth(
  path?: string,
  method: string = "GET",
  body?: unknown,
) {
  if (!path) {
    return { headers: buildAuthHeaders() };
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers: buildAuthHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.message === "string"
        ? data.message
        : typeof data?.raw === "string" && data.raw.trim()
        ? data.raw.trim()
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}
