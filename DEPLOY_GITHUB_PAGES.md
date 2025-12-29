# 🚀 Guia de Deploy - GitHub Pages

## 📋 Status do Deploy

✅ **Código enviado para GitHub**  
✅ **Workflow de deploy configurado**  
⏳ **Aguardando configuração no GitHub**

---

## 🔧 Configuração no GitHub (Faça Manualmente)

### Passo 1: Habilitar GitHub Pages

1. Acesse seu repositório no GitHub: https://github.com/amorimbrunoengenharia-cmd/aureon-erp
2. Vá em **Settings** (Configurações)
3. No menu lateral, clique em **Pages**
4. Em **Source**, selecione:
   - Source: **GitHub Actions**
5. Clique em **Save**

### Passo 2: Executar o Workflow

1. Vá na aba **Actions** do repositório
2. Selecione o workflow **"Deploy to GitHub Pages"**
3. Clique em **Run workflow**
4. Selecione a branch: **feat/prescriptions-sim-ai-20251209**
5. Clique em **Run workflow**

### Passo 3: Aguardar Deploy

- O workflow levará cerca de 2-5 minutos
- Você pode acompanhar o progresso na aba Actions
- Quando finalizar, o site estará disponível

---

## 🌐 URLs do Site

Após o deploy, seu site estará disponível em:

**URL Principal:**
```
https://amorimbrunoengenharia-cmd.github.io/aureon-erp/
```

**Ou com domínio customizado (se configurado):**
```
https://aureon-erp.com
```

---

## 🔄 Deploys Automáticos

O site será atualizado automaticamente sempre que você fizer push para:
- Branch `main`
- Branch `feat/prescriptions-sim-ai-20251209`

Para fazer deploy manual:
```bash
# 1. Faça suas alterações
git add .
git commit -m "Suas mudanças"
git push origin feat/prescriptions-sim-ai-20251209

# 2. O deploy acontece automaticamente via GitHub Actions
```

---

## 📦 Arquivos de Deploy

### Workflow GitHub Actions
- **Arquivo:** `.github/workflows/deploy-pages.yml`
- **Função:** Build e deploy automático para GitHub Pages

### Configuração Vite
- **Arquivo:** `aureon-os/vite.config.js`
- **Base URL:** `/aureon-erp/` (para GitHub Pages)

---

## 🐛 Troubleshooting

### Site não carrega CSS/JS
**Problema:** Caminhos incorretos dos assets  
**Solução:** Verificar se `base: '/aureon-erp/'` está no vite.config.js

### API não funciona
**Problema:** CORS ou URL da API incorreta  
**Solução:** Configurar variável `VITE_API_URL` no workflow ou usar backend hospedado

### 404 ao navegar
**Problema:** SPA routing não configurado  
**Solução:** Criar arquivo `public/404.html` redirecionando para index.html

---

## 🎯 Próximos Passos

### Backend (API)
O frontend está configurado para usar a API em produção. Você precisará:

1. **Hospedar o backend** em:
   - Heroku
   - Railway
   - Render
   - Vercel (serverless)
   - AWS/Azure/Google Cloud

2. **Atualizar a URL da API** no workflow:
   ```yaml
   env:
     VITE_API_URL: https://sua-api.herokuapp.com
   ```

### Domínio Customizado (Opcional)

1. Compre um domínio (ex: aureon-erp.com)
2. Configure DNS:
   ```
   CNAME @ amorimbrunoengenharia-cmd.github.io
   ```
3. No GitHub, em Settings > Pages, adicione o domínio customizado

---

## 📊 Monitoramento

- **GitHub Actions:** Veja logs de deploy na aba Actions
- **Status:** Badge de deploy no README
- **Analytics:** Configure Google Analytics se necessário

---

## 🔐 Variáveis de Ambiente

Para configurar variáveis de ambiente sensíveis:

1. Vá em **Settings** > **Secrets and variables** > **Actions**
2. Clique em **New repository secret**
3. Adicione:
   - `VITE_API_URL`
   - `VITE_WS_URL`
   - Outras variáveis necessárias

4. Use no workflow:
   ```yaml
   env:
     VITE_API_URL: ${{ secrets.VITE_API_URL }}
   ```

---

## ✅ Checklist de Deploy

- [x] Código no GitHub
- [x] Workflow configurado
- [ ] GitHub Pages habilitado (faça manualmente)
- [ ] Workflow executado
- [ ] Site online e funcionando
- [ ] Backend hospedado (se necessário)
- [ ] DNS configurado (se domínio customizado)

---

**Última atualização:** 29 de Dezembro de 2025  
**Status:** Pronto para deploy após configuração manual no GitHub
