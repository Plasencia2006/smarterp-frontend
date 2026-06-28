# ============================================
# ETAPA 1: BUILD
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================
# ETAPA 2: PRODUCTION (SERVE)
# ============================================
FROM node:20-alpine

WORKDIR /app

# Instalar serve globalmente
RUN npm install -g serve

# Copiar build desde la etapa anterior
COPY --from=build /app/dist ./dist

# Exponer puerto (Railway asigna $PORT)
EXPOSE 3000

# Iniciar serve en el puerto que Railway asigne
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]