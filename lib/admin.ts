const API_BASE = "/api"
const ADMIN_KEY_STORAGE = "adminKey"

export function getAdminKey() {
  if (typeof window === "undefined") return ""

  return (
    localStorage.getItem("adminKey") ||
    localStorage.getItem("admin_key") ||
    localStorage.getItem("coin2win_admin_key") ||
    ""
  )
}

export function setAdminKey(key: string) {
  if (typeof window === "undefined") return

  localStorage.setItem("adminKey", key)
  localStorage.setItem("admin_key", key)
  localStorage.setItem("coin2win_admin_key", key)
}

export function clearAdminKey() {
  if (typeof window === "undefined") return

  localStorage.removeItem("adminKey")
  localStorage.removeItem("admin_key")
  localStorage.removeItem("coin2win_admin_key")
}

export async function adminGet(path: string) {
  const adminKey = getAdminKey()

  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
    cache: "no-store",
  })

  const text = await res.text()
  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "object" && data?.detail
        ? data.detail
        : `GET ${path} failed with ${res.status}`
    )
  }

  return data
}

export async function adminPost(path: string, body?: any) {
  const adminKey = getAdminKey()
  const payload = body ?? {}

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "object" && data?.detail
        ? data.detail
        : `POST ${path} failed with ${res.status}`
    )
  }

  return data
}
