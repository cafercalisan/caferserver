FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Copy external packages needed at runtime into a clean folder
RUN mkdir -p /externals && \
    for pkg in bcryptjs ssh2 pg pg-pool pg-types pg-protocol pg-int8 pg-numeric \
      postgres-array postgres-bytea postgres-date postgres-interval postgres-range \
      pgpass buffer-writer packet-reader pg-cloudflare pg-connection-string split2 \
      cpu-features nan asn1 bcrypt-pbkdf buildcheck tweetnacl; do \
      [ -d "node_modules/$pkg" ] && cp -r "node_modules/$pkg" "/externals/$pkg" || true; \
    done

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /externals/ ./node_modules/

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
