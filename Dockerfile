# ── Build stage ──
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci && cd server && npm ci

COPY . .
# 1. Build client (dist/public) + server (dist/index.cjs)
RUN npm run build
# 2. Build federation (overwrites dist/public)
RUN npm run build:federation
# 3. Move federation output to its own directory
RUN mv dist/public dist/federation
# 4. Rebuild client to dist/public
RUN npx vite build
# 5. Ensure migrations directory exists (may be empty initially)
RUN mkdir -p migrations

# ── Production stage ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/dist ./dist
# Include Drizzle migration files and config for K8s init container migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/migrations ./migrations

EXPOSE 5000
CMD ["node", "dist/index.cjs"]
