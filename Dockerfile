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
COPY docker/40-drawdb-runtime-config.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/40-drawdb-runtime-config.sh
RUN echo 'server { listen 80; server_name _; root /usr/share/nginx/html; location = /runtime-config.js { add_header Cache-Control "no-store"; } location / { try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
