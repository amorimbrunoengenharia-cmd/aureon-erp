# ⚙️ Variáveis de Ambiente para Deploy - Render.com

## Copie e Cole no Render

```env
NODE_ENV=production
PORT=10000

# Database - SQLite (mais simples, sem necessidade de PostgreSQL)
DB_TYPE=sqlite
USE_POSTGRES=false

# JWT Secrets (GERE SEUS PRÓPRIOS - use 32+ caracteres)
JWT_SECRET=aureon_jwt_prod_2025_change_this_to_something_secure_min_32
JWT_REFRESH_SECRET=aureon_refresh_prod_2025_different_secret_min_32_chars

# Session Secret (GERE SEU PRÓPRIO - 32+ caracteres)
SESSION_SECRET=aureon_session_secret_2025_change_this_secure_32_chars

# Marketplace Encryption (GERE SEU PRÓPRIO - 32+ caracteres hex)
MARKETPLACE_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef

# CORS - URL do seu frontend
CORS_ORIGIN=https://aureon-erp.vercel.app
FRONTEND_URL=https://aureon-erp.vercel.app

# Desabilitar features opcionais
SENTRY_ENABLED=false
ENABLE_EMAIL_NOTIFICATIONS=false

# Logs
LOG_LEVEL=info
```

## 🔑 Como Gerar Secrets Seguros

Você pode usar estes comandos no PowerShell ou gerar online:

```powershell
# Gerar secret aleatório (32 caracteres)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Ou use: https://www.random.org/strings/?num=3&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new

## ⚠️ Importante

- Cada SECRET deve ser DIFERENTE
- Mínimo 32 caracteres
- Nunca compartilhe esses valores
- Não commite no Git

## 📝 Checklist

- [ ] Copiei todas as variáveis acima
- [ ] Colei no Render em Environment Variables
- [ ] Alterei os secrets para valores únicos
- [ ] Salvei e fiz deploy
