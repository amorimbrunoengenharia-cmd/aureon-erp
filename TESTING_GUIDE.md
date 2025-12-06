# 🧪 Guia de Testes - AUREON ERP

## 📋 Checklist de Testes por Perfil

### ✅ 1. TESTE DE AUTENTICAÇÃO

#### Login e Logout
- [ ] Acessar `http://localhost:5174`
- [ ] Verificar se redireciona para tela de Login
- [ ] Testar login com credenciais inválidas (deve mostrar erro)
- [ ] Testar login com cada perfil:
  - [ ] **CEO**: `admin` / `admin123`
  - [ ] **ESTOQUE**: `estoque` / `estoque123`
  - [ ] **COMPRAS**: `compras` / `compras123`
  - [ ] **VENDAS**: `vendedor` / `vendedor123`
- [ ] Verificar se o nome e role aparecem no sidebar
- [ ] Clicar em Logout e verificar se retorna para tela de Login

---

### 👑 2. TESTE PERFIL CEO (admin/admin123)

#### Permissões Gerais
- [ ] Verificar se todas as abas estão visíveis:
  - [ ] 📊 Visão Geral
  - [ ] 📈 Relatórios Executivos
  - [ ] 👥 Clientes & Rede
  - [ ] 🔒 Audit Log
  - [ ] ⚙️ Configurações
  - [ ] 👤 Minhas Preferências

#### UnifiedInventory (CEO)
- [ ] Ir para aba "Produtos"
- [ ] Verificar se TODAS as colunas estão visíveis (ID, Nome, Valor Compra, Valor Venda, Margem, Quantidade, Fornecedor, Status, Ações)
- [ ] Verificar se campo "Quantidade" é EDITÁVEL (clicar no número)
- [ ] Verificar se botão "Excluir" (🗑️) está visível
- [ ] Criar novo produto:
  - [ ] Nome: `Óculos Teste CEO`
  - [ ] Estoque: `50`
  - [ ] Valor Compra: `20.00`
  - [ ] Valor Venda: `80.00`
  - [ ] Fornecedor: Selecionar qualquer
  - [ ] Verificar se produto foi criado
- [ ] Editar quantidade inline (clicar no número, alterar, pressionar Enter)
- [ ] Deletar produto criado

#### UserSettings (CEO)
- [ ] Ir para aba "👤 Minhas Preferências"
- [ ] Verificar seção CEO:
  - [ ] Slider "Meta de Crescimento" (0-100%)
  - [ ] Toggle "Visualizar Audit Log"
  - [ ] Toggle "Alertas Críticos"
- [ ] Alterar Meta de Crescimento para `25%`
- [ ] Clicar em "Salvar Configurações"
- [ ] Recarregar página e verificar se salvou

#### Audit Log (CEO Only)
- [ ] Ir para aba "🔒 Audit Log"
- [ ] Verificar se estatísticas aparecem (Total de Eventos, Mudanças de Preço, etc)
- [ ] Fazer um teste: alterar preço de um produto
- [ ] Voltar ao Audit Log e verificar se evento PRICE_CHANGE foi registrado
- [ ] Testar filtros:
  - [ ] Busca por nome de produto
  - [ ] Filtro por tipo de ação (PRICE_CHANGE, CONFIG_CHANGE, etc)
  - [ ] Filtro por data
- [ ] Clicar em "Exportar CSV" e verificar download

---

### 📦 3. TESTE PERFIL ESTOQUE (estoque/estoque123)

#### Permissões Gerais
- [ ] Verificar abas visíveis:
  - [ ] 📦 Produtos
  - [ ] 🔄 Movimentações
  - [ ] 📊 Relatório Estoque
  - [ ] ⚙️ Configurações
  - [ ] 👤 Minhas Preferências

#### UnifiedInventory (ESTOQUE - Modo Normal)
- [ ] Ir para aba "📦 Produtos"
- [ ] Verificar se colunas MONETÁRIAS estão visíveis: Valor Compra, Valor Venda, Margem
- [ ] Verificar se há ícone 🔒 ao lado dos valores (indicando readonly)
- [ ] Verificar se campo "Quantidade" é EDITÁVEL (deve ter texto "Editável" no header)
- [ ] Editar quantidade de um produto (inline edit)
- [ ] Verificar se botão "Excluir" NÃO está visível
- [ ] Tentar criar novo produto - deve funcionar (ESTOQUE tem permissão create)

#### UserSettings (ESTOQUE - Ocultar Valores)
- [ ] Ir para aba "👤 Minhas Preferências"
- [ ] Verificar seção ESTOQUE:
  - [ ] Toggle "Ocultar Valores Monetários"
  - [ ] Input "Alerta Estoque Mínimo"
  - [ ] Input "Alerta Estoque Crítico"
  - [ ] Toggle "Notificações Ativas"
- [ ] Ativar toggle "Ocultar Valores Monetários"
- [ ] Clicar em "Salvar Configurações"
- [ ] Voltar para aba "📦 Produtos"
- [ ] **Verificar se colunas Valor Compra, Valor Venda e Margem DESAPARECERAM**
- [ ] Verificar se ainda pode editar quantidade

---

### 🛒 4. TESTE PERFIL COMPRAS (compras/compras123)

#### Permissões Gerais
- [ ] Verificar abas visíveis:
  - [ ] 🛒 Central de Compras
  - [ ] 📦 Visualizar Estoque
  - [ ] 💰 Calculadora
  - [ ] ⚙️ Configurações
  - [ ] 👤 Minhas Preferências

#### UnifiedInventory (COMPRAS - Readonly)
- [ ] Ir para aba "📦 Visualizar Estoque"
- [ ] Verificar se campo "Quantidade" NÃO é editável (deve ter ícone 🔒)
- [ ] Verificar se botão "Excluir" NÃO está visível
- [ ] Tentar clicar na quantidade - não deve permitir editar

#### UserSettings (COMPRAS - Configuração do Algoritmo)
- [ ] Ir para aba "👤 Minhas Preferências"
- [ ] Verificar seção COMPRAS:
  - [ ] **Slider "Dias de Segurança" (1-10 dias)**
  - [ ] **Input "Lead Time Padrão" (1-90 dias)**
  - [ ] Toggle "Exibir Fórmulas Detalhadas"
  - [ ] Toggle "Alertas de Reposição"
- [ ] Alterar "Dias de Segurança" para `5` dias
- [ ] Alterar "Lead Time Padrão" para `15` dias
- [ ] Salvar configurações

#### Central de Compras (Algoritmo Integrado)
- [ ] Ir para aba "🛒 Central de Compras"
- [ ] Clicar em "🤖 Gerar Sugestões Automáticas"
- [ ] Verificar se sugestões levam em conta os `5 dias` de segurança configurados
- [ ] **Testar**: Alterar diasSeguranca para `10`, regerar sugestões, verificar se valores mudaram

#### Fornecedores (Lead Time)
- [ ] Ir para aba "Fornecedores" (se disponível) ou em Produtos > Fornecedor
- [ ] Criar novo fornecedor
- [ ] Verificar se campo "Lead Time" está EDITÁVEL (sem ícone 🔒)
- [ ] Preencher Lead Time: `15` dias (deve usar leadTimePadrao do UserSettings)
- [ ] Salvar fornecedor
- [ ] Verificar se Lead Time aparece no card do fornecedor: "⏱️ Lead Time: 15 dias"

---

### 💳 5. TESTE PERFIL VENDAS (vendedor/vendedor123)

#### Permissões Gerais
- [ ] Verificar abas visíveis:
  - [ ] 💳 PDV & Vendas
  - [ ] 👥 Clientes
  - [ ] 🔗 Mercado Livre
  - [ ] 💰 Calculadora
  - [ ] ⚙️ Configurações
  - [ ] 👤 Minhas Preferências

#### UnifiedInventory (VENDAS - Readonly Total)
- [ ] Ir para aba "Visualizar Estoque" (se disponível em outro perfil ou testar via Settings)
- [ ] Verificar se campo "Quantidade" NÃO é editável (ícone 🔒)
- [ ] Verificar se botão "Excluir" NÃO está visível
- [ ] Todas as colunas devem ter ícone 🔒 (exceto Status)

#### UserSettings (VENDAS - Meta Pessoal)
- [ ] Ir para aba "👤 Minhas Preferências"
- [ ] Verificar seção VENDAS:
  - [ ] **Input "Meta Pessoal (R$)"**
  - [ ] Toggle "Exibir Progresso da Meta"
  - [ ] Checkboxes "Canais Preferidos" (Instagram, WhatsApp, etc)
  - [ ] Toggle "Notificações de Clientes"
- [ ] Definir Meta Pessoal: `R$ 15.000,00`
- [ ] Ativar "Exibir Progresso da Meta"
- [ ] Selecionar canais: Instagram, WhatsApp
- [ ] Salvar configurações

#### Dashboard Meta Pessoal
- [ ] Ir para aba "💳 PDV & Vendas"
- [ ] **Verificar se Widget "Meta Pessoal" aparece no topo**
- [ ] Widget deve mostrar:
  - [ ] Título: "Meta Pessoal"
  - [ ] Progresso: "R$ X.XXX / R$ 15.000"
  - [ ] Barra de progresso colorida:
    - [ ] **Verde** se >= 100% (meta atingida) + mensagem "🎉 Parabéns!"
    - [ ] **Amarelo** se 70-99% + mensagem "💪 Quase lá!"
    - [ ] **Vermelho** se < 70% + mensagem "🚀 Vamos acelerar!"
  - [ ] Percentual dentro da barra
- [ ] Fazer uma venda de teste (ex: R$ 500)
- [ ] Verificar se barra atualiza automaticamente

---

## 🔧 6. TESTES DE VALIDAÇÃO

### Validação de Campos Obrigatórios (NOT NULL)
- [ ] Tentar criar produto SEM nome → deve mostrar alerta
- [ ] Tentar criar produto SEM estoque → deve mostrar alerta
- [ ] Tentar criar produto SEM valor de compra → deve mostrar alerta
- [ ] Tentar criar produto SEM valor de venda → deve mostrar alerta
- [ ] Tentar criar produto SEM fornecedor → deve mostrar alerta
- [ ] Preencher TODOS os campos → deve criar com sucesso

### Validação de Permissões (RBAC)
- [ ] Login como ESTOQUE
- [ ] Tentar deletar produto → botão não deve aparecer
- [ ] Tentar acessar Audit Log → aba não deve aparecer
- [ ] Tentar editar campo nome ou preço → deve ter ícone 🔒

### Validação de Audit Log
- [ ] Login como CEO
- [ ] Alterar preço de produto: R$ 50 → R$ 80
- [ ] Ir para Audit Log
- [ ] Verificar registro PRICE_CHANGE:
  - [ ] oldValue: `{"precoVenda": 50}`
  - [ ] newValue: `{"precoVenda": 80}`
  - [ ] description: "Ajuste manual de preço"
- [ ] Alterar fornecedor de produto
- [ ] Verificar registro SUPPLIER_CHANGE
- [ ] Alterar UserSettings
- [ ] Verificar registro CONFIG_CHANGE

---

## 🎯 7. TESTES DE INTEGRAÇÃO

### Algoritmo + UserSettings (COMPRAS)
1. [ ] Login como COMPRAS
2. [ ] Ir para UserSettings → Dias de Segurança: `3`
3. [ ] Ir para Central de Compras → Gerar Sugestões
4. [ ] Anotar valor sugerido para Produto X
5. [ ] Voltar para UserSettings → Alterar Dias de Segurança: `7`
6. [ ] Regerar Sugestões
7. [ ] Verificar se valor aumentou (mais dias = mais estoque recomendado)

### Meta Pessoal + Vendas (VENDAS)
1. [ ] Login como VENDAS
2. [ ] Ir para UserSettings → Meta Pessoal: `R$ 10.000`
3. [ ] Ir para PDV & Vendas → Verificar barra em 0% (ou vendas atuais)
4. [ ] Registrar venda de R$ 5.000
5. [ ] Verificar se barra atualiza para 50% (amarelo)
6. [ ] Registrar mais R$ 3.000 (total R$ 8.000)
7. [ ] Verificar se barra está em 80% (amarelo - "Quase lá!")
8. [ ] Registrar mais R$ 2.500 (total R$ 10.500)
9. [ ] Verificar se barra está em 105% (verde - "Parabéns!")

### Ocultar Valores + ESTOQUE
1. [ ] Login como ESTOQUE
2. [ ] Ir para Produtos → Verificar colunas visíveis
3. [ ] Ir para UserSettings → Ativar "Ocultar Valores Monetários"
4. [ ] Voltar para Produtos → Verificar se colunas Valor Compra, Valor Venda, Margem sumiram
5. [ ] Desativar toggle → Verificar se colunas voltam

---

## 🐛 8. TESTES DE REGRESSÃO

### Hooks Order (React)
- [ ] Recarregar página várias vezes
- [ ] Verificar console: **NÃO deve ter erro "Rendered more hooks"**
- [ ] Login/Logout múltiplas vezes
- [ ] Trocar entre abas rapidamente

### LocalStorage Persistência
- [ ] Login como CEO
- [ ] Alterar UserSettings
- [ ] Recarregar página (F5)
- [ ] Verificar se UserSettings mantiveram valores
- [ ] Fazer logout
- [ ] Fazer login novamente
- [ ] Verificar se UserSettings ainda estão salvos

### DataContext + AuthContext Integração
- [ ] Alterar preço de produto
- [ ] Verificar se Audit Log registrou
- [ ] Se AuthContext não estiver disponível (inicialização), não deve crashar

---

## ✅ CRITÉRIOS DE SUCESSO

### Funcionalidades Implementadas
- [x] RBAC com 4 perfis (CEO, ESTOQUE, COMPRAS, VENDAS)
- [x] Login/Logout funcional
- [x] UserSettings por perfil (CEO, ESTOQUE, COMPRAS, VENDAS)
- [x] Algoritmo integrado com diasSeguranca (COMPRAS)
- [x] Dashboard Meta Pessoal com progress bar (VENDAS)
- [x] Audit Log automático (PRICE_CHANGE, SUPPLIER_CHANGE, CONFIG_CHANGE)
- [x] UnifiedInventory com readonly fields por perfil
- [x] Ocultar valores monetários (ESTOQUE)
- [x] Lead Time Management (COMPRAS pode editar)
- [x] Validação de campos obrigatórios (NOT NULL)
- [x] Permissões de delete (somente CEO)

### Performance
- [ ] Tempo de login < 1s
- [ ] Troca de abas < 500ms
- [ ] Geração de sugestões < 2s
- [ ] Zero erros no console

### UX/UI
- [ ] Ícones 🔒 visíveis em campos readonly
- [ ] Mensagens de erro claras
- [ ] Progress bar animada e colorida
- [ ] Formulários com validação visual
- [ ] Feedback de sucesso/erro em todas as ações

---

## 📊 RELATÓRIO DE BUGS

Use esta seção para documentar bugs encontrados durante os testes:

| #  | Perfil | Funcionalidade | Descrição do Bug | Prioridade | Status |
|----|--------|----------------|------------------|------------|--------|
| 1  |        |                |                  | Alta/Média/Baixa | Aberto/Resolvido |
| 2  |        |                |                  |            |        |
| 3  |        |                |                  |            |        |

---

## 🎓 COMANDOS ÚTEIS

```powershell
# Iniciar servidor dev
cd "C:\Users\Usuario\Desktop\Projeto AUREON ERP\aureon-os"
npm run dev

# Limpar cache e reiniciar
Remove-Item -Recurse -Force node_modules\.vite
npm run dev

# Verificar porta ocupada
netstat -ano | Select-String ":5174"

# Abrir navegador
Start-Process "http://localhost:5174"
```

---

## 📝 NOTAS FINAIS

- **Teste cada perfil ISOLADAMENTE** (logout entre perfis)
- **Sempre verificar console** para erros React
- **Testar edge cases**: valores negativos, campos vazios, dados inválidos
- **Verificar responsividade**: Desktop, Tablet, Mobile (opcional)
- **Performance**: Abrir DevTools > Network > Verificar tempo de carregamento

---

**Data do Teste**: _____________  
**Testador**: _____________  
**Versão**: 2.0.0 (Tech Lead Refactoring)  
**Status Geral**: ⬜ Aprovado | ⬜ Reprovado | ⬜ Aprovado com Ressalvas
