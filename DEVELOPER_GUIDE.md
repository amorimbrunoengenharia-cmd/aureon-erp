# 🚀 AUREON ERP - Developer Onboarding Guide

Bem-vindo ao time! Este guia vai te ajudar a configurar o ambiente de desenvolvimento em **menos de 15 minutos**.

## 📋 Pré-requisitos

- **Node.js** 18.x ou superior ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **VSCode** (recomendado) ([Download](https://code.visualstudio.com/))
- **Conta GitHub** com acesso ao repositório

## ⚡ Setup Rápido (5 minutos)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-org/aureon-erp.git
cd aureon-erp
```

### 2. Backend Setup

```bash
cd aureon-backend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env (veja seção "Configuração" abaixo)
code .env

# Rodar servidor
npm run dev
```

✅ Backend rodando em: http://localhost:5000

### 3. Frontend Setup

```bash
cd ../aureon-os

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Rodar aplicação
npm run dev
```

✅ Frontend rodando em: http://localhost:5173

## 🔧 Configuração Detalhada

### Backend (.env)

**Mínimo necessário para começar:**

```env
# Application
NODE_ENV=development
PORT=5000

# Database (SQLite - sem configuração necessária)
USE_POSTGRES=false

# JWT Secrets (ALTERE EM PRODUÇÃO!)
JWT_SECRET=dev_jwt_secret_key_min_32_chars_required
JWT_REFRESH_SECRET=dev_refresh_secret_key_min_32_chars_required

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Configurações Opcionais:**

#### Email (Gmail - Grátis)
1. Habilite 2FA: https://myaccount.google.com/security
2. Crie App Password: https://myaccount.google.com/apppasswords
3. Adicione no `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App Password de 16 dígitos
SMTP_FROM_NAME=AUREON ERP
SMTP_FROM=seu-email@gmail.com
```

#### Error Tracking (Sentry - Grátis até 5k eventos/mês)
1. Crie conta: https://sentry.io/signup/
2. Crie projeto Node.js
3. Copie DSN e adicione no `.env`:

```env
SENTRY_DSN=https://sua-chave@o123456.ingest.sentry.io/7654321
SENTRY_ENVIRONMENT=development
SENTRY_ENABLED=true
```

## 🗄️ Database

### SQLite (Desenvolvimento - Padrão)

Zero configuração! O banco é criado automaticamente em:
```
aureon-backend/database.sqlite
```

### PostgreSQL (Produção - Opcional)

Se quiser testar com PostgreSQL localmente:

```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# Criar database
createdb aureon_erp

# Configurar .env
USE_POSTGRES=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aureon_erp
DB_USER=postgres
DB_PASSWORD=sua-senha
```

## 🧪 Testes

### Backend

```bash
cd aureon-backend

# Testes unitários
npm test

# Testes com coverage
npm run test:coverage

# Testes em watch mode
npm run test:watch

# Lint
npm run lint

# Format
npm run format
```

### Frontend

```bash
cd aureon-os

# Lint
npm run lint

# Build de produção
npm run build

# Preview build
npm run preview
```

## 📚 Estrutura do Projeto

```
aureon-erp/
├── aureon-backend/          # API Node.js + Express
│   ├── config/              # Configurações (database, swagger, sentry)
│   ├── middlewares/         # Auth, tenant, error handling
│   ├── models/              # Sequelize models
│   ├── routes/              # Express routes
│   ├── services/            # Business logic
│   ├── utils/               # Helpers
│   └── server.js            # Entry point
│
├── aureon-os/               # Frontend React + Vite
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React Context (Auth, Data)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API calls
│   │   └── App.jsx          # Main App
│   └── vite.config.js
│
└── .github/
    └── workflows/           # CI/CD automático
```

## 🔑 Primeiro Login

**Usuário padrão:**
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANTE:** Altere a senha após primeiro login!

## 🐛 Troubleshooting

### Backend não inicia

```bash
# Verificar porta 5000 livre
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Mac/Linux

# Limpar node_modules
rm -rf node_modules package-lock.json
npm install
```

### Frontend não conecta

1. Verifique se backend está rodando: http://localhost:5000/health
2. Verifique CORS no backend `.env`: `CORS_ORIGIN=http://localhost:5173`
3. Limpe cache do navegador: `Ctrl+Shift+Delete`

### Erro "JWT_SECRET too short"

Certifique-se que `JWT_SECRET` e `JWT_REFRESH_SECRET` têm **mínimo 32 caracteres**.

### Email não envia

1. Verifique credenciais Gmail no `.env`
2. Certifique-se que App Password foi criado (não a senha normal)
3. Veja logs em `aureon-backend/logs/`

## 📖 Documentação API

Com o backend rodando, acesse:

- **Swagger UI**: http://localhost:5000/api-docs
- **JSON Spec**: http://localhost:5000/api-docs.json

## 🔄 Git Workflow

```bash
# Criar branch para feature
git checkout -b feature/nome-da-feature

# Fazer commits (seguir Conventional Commits)
git commit -m "feat: adicionar endpoint de relatórios"
git commit -m "fix: corrigir filtro de data"

# Push e criar Pull Request
git push origin feature/nome-da-feature
```

**Conventional Commits:**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Alteração em documentação
- `style:` Formatação, ponto e vírgula
- `refactor:` Refatoração de código
- `test:` Adicionar/corrigir testes
- `chore:` Atualização de build, dependências

## 🚀 Deploy

### Desenvolvimento → Staging

```bash
git push origin develop
# CI/CD automático roda testes e faz deploy
```

### Staging → Produção

```bash
git checkout main
git merge develop
git push origin main
# CI/CD automático faz deploy em produção
```

## 📞 Suporte

- **Slack**: #aureon-dev
- **Email**: dev@aureon.com
- **Documentação**: https://docs.aureon.com
- **Issues**: https://github.com/seu-org/aureon-erp/issues

## 🎯 Próximos Passos

1. ✅ Fazer primeiro login
2. ✅ Explorar Dashboard
3. ✅ Ler código de um endpoint simples (ex: `/api/health`)
4. ✅ Fazer primeira modificação pequena
5. ✅ Criar Pull Request

**Bem-vindo ao time! 🎉**

---

📝 **Última atualização:** ${new Date().toISOString().split('T')[0]}
