#!/usr/bin/env pwsh
# AUREON ERP - Setup Script (PowerShell)
# Automated setup for Windows/Linux/macOS

Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🏢 AUREON ERP - Automated Setup Script          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to check command existence
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Function to display step
function Write-Step {
    param($Message)
    Write-Host "► $Message" -ForegroundColor Yellow
}

# Function to display success
function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

# Function to display error
function Write-Fail {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Step 1: Check Node.js
Write-Step "Verificando Node.js..."
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Success "Node.js instalado: $nodeVersion"
    
    # Check version
    $requiredVersion = "18.0.0"
    $currentVersion = $nodeVersion -replace 'v', ''
    
    if ([version]$currentVersion -lt [version]$requiredVersion) {
        Write-Fail "Node.js $nodeVersion é muito antigo. Versão mínima: v18.0.0"
        Write-Host "Por favor, atualize em: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Fail "Node.js não encontrado!"
    Write-Host "Por favor, instale em: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check npm
Write-Step "Verificando npm..."
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Success "npm instalado: v$npmVersion"
} else {
    Write-Fail "npm não encontrado!"
    exit 1
}

# Step 3: Check Git
Write-Step "Verificando Git..."
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Success "$gitVersion"
} else {
    Write-Fail "Git não encontrado!"
    Write-Host "Por favor, instale em: https://git-scm.com/" -ForegroundColor Yellow
    exit 1
}

# Step 4: Install dependencies
Write-Step "Instalando dependências..."
try {
    npm install
    Write-Success "Dependências instaladas com sucesso!"
} catch {
    Write-Fail "Erro ao instalar dependências!"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 5: Setup environment
Write-Step "Configurando variáveis de ambiente..."
if (Test-Path ".env") {
    Write-Host "  ⚠ Arquivo .env já existe. Pulando..." -ForegroundColor Yellow
} else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success "Arquivo .env criado a partir de .env.example"
        Write-Host ""
        Write-Host "  📝 IMPORTANTE: Edite o arquivo .env e configure:" -ForegroundColor Cyan
        Write-Host "     - VITE_OPENAI_API_KEY (opcional)" -ForegroundColor Gray
        Write-Host "     - VITE_ML_CLIENT_ID (Mercado Livre)" -ForegroundColor Gray
        Write-Host "     - VITE_RAPIDAPI_KEY (Alibaba)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Fail "Arquivo .env.example não encontrado!"
    }
}

# Step 6: Check if nvm is available
Write-Step "Verificando Node Version Manager..."
if (Test-Command "nvm") {
    Write-Success "nvm encontrado"
    Write-Host "  💡 Você pode usar 'nvm use' para usar a versão correta do Node.js" -ForegroundColor Cyan
} elseif (Test-Path "$env:NVM_HOME\nvm.exe") {
    Write-Success "nvm encontrado (Windows)"
    Write-Host "  💡 Você pode usar 'nvm use' para usar a versão correta do Node.js" -ForegroundColor Cyan
} else {
    Write-Host "  ℹ nvm não encontrado (opcional)" -ForegroundColor Gray
}

# Step 7: Display next steps
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ✅ Setup Concluído com Sucesso!            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos Passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Configure as variáveis de ambiente:" -ForegroundColor White
Write-Host "     code .env" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Inicie o servidor de desenvolvimento:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Abra no navegador:" -ForegroundColor White
Write-Host "     http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Faça login com:" -ForegroundColor White
Write-Host "     Usuário: admin" -ForegroundColor Gray
Write-Host "     Senha: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentação:" -ForegroundColor Cyan
Write-Host "  - README.md - Documentação completa" -ForegroundColor Gray
Write-Host "  - QUICKSTART.md - Guia rápido (5 min)" -ForegroundColor Gray
Write-Host "  - ARCHITECTURE.md - Arquitetura do sistema" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 Comandos Úteis:" -ForegroundColor Cyan
Write-Host "  npm run dev          - Servidor de desenvolvimento" -ForegroundColor Gray
Write-Host "  npm run build        - Build para produção" -ForegroundColor Gray
Write-Host "  npm test             - Executar testes" -ForegroundColor Gray
Write-Host "  npm run simulate     - Executar simulação (46 cenários)" -ForegroundColor Gray
Write-Host ""
Write-Host "🤝 Contribuindo:" -ForegroundColor Cyan
Write-Host "  - CONTRIBUTING.md - Guia de contribuição" -ForegroundColor Gray
Write-Host "  - CODE_OF_CONDUCT.md - Código de conduta" -ForegroundColor Gray
Write-Host ""
Write-Host "Bom desenvolvimento! 🚀" -ForegroundColor Green
