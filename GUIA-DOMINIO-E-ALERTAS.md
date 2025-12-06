# Guia: Como Usar Domínio Personalizado (aureon-os.com.br)

## 📋 O Que Foi Implementado

### ✅ Removido:
- **Integração Alibaba** - Não há mais busca automática
- **Aba "Buscar no Alibaba"** - Removida do UnifiedInventory

### ✅ Adicionado:
1. **Campo Fornecedor nos Produtos**
   - Ao cadastrar produto, pode vincular a um fornecedor
   - Fornecedores são cadastrados manualmente na aba "Fornecedores"

2. **Sistema de Rastreamento de Vendas**
   - Cada produto rastreia `totalVendido`
   - Vincula vendas ao fornecedor do produto
   - Histórico completo de performance

3. **Alertas Automáticos de Estoque**
   - **Produtos Zerados**: Alerta vermelho quando estoque = 0
   - **Reposição Necessária**: Alerta laranja quando estoque < 30% das vendas
   - **Estoque Mínimo Inteligente**: Calcula baseado no histórico de vendas
   - **Contato do Fornecedor**: Exibe direto no alerta para facilitar pedido

4. **Dashboard de Analytics**
   - **Top 10 Produtos Mais Vendidos**: Com ranking e badges
   - **Performance por Fornecedor**: Total de vendas agrupado
   - **Vinculação Visual**: Mostra qual fornecedor de cada produto

---

## 🌐 Como Configurar Domínio Personalizado

### Opção 1: Ngrok com Domínio Próprio (PAGO)
**Custo**: $8/mês (plano Pro) + custo do domínio

1. **Comprar o domínio**: aureon-os.com.br
   - Registrar em: registro.br, GoDaddy, Hostinger, etc.

2. **Upgrade Ngrok para Pro**:
   ```bash
   # Assinar em: https://ngrok.com/pricing
   ```

3. **Configurar domínio customizado**:
   ```bash
   ngrok http 5173 --domain=aureon-os.com.br
   ```

4. **Configurar DNS**:
   - Adicionar CNAME no painel do registrador:
   - Nome: `@` ou `www`
   - Valor: `your-custom-domain.ngrok.io`

---

### Opção 2: Hospedagem Real (RECOMENDADO)

#### A) Vercel (GRÁTIS)
**Melhor para**: Produção, domínio próprio gratuito

1. **Deploy**:
   ```bash
   cd aureon-os
   npm install -g vercel
   vercel
   ```

2. **Configurar domínio**:
   - Ir em Vercel Dashboard → Settings → Domains
   - Adicionar: `aureon-os.com.br`
   - Configurar DNS conforme instruções

3. **Deploy automático**:
   - Conectar ao GitHub
   - Cada push = deploy automático

**Vantagens**:
- ✅ SSL grátis (HTTPS)
- ✅ CDN global
- ✅ Deploy em segundos
- ✅ Domínio personalizado grátis

---

#### B) Netlify (GRÁTIS)
**Similar ao Vercel**

1. **Build do projeto**:
   ```bash
   cd aureon-os
   npm run build
   ```

2. **Deploy**:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Configurar domínio**:
   - Netlify Dashboard → Domain Settings
   - Adicionar: `aureon-os.com.br`

---

#### C) AWS / Azure / Google Cloud (PAGO)
**Melhor para**: Controle total, escalabilidade

**Custo estimado**: R$ 50-200/mês
- Servidor VPS
- Domínio próprio
- SSL configurado

---

## 🔧 Configuração DNS (Para Qualquer Opção)

### No Painel do Registrador (registro.br / GoDaddy / etc):

```
Tipo    Nome    Valor                        TTL
A       @       IP_DO_SERVIDOR              3600
CNAME   www     aureon-os.com.br            3600
```

**Para Vercel/Netlify**: Eles fornecem os valores exatos no dashboard.

---

## 🚀 Passos Recomendados

1. **Comprar domínio**: aureon-os.com.br (~R$ 40/ano)
2. **Fazer deploy no Vercel**: Grátis + SSL automático
3. **Configurar DNS**: Apontar para Vercel
4. **Aguardar propagação**: 24-48h

### Comando de Deploy Vercel:
```bash
cd "C:\Users\Usuario\Desktop\Projeto AUREON ERP\aureon-os"
npm run build
vercel --prod
```

---

## 📊 Como Usar o Novo Sistema

### 1. Cadastrar Fornecedores
   - Ir em **Estoque → Fornecedores**
   - Adicionar: Nome, contato, empresa

### 2. Cadastrar Produtos com Fornecedor
   - Ir em **Estoque → Produtos**
   - Preencher: Nome, Quantidade, Preço
   - **Selecionar Fornecedor** no dropdown
   - Clicar em "Adicionar Produto"

### 3. Registrar Vendas
   - Ir em **Vendas**
   - Registrar venda normalmente
   - Sistema automaticamente:
     - Decrementa estoque
     - Incrementa `totalVendido` do produto
     - Vincula à performance do fornecedor

### 4. Monitorar Alertas
   - Ir em **Estoque → Previsão & Reposição**
   - Ver alertas automáticos:
     - **Vermelho**: Produtos zerados
     - **Laranja**: Precisam reposição
   - Contato do fornecedor aparece no alerta

### 5. Analisar Performance
   - **Top 10 Mais Vendidos**: Ranking visual
   - **Performance por Fornecedor**: Vendas agrupadas
   - **Dismissar alertas**: Botão X para remover temporariamente

---

## 🎯 Lógica de Alertas

### Alerta de Reposição é Disparado Quando:
```javascript
// Produto vendeu pelo menos 5 unidades
totalVendido >= 5

// E estoque atual está abaixo de 30% do total vendido
estoqueAtual <= (totalVendido * 0.3)

// OU estoque crítico (padrão)
estoqueAtual <= 5
```

### Exemplo:
- Produto vendeu: **20 unidades**
- Estoque mínimo calculado: **6 unidades** (30% de 20)
- Estoque atual: **4 unidades**
- ⚠️ **Alerta disparado!**

---

## 📞 Suporte

### Problemas com Ngrok:
- Verificar authtoken configurado
- Porta 5173 deve estar livre
- Vite deve estar rodando

### Problemas com Vercel:
- Verificar build bem-sucedido
- Conferir DNS propagado (use `nslookup`)
- SSL pode levar até 24h

### Dúvidas sobre Alertas:
- Alertas calculam automaticamente
- Baseados no histórico de vendas
- Dismissar é temporário (volta ao recarregar)

---

## ✨ Próximos Passos Sugeridos

1. ✅ Deploy em produção (Vercel)
2. ✅ Configurar domínio personalizado
3. ✅ Testar alertas com vendas reais
4. ✅ Cadastrar fornecedores existentes
5. ✅ Vincular produtos aos fornecedores
6. ✅ Monitorar dashboard de analytics

---

**Status Atual**: ✅ Sistema 100% funcional localmente  
**Próximo Passo**: Deploy em produção para usar domínio personalizado
