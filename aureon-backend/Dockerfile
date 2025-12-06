# ================================
# AUREON ERP Backend - Dockerfile
# ================================
# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Build
FROM node:20-alpine AS builder

# Metadados
LABEL maintainer="AUREON Team"
LABEL description="AUREON ERP Backend API"

# Definir diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Stage 2: Production
FROM node:20-alpine

# Instalar dumb-init para gerenciamento de sinais
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código da aplicação do stage builder
COPY --from=builder --chown=nodejs:nodejs /app .

# Criar diretórios necessários
RUN mkdir -p logs backups uploads && \
    chown -R nodejs:nodejs /app

# Trocar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
