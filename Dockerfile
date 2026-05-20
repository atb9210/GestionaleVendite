# ── Stage 1: Build frontend ──────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# ── Stage 2: Build backend ───────────────────────────────────────
FROM node:22-alpine AS backend
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx prisma generate && npm run build

# ── Stage 3: Runtime ─────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=backend /app/dist ./dist
COPY --from=backend /app/prisma ./prisma
COPY --from=backend /app/node_modules ./node_modules
COPY --from=frontend /app/dist ./public
COPY server/package*.json ./
CMD ["node", "dist/src/index.js"]
