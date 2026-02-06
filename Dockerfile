# ============================================
# WCTraining Backend - NestJS
# Multi-stage Dockerfile optimizado para producción
# ============================================

# ---- Etapa base: imagen con pnpm ----
FROM node:22-alpine AS base

# Instalar dependencias del sistema necesarias para bcrypt (compilación nativa)
RUN apk add --no-cache libc6-compat python3 make g++

# Habilitar corepack para pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ---- Etapa de dependencias ----
FROM base AS deps

# Copiar archivos de configuración de pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar TODAS las dependencias (incluidas devDependencies para build)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- Etapa de build ----
FROM base AS builder

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

# Copiar código fuente y configuraciones de build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/

# Compilar la aplicación
RUN pnpm build

# Eliminar devDependencies después del build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm prune --prod

# ---- Etapa de producción ----
FROM node:22-alpine AS production

# Metadatos de la imagen
LABEL maintainer="WCTraining Team"
LABEL description="WCTraining Backend API - NestJS"
LABEL version="0.0.1"

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3556

# Copiar artefactos de build y dependencias de producción
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./

# Cambiar a usuario no-root
USER nestjs

# Exponer el puerto de la API
EXPOSE 3556

# Health check para orquestadores (Docker Compose, Kubernetes, etc.)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3556/api || exit 1

# Comando de inicio
CMD ["node", "dist/main"]
