#!/bin/bash

# ================================
# AUREON ERP - Rollback Script
# ================================
# Script para fazer rollback de deploy

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar argumentos
if [ $# -eq 0 ]; then
    log_error "Uso: $0 [staging|production] [backup_timestamp]"
    exit 1
fi

ENVIRONMENT=$1
BACKUP_TIMESTAMP=$2

log_info "🔄 Iniciando rollback para $ENVIRONMENT..."

# Parar containers atuais
log_info "🛑 Parando containers atuais..."
docker-compose down

# Restaurar backup do banco de dados
if [ ! -z "$BACKUP_TIMESTAMP" ]; then
    BACKUP_FILE="backups/$BACKUP_TIMESTAMP/database.sql"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup não encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    log_info "💾 Restaurando backup do banco de dados..."
    
    # Carregar variáveis de ambiente
    if [ "$ENVIRONMENT" == "staging" ]; then
        ENV_FILE=".env.staging"
    else
        ENV_FILE=".env.production"
    fi
    
    export $(cat $ENV_FILE | grep -v '^#' | xargs)
    
    # Iniciar apenas postgres
    docker-compose up -d postgres
    sleep 5
    
    # Restaurar banco
    docker-compose exec -T postgres psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    docker-compose exec -T postgres psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
    cat $BACKUP_FILE | docker-compose exec -T postgres psql -U $DB_USER -d $DB_NAME
    
    log_info "✅ Banco de dados restaurado"
fi

# Fazer checkout da versão anterior (se usando Git)
if [ -d ".git" ]; then
    log_info "📥 Fazendo checkout da versão anterior..."
    git checkout HEAD~1
fi

# Rebuild e restart
log_info "🔨 Rebuilding aplicação..."
docker-compose build

log_info "🚀 Reiniciando containers..."
docker-compose up -d

log_info "✅ Rollback concluído!"
docker-compose ps
