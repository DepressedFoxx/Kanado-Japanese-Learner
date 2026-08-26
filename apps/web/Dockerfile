# Web Next.js — build từ thư mục gốc của monorepo:
#   docker build -f apps/web/Dockerfile -t kanado-web .
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/content/package.json packages/content/
COPY apps/web/package.json apps/web/
RUN npm install --workspaces --include-workspace-root

COPY packages/content packages/content
RUN npm run build -w @kanado/content

COPY apps/web apps/web
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build -w @kanado/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
