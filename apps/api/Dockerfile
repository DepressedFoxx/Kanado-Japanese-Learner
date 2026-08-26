# API NestJS — build từ thư mục gốc của monorepo:
#   docker build -f apps/api/Dockerfile -t kanado-api .
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/content/package.json packages/content/
COPY apps/api/package.json apps/api/
RUN npm install --workspaces --include-workspace-root

COPY packages/content packages/content
RUN npm run build -w @kanado/content

COPY apps/api apps/api
RUN npm run prisma:generate -w @kanado/api && npm run build -w @kanado/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/content ./packages/content
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY package.json ./package.json

WORKDIR /app/apps/api
EXPOSE 4000
# Chạy migration rồi mới khởi động, để deploy không cần thao tác tay
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
