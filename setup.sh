#!/bin/bash
# AUREON ERP - Setup Script (Bash)
# Automated setup for Linux/macOS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     🏢 AUREON ERP - Automated Setup Script          ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}► $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_fail() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${GRAY}  ℹ $1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

version_gt() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# Start
print_header

# Step 1: Check Node.js
print_step "Verificando Node.js..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js instalado: $NODE_VERSION"
    
    # Check version
    REQUIRED_VERSION="18.0.0"
    CURRENT_VERSION="${NODE_VERSION#v}"
    
    if version_gt $REQUIRED_VERSION $CURRENT_VERSION; then
        print_fail "Node.js $NODE_VERSION é muito antigo. Versão mínima: v18.0.0"
        echo -e "${YELLOW}Por favor, atualize em: https://nodejs.org/${NC}"
        exit 1
    fi
else
    print_fail "Node.js não encontrado!"
    echo -e "${YELLOW}Por favor, instale em: https://nodejs.org/${NC}"
    exit 1
fi

# Step 2: Check npm
print_step "Verificando npm..."
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm instalado: v$NPM_VERSION"
else
    print_fail "npm não encontrado!"
    exit 1
fi

# Step 3: Check Git
print_step "Verificando Git..."
if command_exists git; then
    GIT_VERSION=$(git --version)
    print_success "$GIT_VERSION"
else
    print_fail "Git não encontrado!"
    echo -e "${YELLOW}Por favor, instale em: https://git-scm.com/${NC}"
    exit 1
fi

# Step 4: Install dependencies
print_step "Instalando dependências..."
if npm install; then
    print_success "Dependências instaladas com sucesso!"
else
    print_fail "Erro ao instalar dependências!"
    exit 1
fi

# Step 5: Setup environment
print_step "Configurando variáveis de ambiente..."
if [ -f ".env" ]; then
    echo -e "${YELLOW}  ⚠ Arquivo .env já existe. Pulando...${NC}"
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Arquivo .env criado a partir de .env.example"
        echo ""
        echo -e "${CYAN}  📝 IMPORTANTE: Edite o arquivo .env e configure:${NC}"
        echo -e "${GRAY}     - VITE_OPENAI_API_KEY (opcional)${NC}"
        echo -e "${GRAY}     - VITE_ML_CLIENT_ID (Mercado Livre)${NC}"
        echo -e "${GRAY}     - VITE_RAPIDAPI_KEY (Alibaba)${NC}"
        echo ""
    else
        print_fail "Arquivo .env.example não encontrado!"
    fi
fi

# Step 6: Check if nvm is available
print_step "Verificando Node Version Manager..."
if command_exists nvm; then
    print_success "nvm encontrado"
    echo -e "${CYAN}  💡 Você pode usar 'nvm use' para usar a versão correta do Node.js${NC}"
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
    print_success "nvm encontrado"
    echo -e "${CYAN}  💡 Execute: source ~/.nvm/nvm.sh && nvm use${NC}"
else
    print_info "nvm não encontrado (opcional)"
fi

# Step 7: Make scripts executable
if [ -f "setup.sh" ]; then
    chmod +x setup.sh
fi

# Step 8: Display next steps
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ Setup Concluído com Sucesso!            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📋 Próximos Passos:${NC}"
echo ""
echo -e "  ${NC}1. Configure as variáveis de ambiente:${NC}"
echo -e "${GRAY}     nano .env${NC}"
echo ""
echo -e "  ${NC}2. Inicie o servidor de desenvolvimento:${NC}"
echo -e "${GRAY}     npm run dev${NC}"
echo ""
echo -e "  ${NC}3. Abra no navegador:${NC}"
echo -e "${GRAY}     http://localhost:5173${NC}"
echo ""
echo -e "  ${NC}4. Faça login com:${NC}"
echo -e "${GRAY}     Usuário: admin${NC}"
echo -e "${GRAY}     Senha: admin123${NC}"
echo ""
echo -e "${CYAN}📚 Documentação:${NC}"
echo -e "${GRAY}  - README.md - Documentação completa${NC}"
echo -e "${GRAY}  - QUICKSTART.md - Guia rápido (5 min)${NC}"
echo -e "${GRAY}  - ARCHITECTURE.md - Arquitetura do sistema${NC}"
echo ""
echo -e "${CYAN}🎯 Comandos Úteis:${NC}"
echo -e "${GRAY}  npm run dev          - Servidor de desenvolvimento${NC}"
echo -e "${GRAY}  npm run build        - Build para produção${NC}"
echo -e "${GRAY}  npm test             - Executar testes${NC}"
echo -e "${GRAY}  npm run simulate     - Executar simulação (46 cenários)${NC}"
echo ""
echo -e "${CYAN}🤝 Contribuindo:${NC}"
echo -e "${GRAY}  - CONTRIBUTING.md - Guia de contribuição${NC}"
echo -e "${GRAY}  - CODE_OF_CONDUCT.md - Código de conduta${NC}"
echo ""
echo -e "${GREEN}Bom desenvolvimento! 🚀${NC}"
