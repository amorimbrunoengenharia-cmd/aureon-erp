# Como Contribuir para AUREON ERP

Obrigado por considerar contribuir com o AUREON ERP! Este documento fornece diretrizes para contribuição.

## 📋 Código de Conduta

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade

## 🚀 Como Começar

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU_USUARIO/aureon-erp.git
cd aureon-erp/aureon-os

# Adicione o upstream
git remote add upstream https://github.com/amorimbrunoengenharia-cmd/aureon-erp.git
```

### 2. Crie uma Branch

```bash
# Atualize sua main
git checkout main
git pull upstream main

# Crie branch para sua feature
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-bugfix
```

### 3. Faça suas Alterações

- Siga o style guide do projeto
- Adicione testes quando aplicável
- Atualize a documentação se necessário

### 4. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Tipos de commit
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção

# Exemplos
git commit -m "feat: adiciona filtro de busca no estoque"
git commit -m "fix: corrige cálculo de desconto"
git commit -m "docs: atualiza README com novos comandos"
```

### 5. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/minha-feature

# Crie Pull Request no GitHub
```

## ✅ Checklist PR

Antes de abrir um Pull Request, verifique:

- [ ] Código segue o style guide
- [ ] Testes passando (`npm test`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] Coverage mantido ou aumentado
- [ ] Documentação atualizada
- [ ] Commit messages seguem Conventional Commits
- [ ] Branch está atualizada com main

## 🧪 Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- EventBus

# Coverage
npm run test:coverage

# Smoke tests
npm run simulate:smoke
```

## 📝 Style Guide

### JavaScript/React

- Use ES6+ features
- Componentes funcionais com hooks
- PropTypes ou TypeScript
- Nomes descritivos de variáveis
- Comentários quando necessário

### CSS

- Use Tailwind CSS classes
- Evite CSS inline quando possível
- Mobile-first approach

### Commits

- Mensagens claras e descritivas
- Referência issues quando aplicável: `fix: #123`
- Um commit por mudança lógica

## 🐛 Reportar Bugs

Use GitHub Issues com template:

```markdown
**Descrição**
Descrição clara do bug

**Reproduzir**
Passos para reproduzir:
1. Vá para '...'
2. Clique em '...'
3. Veja erro

**Comportamento Esperado**
O que deveria acontecer

**Screenshots**
Se aplicável

**Ambiente**
- OS: [Windows/Linux/Mac]
- Browser: [Chrome 120]
- Node: [v20.10]
```

## 💡 Sugerir Features

Use GitHub Issues:

```markdown
**Descrição**
Descrição clara da feature

**Problema Resolvido**
Qual problema esta feature resolve?

**Solução Proposta**
Como você imagina a solução?

**Alternativas**
Outras soluções consideradas
```

## 📚 Documentação

- Documente funções complexas
- Atualize README.md quando necessário
- Adicione exemplos quando útil

## ❓ Dúvidas

- GitHub Issues: https://github.com/amorimbrunoengenharia-cmd/aureon-erp/issues
- Email: aureon@erp.local

---

**Obrigado por contribuir! 🎉**
