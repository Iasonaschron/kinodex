const API_BASE = "http://localhost:3001";

let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

/**
 * Login now requires BOTH username and email (plus password).
 * Matches backend: POST /api/auth/login { username, email, password }
 */
export async function login(username, email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // so refresh cookie is stored
    body: JSON.stringify({ username, email, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }

  const data = await res.json();      // { accessToken, user }
  accessToken = data.accessToken;     // keep short-lived token in memory
  return data.user;
}

/**
 * Optional helpers
 */
export async function logout() {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  clearAccessToken();
}

/**
 * Protected requests:
 * - Attaches Authorization: Bearer <accessToken>
 * - On 401, calls /auth/refresh (cookie) and retries once
 */
export async function authedFetch(url, init = {}) {
  const headers = new Headers(init.headers || {});
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let res = await fetch(`${API_BASE}${url.startsWith("/") ? url : `/${url}`}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status !== 401) return res;

  // Try refresh once
  const r = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!r.ok) throw new Error("Session expired. Please log in again.");

  const { accessToken: newTok } = await r.json();
  accessToken = newTok;

  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${API_BASE}${url.startsWith("/") ? url : `/${url}`}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

export async function signup({ username, email, password }) {
  const res = await fetch("http://localhost:3001/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, email, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Signup failed");
  }

  // Optional: if your backend returns accessToken + user on signup:
  const data = await res.json(); // e.g., { accessToken, user }
  if (data.accessToken) {
    // reuse your in‑memory token if you want auto‑login after signup
    // (assuming same module scope as login)
    // accessToken = data.accessToken;
  }
  return data.user ?? true;
}

async function refreshAccess() {
  const r = await fetch("http://localhost:3001/api/auth/refresh", {
    method: "POST",
    credentials: "include", // sends the httpOnly refresh cookie
  });
  if (!r.ok) throw new Error("Not logged in");
  const { accessToken: tok } = await r.json();
  accessToken = tok;
  return tok;
}

export async function getMe() {
  // make sure we have an access token first
  if (!accessToken) await refreshAccess();
  const res = await fetch("http://localhost:3001/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Not logged in");
  return res.json();
}