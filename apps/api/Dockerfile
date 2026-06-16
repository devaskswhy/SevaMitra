# ── Stage 1: Builder ──────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules (OpenSSL for Prisma)
RUN apk add --no-cache openssl

# Copy root-level Prisma schema first (for prisma generate)
COPY prisma ./prisma

# Copy API package files and install dependencies
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy API source and compile TypeScript
COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
RUN npx tsc

# ── Stage 2: Runner ──────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sevamitra
USER sevamitra

# Copy compiled output and production dependencies from builder
COPY --from=builder --chown=sevamitra:nodejs /app/dist ./dist
COPY --from=builder --chown=sevamitra:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sevamitra:nodejs /app/prisma ./prisma
COPY --from=builder --chown=sevamitra:nodejs /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]