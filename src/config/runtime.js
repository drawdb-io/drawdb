const DEFAULT_BACKEND_URL = "http://localhost:5000";

function decodeRuntimeValue(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    return undefined;
  }

  try {
    const decoded = atob(value);
    if (btoa(decoded) !== value) {
      return undefined;
    }

    const bytes = Uint8Array.from(decoded, (character) =>
      character.charCodeAt(0),
    );
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
}

function getRuntimeValue(runtimeConfig, key) {
  return decodeRuntimeValue(runtimeConfig?.[key]);
}

function normalizeBackendUrl(value) {
  return value?.replace(/\/+$/, "");
}

export function resolveBackendUrl(runtimeConfig, buildConfig) {
  return normalizeBackendUrl(
    getRuntimeValue(runtimeConfig, "VITE_BACKEND_URL") ||
      buildConfig?.VITE_BACKEND_URL,
  );
}

export function resolveGistBackendUrl(runtimeConfig, buildConfig) {
  return normalizeBackendUrl(
    getRuntimeValue(runtimeConfig, "VITE_GIST_BACKEND_URL") ||
      getRuntimeValue(runtimeConfig, "VITE_BACKEND_URL") ||
      buildConfig?.VITE_GIST_BACKEND_URL ||
      buildConfig?.VITE_BACKEND_URL ||
      DEFAULT_BACKEND_URL,
  );
}

export function getBackendUrl() {
  return resolveBackendUrl(
    globalThis.__DRAWDB_RUNTIME_CONFIG__,
    import.meta.env,
  );
}

export function getGistBackendUrl() {
  return resolveGistBackendUrl(
    globalThis.__DRAWDB_RUNTIME_CONFIG__,
    import.meta.env,
  );
}
