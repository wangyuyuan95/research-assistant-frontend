# Multi-stage build for optimized production image
FROM docker.m.daocloud.io/library/node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Modern Node.js Alpine images already include necessary libraries
# Skip potentially problematic package installations

WORKDIR /app

# 使用多个国内镜像源的重试机制
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    # 尝试华为源
    (npm config set registry https://repo.huaweicloud.com/repository/npm/ && npm install -g pnpm@latest) || \
    # 尝试阿里源
    (npm config set registry https://registry.npmmirror.com/ && npm install -g pnpm@latest) || \
    # 尝试腾讯源
    (npm config set registry https://mirrors.cloud.tencent.com/npm/ && npm install -g pnpm@latest) || \
    # 最后尝试官方源
    (npm config set registry https://registry.npmjs.org/ && npm install -g pnpm@latest) && \
    # 配置pnpm镜像源
    (pnpm config set registry https://repo.huaweicloud.com/repository/npm/ || \
     pnpm config set registry https://registry.npmmirror.com/ || \
     pnpm config set registry https://mirrors.cloud.tencent.com/npm/ || \
     pnpm config set registry https://registry.npmjs.org/) && \
    pnpm config set network-timeout 300000

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with multiple registry fallback
RUN pnpm install --frozen-lockfile || \
    (pnpm config set registry https://registry.npmmirror.com/ && sleep 10 && pnpm install --frozen-lockfile) || \
    (pnpm config set registry https://mirrors.cloud.tencent.com/npm/ && sleep 10 && pnpm install --frozen-lockfile) || \
    (pnpm config set registry https://registry.npmjs.org/ && sleep 20 && pnpm install --frozen-lockfile)

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 使用多个国内镜像源的重试机制
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    # 尝试华为源
    (npm config set registry https://repo.huaweicloud.com/repository/npm/ && npm install -g pnpm@latest) || \
    # 尝试阿里源
    (npm config set registry https://registry.npmmirror.com/ && npm install -g pnpm@latest) || \
    # 尝试腾讯源
    (npm config set registry https://mirrors.cloud.tencent.com/npm/ && npm install -g pnpm@latest) || \
    # 最后尝试官方源
    (npm config set registry https://registry.npmjs.org/ && npm install -g pnpm@latest) && \
    # 配置pnpm镜像源
    (pnpm config set registry https://repo.huaweicloud.com/repository/npm/ || \
     pnpm config set registry https://registry.npmmirror.com/ || \
     pnpm config set registry https://mirrors.cloud.tencent.com/npm/ || \
     pnpm config set registry https://registry.npmjs.org/) && \
    pnpm config set network-timeout 300000

# Set build environment
ARG NEXT_PUBLIC_ENV_MODE
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_KB_URL
ARG NEXT_PUBLIC_KB_ACCOUNT_PREFIX
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG OPENAI_API_KEY
ARG NEXT_PUBLIC_VERCEL_ENV=production

ENV NEXT_PUBLIC_ENV_MODE=$NEXT_PUBLIC_ENV_MODE
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_KB_URL=$NEXT_PUBLIC_KB_URL
ENV NEXT_PUBLIC_KB_ACCOUNT_PREFIX=$NEXT_PUBLIC_KB_ACCOUNT_PREFIX
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV NEXT_PUBLIC_VERCEL_ENV=$NEXT_PUBLIC_VERCEL_ENV

# Build the application
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
