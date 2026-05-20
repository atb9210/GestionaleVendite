FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npx prisma generate

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
