FROM node:22.14-slim

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@11.9.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/ingestion/package.json packages/ingestion/package.json
COPY packages/logger/package.json packages/logger/package.json
COPY packages/validation/package.json packages/validation/package.json

RUN pnpm install --frozen-lockfile --prod=false --filter . --filter @ai-job-platform/api...

COPY . .

RUN pnpm db:generate

ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS=--max-old-space-size=256

EXPOSE 3000

CMD ["pnpm", "api:start"]
