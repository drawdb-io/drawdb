#!/bin/sh
set -eu

CONTENT_DIR="/usr/share/nginx/html"
# Allow overriding the served base path at runtime (default /)
BASE_PATH="${DRAWDB_BASE_PATH:-/}"

if [ -z "$BASE_PATH" ]; then
  BASE_PATH="/"
fi

# Reject absolute URLs; only relative paths are supported
case "$BASE_PATH" in
  http://*|https://*)
    echo "DRAWDB_BASE_PATH must be a relative path (e.g. /drawdb)" >&2
    exit 1
    ;;
esac

# Ensure the path has a single leading slash and no trailing slash
if [ "$BASE_PATH" != "/" ]; then
  BASE_PATH="/${BASE_PATH#/}"
  BASE_PATH="${BASE_PATH%/}"
fi

# Derive helper variants used by the templated replacements below
if [ "$BASE_PATH" = "/" ]; then
  BASE_PATH_WITH_SLASH="/"
  BASE_PATH_NO_LEAD=""
  BASE_PATH_NO_LEAD_WITH_SLASH=""
else
  BASE_PATH_WITH_SLASH="$BASE_PATH/"
  BASE_PATH_NO_LEAD="${BASE_PATH#/}"
  BASE_PATH_NO_LEAD_WITH_SLASH="${BASE_PATH_NO_LEAD}/"
fi

# Replace the placeholder base path in built assets, if present
if grep -R "__BASE_PATH__" "$CONTENT_DIR" >/dev/null 2>&1; then
  find "$CONTENT_DIR" -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.json' -o -name '*.txt' \) -print0 |
    while IFS= read -r -d '' file; do
      sed -i \
        -e "s|/__BASE_PATH__/|${BASE_PATH_WITH_SLASH}|g" \
        -e "s|/__BASE_PATH__|${BASE_PATH}|g" \
        -e "s|__BASE_PATH__/|${BASE_PATH_NO_LEAD_WITH_SLASH}|g" \
        -e "s|__BASE_PATH__|${BASE_PATH_NO_LEAD}|g" \
        "$file"
    done
fi

# Generate Nginx configuration matching the selected base path
if [ "$BASE_PATH" = "/" ]; then
  cat >/etc/nginx/conf.d/default.conf <<'EOF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
EOF
else
  cat >/etc/nginx/conf.d/default.conf <<EOF
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;

  location = $BASE_PATH {
    return 301 $BASE_PATH/;
  }

  location $BASE_PATH/ {
    rewrite ^$BASE_PATH/(.*)$ /\$1 break;
    try_files \$uri \$uri/ /index.html;
  }
}
EOF
fi

exec "$@"
