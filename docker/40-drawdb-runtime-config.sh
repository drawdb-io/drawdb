#!/bin/sh
set -eu

encode() {
  printf '%s' "$1" | base64 | tr -d '\r\n'
}

backend_url="$(encode "${VITE_BACKEND_URL:-}")"
gist_backend_url="$(encode "${VITE_GIST_BACKEND_URL:-}")"
output_path="${1:-/usr/share/nginx/html/runtime-config.js}"

write_config() {
  printf '%s\n' \
    'globalThis.__DRAWDB_RUNTIME_CONFIG__ = Object.freeze({' \
    "  VITE_BACKEND_URL: \"${backend_url}\"," \
    "  VITE_GIST_BACKEND_URL: \"${gist_backend_url}\"," \
    '});'
}

if [ "${output_path}" = '-' ]; then
  write_config
else
  write_config > "${output_path}"
fi
