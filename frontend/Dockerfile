# --- build (Vite + TypeScript) ---
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . ./
RUN npm run build

# --- nginx: estáticos + proxy de /api para a API ---
FROM nginx:1.27-alpine
ENV API_UPSTREAM=nivaldo-api-qgvvjr:3000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
