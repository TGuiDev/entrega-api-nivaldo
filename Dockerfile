# --- build do front-end (Vite + TypeScript) ---
FROM node:22-slim AS front
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --include=dev
COPY frontend/ ./
RUN npm run build

# --- API (Express) servindo o front compilado ---
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY --from=front /app/frontend/dist ./frontend/dist
EXPOSE 3000
USER node
CMD ["node", "src/server.js"]
