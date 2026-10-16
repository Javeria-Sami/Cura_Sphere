# Multi-stage Dockerfile for CuraSphere Frontend SPA
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nginx web server for production SPA distribution
FROM nginx:alpine AS final
COPY --from=build /app/dist /usr/share/nginx/html

# SPA fall-through routing config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
