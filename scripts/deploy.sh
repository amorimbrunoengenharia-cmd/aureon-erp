#!/bin/bash

# ================================
# AUREON ERP - Deploy Script
# ================================
# Script para deploy em staging/production

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar argumentos
if [ $# -eq 0 ]; then
    log_error "Uso: $0 [staging|production]"
    exit 1
fi

ENVIRONMENT=$1

# Validar ambiente
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    log_error "Ambiente inválido. Use 'staging' ou 'production'"
    exit 1
fi

log_info "🚀 Iniciando deploy para $ENVIRONMENT..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado. Instale antes de continuar."
    exit 1
fi

# Verificar se docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose não está instalado. Instale antes de continuar."
    exit 1
fi

# Carregar variáveis de ambiente corretas
if [ "$ENVIRONMENT" == "staging" ]; then
    ENV_FILE=".env.staging"
else
    ENV_FILE=".env.production"
fi

if [ ! -f "$ENV_FILE" ]; then
    log_error "Arquivo $ENV_FILE não encontrado!"
    exit 1
fi

log_info "📋 Carregando variáveis de $ENV_FILE"
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Fazer backup do banco de dados
log_info "💾 Criando backup do banco de dados..."
if [ "$ENVIRONMENT" == "production" ]; then
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/database.sql"
    log_info "✅ Backup salvo em $BACKUP_DIR"
fi

# Pull das imagens mais recentes (se usando registry)
if [ ! -z "$DOCKER_REGISTRY" ]; then
    log_info "📥 Pulling imagens do registry..."
    docker-compose pull
fi

# Build das imagens
log_info "🔨 Building imagens Docker..."
docker-compose build --no-cache

# Parar containers antigos
log_info "🛑 Parando containers antigos..."
docker-compose down

# Executar migrations
log_info "🗄️  Executando migrations..."
docker-compose run --rm backend node scripts/migrate.js

# Iniciar novos containers
log_info "🚀 Iniciando novos containers..."
docker-compose up -d

# Aguardar containers ficarem healthy
log_info "⏳ Aguardando containers ficarem healthy..."
sleep 10

# Verificar health dos containers
log_info "🏥 Verificando health dos containers..."
BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' aureon-backend 2>/dev/null || echo "not-found")
POSTGRES_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' aureon-postgres 2>/dev/null || echo "not-found")

if [ "$BACKEND_HEALTH" != "healthy" ]; then
    log_warn "Backend não está healthy ainda. Status: $BACKEND_HEALTH"
fi

if [ "$POSTGRES_HEALTH" != "healthy" ]; then
    log_warn "PostgreSQL não está healthy ainda. Status: $POSTGRES_HEALTH"
fi

# Limpar imagens antigas
log_info "🧹 Limpando imagens antigas..."
docker image prune -f

# Mostrar status dos containers
log_info "📊 Status dos containers:"
docker-compose ps

# Verificar logs
log_info "📝 Últimas linhas dos logs:"
docker-compose logs --tail=20

# Deploy finalizado
log_info "✅ Deploy finalizado com sucesso!"
log_info ""
log_info "Para verificar logs em tempo real:"
log_info "  docker-compose logs -f"
log_info ""
log_info "Para verificar status:"
log_info "  docker-compose ps"
log_info ""
log_info "Para fazer rollback:"
log_info "  ./scripts/rollback.sh $ENVIRONMENT"
