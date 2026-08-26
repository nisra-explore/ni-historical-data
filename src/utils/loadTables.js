import { meta_name } from "../config/config.js";

// Named export of an async function
const TABLES_CACHE_KEY = `${meta_name}:tables:v1`;     // bump v1→v2 if schema changes
const TABLES_TTL_MS    = 60 * 60 * 1000;        // 1 hour

export function readCachedTables(allowStale = false) {
  try {
    const raw = localStorage.getItem(TABLES_CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!data) return null;
    if (allowStale) return data;
    if (Date.now() - ts < TABLES_TTL_MS) return data;
    return null;
  } catch { return null; }
}

export function writeCachedTables(data) {
  try {
    localStorage.setItem(TABLES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* storage may be full or blocked; ignore */ }
}

export async function loadTables(json) {

  const url = `public/data/${json}.json`;

  const fresh = readCachedTables(false);
  if (fresh) return fresh;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    writeCachedTables(data);
    return data;
  } catch (e) {
    const stale = readCachedTables(true);
    if (stale) return stale;
    throw e;
  }
}
