FROM node:25-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:25-alpine AS runner
WORKDIR /app
ENV TZ=Europe/Berlin
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache curl
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Some data files used at runtime are not included in standalone
COPY --from=builder /app/node_modules/.pnpm/db-hafas-stations@2.0.0 ./node_modules/.pnpm/db-hafas-stations@2.0.0

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=5 \
    CMD IP=$(hostname -i | awk '{print $1}'); curl -fsS -4 "http://$IP:${PORT:-3000}" || exit 1

CMD ["node", "server.js"]
