const runtime =
  (typeof window !== "undefined" && window.__DRAWDB_CONFIG__) || {};

const trimSlash = (url) => url.replace(/\/+$/, "");

export const backendUrl = trimSlash(
  runtime.backendUrl ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:5000",
);

export const gistBackendUrl = trimSlash(
  runtime.gistBackendUrl ||
    runtime.backendUrl ||
    import.meta.env.VITE_GIST_BACKEND_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:5000",
);
