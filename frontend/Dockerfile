# Multi-stage Dockerfile for CuraSphere Frontend SPA
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments for edition and remote API endpoint
ARG VITE_API_URL=""
ARG VITE_APP_EDITION="Clinic"

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_EDITION=$VITE_APP_EDITION

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nginx web server for production SPA distribution
FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html

# Clean default html and copy built distribution
RUN rm -rf ./*
COPY --from=build /app/dist .

# Production SPA fall-through routing & gzip configuration
RUN echo 'server { \
    listen 80; \
    server_name _; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
