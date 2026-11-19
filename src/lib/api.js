/**
 * Thin fetch client for the Django API.
 *
 * - The access token lives in memory only; the refresh token in localStorage so a
 *   reload keeps the session (refresh tokens rotate and are blacklisted on logout).
 * - A 401 triggers ONE shared refresh, then the request is retried once.
 */
const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const REFRESH_KEY = "ledger.refresh";

let accessToken = null;
let refreshInFlight = null;
const authLostListeners = new Set();

function readRefresh() {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
function writeRefresh(value) {
  try {
    if (value) localStorage.setItem(REFRESH_KEY, value);
    else localStorage.removeItem(REFRESH_KEY);
  } catch { /* storage unavailable: session lasts until reload */ }
}

export const tokens = {
  get access() { return accessToken; },
  get refresh() { return readRefresh(); },
  set({ access, refresh }) {
    if (access !== undefined) accessToken = access;
    if (refresh !== undefined) writeRefresh(refresh);
  },
  clear() { accessToken = null; writeRefresh(null); },
};

export function onAuthLost(fn) {
  authLostListeners.add(fn);
  return () => authLostListeners.delete(fn);
}

export class ApiError extends Error {
  constructor(status, data) {
    super(describeError(data) || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
  /** Field-level messages from a DRF 400, e.g. { email: "Already exists." } */
  get fields() {
    if (!this.data || typeof this.data !== "object" || Array.isArray(this.data)) return {};
    const out = {};
    for (const [k, v] of Object.entries(this.data)) {
      if (k !== "detail" && k !== "non_field_errors") out[k] = Array.isArray(v) ? v.join(" ") : String(v);
    }
    return out;
  }
}

function describeError(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(describeError).join(" ");
  if (data.detail) return String(data.detail);
  if (data.non_field_errors) return describeError(data.non_field_errors);
  const [field, value] = Object.entries(data)[0] || [];
  return field ? `${field.replaceAll("_", " ")}: ${describeError(value)}` : "";
}

function buildUrl(path, params) {
  const url = new URL(`${BASE}/api/${path.replace(/^\//, "")}`, window.location.origin);
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  return BASE ? url.toString() : url.pathname + url.search;
}

async function refreshAccess() {
  const refresh = readRefresh();
  if (!refresh) return false;
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(buildUrl("auth/refresh/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      tokens.set({ access: data.access, refresh: data.refresh ?? refresh });
      return true;
    } catch {
      return false;
    } finally {
      queueMicrotask(() => { refreshInFlight = null; });
    }
  })();
  return refreshInFlight;
}

export async function api(path, { method = "GET", body, params, as = "json", signal } = {}) {
  const send = () =>
    fetch(buildUrl(path, params), {
      method,
      signal,
      headers: {
        // JSON stays acceptable for downloads so error bodies can always be rendered.
        Accept: as === "blob" ? "application/pdf, application/json;q=0.9" : "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await send();
  if (res.status === 401 && readRefresh()) {
    if (await refreshAccess()) {
      res = await send();
    } else {
      tokens.clear();
      authLostListeners.forEach((fn) => fn());
    }
  }

  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, data);
  }
  if (res.status === 204) return null;
  if (as === "blob") return { blob: await res.blob(), filename: filenameFrom(res) };
  return res.json();
}

/** Restore a session from the stored refresh token. */
export const restoreSession = refreshAccess;

/** Follow DRF pagination to the end (for small reference lists: departments, scales...). */
export async function fetchAll(path, params = {}) {
  const out = [];
  for (let page = 1; page < 100; page++) {
    const data = await api(path, { params: { ...params, page } });
    if (Array.isArray(data)) return data;
    out.push(...data.results);
    if (!data.next) break;
  }
  return out;
}

function filenameFrom(res) {
  const header = res.headers.get("Content-Disposition") || "";
  const match = header.match(/filename="?([^"]+)"?/);
  return match ? match[1] : "payslip.pdf";
}

/** Download a protected file (payslip PDF) with the bearer token. */
export async function download(path, params) {
  const { blob, filename } = await api(path, { params, as: "blob" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
