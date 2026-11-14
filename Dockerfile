# Production-style container image. Not built in the sandbox (Docker unavailable);
# see DEPLOYMENT.md before treating this as a verified deployment artifact.
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_PATH=/app/data/app.db \
    NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
    CATALOGUE_MODE=live \
    ENABLE_INTERNAL_SCHEDULER=1
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts /app/tsconfig.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts ./scripts
RUN mkdir -p data uploads backups && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npm run db:setup && npm run start -- -p 3000"]
