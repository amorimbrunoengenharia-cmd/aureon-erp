# 🚀 AUREON ERP - Quick Setup Guide

## ⚡ Setup em 5 Minutos

### 1. Clone e Instale

```bash
git clone https://github.com/amorimbrunoengenharia-cmd/aureon-erp.git
cd aureon-erp/aureon-os
npm install
```

### 2. Configure (Opcional)

```bash
cp .env.example .env
# Edite .env apenas se quiser usar OpenAI (opcional)
```

### 3. Execute

```bash
npm run dev
```

### 4. Acesse

```
http://localhost:5173
```

### 5. Login

```
Usuário: admin
Senha: admin123
```

---

## 🎯 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor

# Testes
npm test                 # Testes unitários
npm run simulate:smoke   # Smoke tests (< 60s)

# Build
npm run build            # Build produção
npm run preview          # Preview build

# Qualidade
npm run lint             # Verificar código
```

---

## 📚 Documentação Completa

- **README Principal**: [README.md](./README.md)
- **IA Features**: [docs/AI_FEATURES.md](./docs/AI_FEATURES.md)
- **Modo Simulação**: [docs/SIMULATION_MODE.md](./docs/SIMULATION_MODE.md)
- **Simulador**: [simulator/README.md](./simulator/README.md)
- **Contribuir**: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 🆘 Problemas Comuns

### Porta 5173 ocupada?

```bash
# Use outra porta
npm run dev -- --port 3000
```

### Node.js não encontrado?

```bash
# Instale Node.js 18+
# https://nodejs.org/
```

### Erro ao instalar dependências?

```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

---

## 🎉 Pronto!

O sistema está rodando em **http://localhost:5173**

Explore os 9 módulos:
- 📊 Dashboard
- 📦 Estoque  
- 💰 Vendas
- 👥 CRM
- 💬 Comunicação
- 📊 Análises
- 🎯 Metas
- 🛒 Compras
- ⚙️ Configurações

---

**Dúvidas?** Veja [README.md](./README.md) para documentação completa.
