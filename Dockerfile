# Stage 1: Build the app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Stage 2: Setup the Nginx Server to serve the app
FROM docker.io/library/nginx:stable-alpine3.23 AS production
COPY --from=build /app/dist /usr/share/nginx/html
ENV VITE_BACKEND_URL="" VITE_GIST_BACKEND_URL=""
RUN mkdir -p /etc/nginx/templates && echo 'server { listen 80; server_name _; root /usr/share/nginx/html; location = /config.js { default_type application/javascript; add_header Cache-Control "no-store"; return 200 "window.__DRAWDB_CONFIG__ = { backendUrl: \"${VITE_BACKEND_URL}\", gistBackendUrl: \"${VITE_GIST_BACKEND_URL}\" };"; } location / { try_files $uri /index.html; } }' > /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
