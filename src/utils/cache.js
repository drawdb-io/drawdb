export const STORAGE_KEY = "versions_cache";

export function loadCache() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveCache(cache) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function deleteFromCache(key) {
  const cache = loadCache();
  if (cache[key]) {
    delete cache[key];
    saveCache(cache);
  }
}
