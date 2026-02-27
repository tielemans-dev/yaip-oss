FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runtime
WORKDIR /app

# Copy build output
COPY --from=build /app/.output ./.output

# Copy Prisma schema, migrations, and config for runtime migration
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./

# Install only production deps + prisma CLI for migrations
COPY --from=build /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod && \
    pnpm add -D prisma dotenv

# Entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
