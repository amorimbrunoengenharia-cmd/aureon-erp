# 🚀 Deploy Completo - Frontend + Backend no Vercel (GRÁTIS)

## ✅ Solução Escolhida: Vercel

O **Vercel** é gratuito e hospeda TUDO:
- ✅ Frontend (React)
- ✅ Backend (Node.js API)
- ✅ Tudo no mesmo lugar
- ✅ Deploy automático do GitHub
- ✅ HTTPS gratuito
- ✅ Domínio .vercel.app incluído

---

## 🔧 Como Colocar Online (5 minutos)

### Passo 1: Criar Conta no Vercel

1. Acesse: https://vercel.com/signup
2. Clique em **"Continue with GitHub"**
3. Autorize o Vercel a acessar seus repositórios

### Passo 2: Importar Projeto

1. No dashboard do Vercel, clique em **"Add New..."**
2. Selecione **"Project"**
3. Procure e selecione: **aureon-erp**
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `aureon-os`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Passo 3: Configurar Variáveis de Ambiente

Em **Environment Variables**, adicione:

```
NODE_ENV=production
VITE_API_URL=/api
DATABASE_URL=sua_database_url_aqui
JWT_SECRET=seu_jwt_secret_aqui
JWT_REFRESH_SECRET=seu_jwt_refresh_secret_aqui
```

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. ✅ Site online!

---

## 🌐 Seu Site Ficará em:

```
https://aureon-erp.vercel.app
```

Ou domínio customizado (ex: aureon-erp.com) - configurável no painel do Vercel

---

## 🔄 Deploy Automático

Depois do primeiro deploy:
- Todo push para GitHub = deploy automático
- Não precisa fazer nada manualmente
- Preview de PRs automático

---

## 📦 Arquivos Configurados

- ✅ `vercel.json` - Configuração do Vercel (frontend + backend)
- ✅ `aureon-os/package.json` - Script `vercel-build` adicionado
- ✅ Rotas configuradas:
  - `/api/*` → Backend (Node.js)
  - `/health` → Backend (health check)
  - `/*` → Frontend (React)

---

## 🎯 Alternativa: Continuar com GitHub Pages + Render

Se preferir a solução anterior (GitHub Pages para frontend):

### Frontend: GitHub Pages (já configurado)
1. Acesse: https://github.com/amorimbrunoengenharia-cmd/aureon-erp/settings/pages
2. Source: **GitHub Actions**
3. Seu site: https://amorimbrunoengenharia-cmd.github.io/aureon-erp/

### Backend: Render.com (grátis)
1. Acesse: https://render.com/
2. "New" → "Web Service"
3. Conecte ao GitHub: aureon-erp
4. Configure:
   - **Root Directory:** `aureon-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Deploy!

---

## 📊 Comparação de Opções

| Opção | Frontend | Backend | Complexidade | Custo |
|-------|----------|---------|--------------|-------|
| **Vercel** | ✅ Sim | ✅ Sim | ⭐ Fácil | 🆓 Grátis |
| GitHub Pages + Render | ✅ Sim | ✅ Sim | ⭐⭐ Médio | 🆓 Grátis |
| GitHub Pages only | ✅ Sim | ❌ Não | ⭐ Fácil | 🆓 Grátis |

---

## 🎯 Recomendação: **Use Vercel** (Tudo em Um)

**Por quê?**
- ✅ 1 único deploy (não precisa de 2 serviços)
- ✅ Mesma URL para frontend e backend
- ✅ Sem problema de CORS
- ✅ Deploy automático
- ✅ Muito mais simples

---

## 🚀 Links Rápidos

- **Criar conta Vercel:** https://vercel.com/signup
- **Dashboard:** https://vercel.com/dashboard
- **Documentação:** https://vercel.com/docs

---

## 🔐 Database (Opcional)

Se precisar de PostgreSQL gratuito:

**Opção 1: Neon (Recomendado)**
- https://neon.tech
- PostgreSQL gratuito
- Fácil de conectar

**Opção 2: Supabase**
- https://supabase.com
- PostgreSQL + Backend as a Service
- Grátis até 500MB

**Opção 3: Vercel Postgres**
- Integrado no Vercel
- https://vercel.com/docs/storage/vercel-postgres

---

## ✅ Checklist Completo

### Vercel (Recomendado)
- [ ] Criar conta no Vercel
- [ ] Conectar com GitHub
- [ ] Importar projeto aureon-erp
- [ ] Configurar variáveis de ambiente
- [ ] Deploy
- [ ] Testar site online

### Alternativa (GitHub + Render)
- [ ] GitHub Pages habilitado
- [ ] Workflow executado
- [ ] Conta no Render.com
- [ ] Backend deployado no Render
- [ ] URL da API atualizada no frontend
- [ ] Testar integração

---

**Última atualização:** 29 de Dezembro de 2025  
**Status:** Pronto para deploy no Vercel (mais simples e tudo em um lugar)
