# 🚀 Deploy Completo - Frontend + Backend Online

## ⚡ Solução Mais Simples: Render.com (Tudo Grátis)

O **Render** hospeda frontend e backend separadamente, mas é o mais fácil e confiável:
- ✅ Frontend (Static Site)
- ✅ Backend (Web Service)
- ✅ PostgreSQL incluído (grátis)
- ✅ Deploy automático do GitHub
- ✅ HTTPS gratuito
- ✅ Mais confiável que Vercel para Node.js

---

## 🚀 Como Colocar Online (10 minutos)

### PARTE 1: Backend no Render

1. **Criar conta:**
   - Acesse: https://render.com/
   - Clique em **"Get Started"**
   - Continue com GitHub

2. **Criar Web Service (Backend):**
   - No dashboard, clique em **"New +"** → **"Web Service"**
   - Conecte ao repositório: **aureon-erp**
   - Configure:
     - **Name:** aureon-backend
     - **Region:** Oregon (US West)
     - **Branch:** feat/prescriptions-sim-ai-20251209
     - **Root Directory:** aureon-backend
     - **Runtime:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Instance Type:** Free

3. **Adicionar variáveis de ambiente:**
   Clique em **"Environment"** e adicione:
   ```
   NODE_ENV=production
   PORT=10000
   
   # JWT
   JWT_SECRET=seu_secret_super_seguro_minimo_32_caracteres
   JWT_REFRESH_SECRET=outro_secret_diferente_tambem_32_chars
   
   # Database SQLite (mais simples)
   DB_TYPE=sqlite
   
   # Session
   SESSION_SECRET=session_secret_super_seguro_aqui_32_chars
   
   # Marketplace (opcional)
   MARKETPLACE_ENCRYPTION_KEY=encryption_key_32_caracteres_minimo
   
   # CORS
   FRONTEND_URL=https://aureon-erp.vercel.app
   ```

4. **Criar Database PostgreSQL (Opcional):**
   - "New +" → "PostgreSQL"
   - Name: aureon-db
   - Region: Same as backend
   - Instance: Free
   - Copie a DATABASE_URL e adicione no backend

5. **Deploy:**
   - Clique em **"Create Web Service"**
   - Aguarde 3-5 minutos
   - Anote a URL: `https://aureon-backend.onrender.com`

### PARTE 2: Frontend no Vercel

1. **Atualizar variáveis de ambiente:**
   - No Vercel, vá em Settings → Environment Variables
   - **IMPORTANTE:** Adicione em **Production**, **Preview** e **Development**
   - Adicione estas variáveis:
     ```
     VITE_API_BASE_URL=https://aureon-backend.onrender.com/api
     VITE_BACKEND_URL=https://aureon-backend.onrender.com
     NODE_ENV=production
     ```

2. **Redeploy:**
   - Vá em Deployments
   - Clique nos 3 pontos do último deploy → **Redeploy**
   - ✅ Marque "Use existing Build Cache"
   - Aguarde 1-2 minutos

---

## 🌐 Seus Sites Ficarão em:

**Frontend:** https://aureon-erp.vercel.app  
**Backend:** https://aureon-backend.onrender.com  
**API:** https://aureon-backend.onrender.com/api

---

## 🎯 Alternativa: Tudo no Render (Mais Simples)

Se preferir tudo no Render:

### Frontend no Render (Static Site)

1. **New +** → **Static Site**
2. Configure:
   - **Name:** aureon-frontend
   - **Branch:** feat/prescriptions-sim-ai-20251209
   - **Root Directory:** aureon-os
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** dist
3. **Environment Variables:**
   ```
   NODE_ENV=production
   VITE_API_BASE_URL=/api
   ```
4. **Redirect Rules** (para SPA routing):
   ```
   /*  /index.html  200
   ```

### Configurar Proxy

No `render.yaml` (já está criado):
```yaml
services:
  - type: web
    name: aureon-backend
    # ... configuração do backend
    
  - type: web
    name: aureon-frontend
    # ... configuração do frontend
    routes:
      - type: rewrite
        source: /api/*
        destination: https://aureon-backend.onrender.com/api/:splat
```

---

## 📊 Resumo das Opções

| Opção | Complexidade | Confiabilidade | Custo |
|-------|-------------|----------------|-------|
| **Render (Backend) + Vercel (Frontend)** | ⭐⭐ Médio | ⭐⭐⭐ Alta | 🆓 Grátis |
| **Render (Tudo)** | ⭐ Fácil | ⭐⭐⭐ Alta | 🆓 Grátis |
| **Vercel (Tudo)** | ⭐⭐⭐ Difícil | ⭐⭐ Média | 🆓 Grátis |

---

## ⚠️ Problema Atual

O erro que você está vendo é porque:
- Frontend está no Vercel ✅
- Backend **NÃO** está rodando ❌
- Frontend tentando conectar em `localhost:5000` (errado)

**Solução:** Deploy do backend no Render conforme instruções acima.

---

## 🔧 Arquivos Atualizados

- ✅ `.env.production` - Variáveis para produção
- ✅ `vercel.json` - Configurado para proxy
- ✅ `render.yaml` - Backend + Frontend no Render

---

## 🚀 Links Rápidos

**Backend (Render):**
- https://render.com/
- https://dashboard.render.com/

**Frontend (Vercel - já está):**
- https://vercel.com/dashboard
- Seu projeto: https://aureon-erp.vercel.app

---

## ✅ Checklist Completo

### Backend no Render
- [ ] Conta criada no Render
- [ ] Web Service criado (aureon-backend)
- [ ] Variáveis de ambiente configuradas
- [ ] PostgreSQL criado (opcional)
- [ ] Backend deployado
- [ ] URL anotada: https://aureon-backend.onrender.com

### Frontend no Vercel
- [x] Já está online
- [ ] VITE_API_BASE_URL atualizado com URL do backend
- [ ] Redeploy feito
- [ ] Testado e funcionando

---

**Última atualização:** 29 de Dezembro de 2025  
**Próximo passo:** Deploy do backend no Render (siga PARTE 1 acima)
