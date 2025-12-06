# ✅ TESTES PRIORITÁRIOS - CONTINUAÇÃO

## 🎯 STATUS: Continuando após RBAC - UnifiedInventory

---

## 🔒 TESTE 2: RBAC - UnifiedInventory ESTOQUE (4 min) ✅ COMEÇAR AQUI

### Passo 1: Login como ESTOQUE
1. [ ] Abrir `http://localhost:5174`
2. [ ] Se já logado, fazer **Logout** (botão vermelho no sidebar)
3. [ ] Clicar no botão **"Acesso Rápido - ESTOQUE"** (verde)
4. [ ] Verificar login como `estoque`

### Passo 2: Visualizar Produtos (Modo Normal)
5. [ ] Ir para aba **"📦 Produtos"**
6. [ ] Verificar se tabela mostra colunas:
   - [ ] ✅ ID
   - [ ] ✅ Nome do Produto (com ícone 🔒)
   - [ ] ✅ 💵 Valor Compra (visível, com ícone 🔒)
   - [ ] ✅ 💰 Valor Venda (visível, com ícone 🔒)
   - [ ] ✅ 📊 Margem (visível)
   - [ ] ✅ 🔓 Quantidade (Editável) ← **HEADER deve dizer "Editável"**
   - [ ] ✅ 🏢 Fornecedor
   - [ ] ✅ Status
   - [ ] ❌ Ações (coluna NÃO deve aparecer - sem botão Delete)

### Passo 3: Testar Edição Inline de Quantidade
7. [ ] Encontrar qualquer produto na tabela
8. [ ] Clicar no número da coluna **"Quantidade"** (ex: 50)
9. [ ] Verificar se vira **input editável** com:
   - [ ] Borda dourada (#D4AF37)
   - [ ] Background escuro (#030305)
   - [ ] Cursor piscando (autofocus)
10. [ ] Alterar valor (ex: de 50 para 55)
11. [ ] Pressionar **Enter** OU clicar fora
12. [ ] Verificar se:
    - [ ] Input fecha
    - [ ] Novo valor (55) aparece na tabela
    - [ ] Status atualiza (✅ 🟢 se >= 10)

### Passo 4: Verificar Campos Readonly
13. [ ] Observar ícones 🔒 (Lock) ao lado de:
    - [ ] Nome do Produto
    - [ ] Valor Compra
    - [ ] Valor Venda
14. [ ] Tentar clicar nesses campos → **Não deve permitir editar**
15. [ ] Passar mouse sobre campos → Cursor deve mostrar "not-allowed"

### Passo 5: Ocultar Valores Monetários
16. [ ] Ir para aba **"👤 Minhas Preferências"** (última aba)
17. [ ] Encontrar seção **"🏢 ESTOQUE"**
18. [ ] Localizar toggle **"Ocultar Valores Monetários"**
19. [ ] Clicar para **ATIVAR** (switch deve ficar verde/azul)
20. [ ] Rolar até o final e clicar em **"💾 Salvar Configurações"**
21. [ ] Verificar mensagem verde: **"✅ Configurações salvas com sucesso!"**
22. [ ] Voltar para aba **"📦 Produtos"**

### Passo 6: Verificar Colunas Ocultadas
23. [ ] Verificar que as seguintes colunas **DESAPARECERAM**:
    - [ ] ❌ 💵 Valor Compra (não existe mais)
    - [ ] ❌ 💰 Valor Venda (não existe mais)
    - [ ] ❌ 📊 Margem (não existe mais)
24. [ ] Verificar que as seguintes colunas **PERMANECERAM**:
    - [ ] ✅ ID
    - [ ] ✅ Nome do Produto
    - [ ] ✅ 🔓 Quantidade (ainda editável!)
    - [ ] ✅ 🏢 Fornecedor
    - [ ] ✅ Status
25. [ ] Testar edição de quantidade novamente → **Deve continuar funcionando**

---

## ✅ TESTE 3: Validação NOT NULL (2 min)

### Criar Produto Incompleto (Deve Falhar)
1. [ ] Ainda logado como **ESTOQUE**
2. [ ] Ir para aba **"📦 Produtos"**
3. [ ] Rolar até formulário **"Adicionar Produto"** (topo ou final da página)
4. [ ] Preencher **APENAS**:
   - [ ] Nome: `Óculos Teste Validação`
   - [ ] Estoque: `10`
5. [ ] **NÃO preencher**:
   - [ ] ❌ Valor de Compra
   - [ ] ❌ Valor de Venda
   - [ ] ❌ Fornecedor
6. [ ] Clicar em botão **"+ Adicionar Produto"**
7. [ ] Verificar se aparece **alert do navegador**:
   ```
   ⚠️ Preencha TODOS os campos obrigatórios:
   - Nome do Produto
   - Quantidade em Estoque
   - Valor de Compra
   - Valor de Venda
   - Fornecedor
   ```
8. [ ] Clicar **OK** no alert
9. [ ] Verificar que produto **NÃO foi criado** (não aparece na tabela)

### Criar Produto Completo (Deve Funcionar)
10. [ ] Preencher **TODOS os campos**:
    - [ ] Nome: `Óculos Teste Completo`
    - [ ] Estoque: `25`
    - [ ] Valor de Compra: `30.00`
    - [ ] Valor de Venda: `90.00`
    - [ ] Fornecedor: **Selecionar qualquer da lista**
11. [ ] Clicar em **"+ Adicionar Produto"**
12. [ ] Verificar se produto aparece na tabela:
    - [ ] Nome: "Óculos Teste Completo"
    - [ ] Quantidade: 25 ✅
    - [ ] Status: ✅ (verde, pois >= 10)
13. [ ] Se "Ocultar Valores" estiver **DESATIVADO**, verificar:
    - [ ] Margem calculada: ~66.7% (verde, pois >= 30%)

---

## 🛒 TESTE 4: Lead Time Management (3 min)

### Login como COMPRAS
1. [ ] Fazer **Logout**
2. [ ] Clicar em **"Acesso Rápido - COMPRAS"** (azul)
3. [ ] Verificar:
   - [ ] Avatar com "C" (compras)
   - [ ] Nome "compras" no sidebar
   - [ ] Role "Compras"

### Configurar Lead Time Padrão
4. [ ] Ir para aba **"👤 Minhas Preferências"**
5. [ ] Encontrar seção **"🛒 COMPRAS"**
6. [ ] Configurações:
   - [ ] **Slider "Dias de Segurança"**: Arrastar para **5 dias**
   - [ ] **Input "Lead Time Padrão (dias)"**: Digitar **15**
   - [ ] Toggle "Exibir Fórmulas Detalhadas": Ativar (opcional)
7. [ ] Clicar em **"💾 Salvar Configurações"**
8. [ ] Verificar mensagem: **"✅ Configurações salvas!"**

### Verificar Integração com Algoritmo
9. [ ] Ir para aba **"🛒 Central de Compras"**
10. [ ] Clicar em botão **"🤖 Gerar Sugestões Automáticas"**
11. [ ] Verificar que sugestões foram geradas
12. [ ] **Anotar** quantidade sugerida de algum produto (ex: Produto X → 30 unidades)
13. [ ] Voltar para **"👤 Minhas Preferências"**
14. [ ] Alterar "Dias de Segurança" para **10 dias** (dobrou!)
15. [ ] Salvar novamente
16. [ ] Voltar para **"🛒 Central de Compras"**
17. [ ] Regerar sugestões
18. [ ] Verificar que quantidade sugerida **AUMENTOU** (ex: Produto X → 45 unidades)
    - **Motivo**: Mais dias de segurança = mais estoque recomendado

### Criar Fornecedor com Lead Time (se disponível)
19. [ ] Ir para aba **"⚙️ Configurações"** ou **"📦 Visualizar Estoque"** > Fornecedores
20. [ ] Encontrar formulário "Adicionar Fornecedor"
21. [ ] Preencher:
    - [ ] Nome: `Fornecedor Teste COMPRAS`
    - [ ] Contato: `11999999999`
    - [ ] Origem: Selecionar `Alibaba`
    - [ ] **Lead Time (dias)**: Campo deve mostrar **15** (do UserSettings)
22. [ ] Campo Lead Time deve estar **EDITÁVEL** (sem ícone 🔒)
23. [ ] Alterar para **20 dias** (testar edição)
24. [ ] Clicar em **"+ Adicionar Fornecedor"**
25. [ ] Verificar no card do fornecedor criado:
    ```
    🏢 Fornecedor Teste COMPRAS
    📱 11999999999
    📍 Alibaba
    ⏱️ Lead Time: 20 dias
    ```

---

## 💳 TESTE 5: Meta Pessoal - VENDAS (3 min)

### Login como VENDAS
1. [ ] Fazer **Logout**
2. [ ] Clicar em **"Acesso Rápido - VENDAS"** (laranja)
3. [ ] Verificar:
   - [ ] Avatar com "V" (vendedor)
   - [ ] Nome "vendedor" no sidebar
   - [ ] Role "Vendas"

### Configurar Meta Pessoal
4. [ ] Ir para aba **"👤 Minhas Preferências"**
5. [ ] Encontrar seção **"💳 VENDAS"**
6. [ ] Configurações:
   - [ ] **Input "Meta Pessoal (R$)"**: Digitar `10000`
   - [ ] **Toggle "Exibir Progresso da Meta"**: **ATIVAR**
   - [ ] **Checkboxes "Canais Preferidos"**: Marcar:
     - [ ] Instagram
     - [ ] WhatsApp
7. [ ] Clicar em **"💾 Salvar Configurações"**
8. [ ] Verificar mensagem: **"✅ Configurações salvas!"**

### Verificar Widget Meta Pessoal
9. [ ] Ir para aba **"💳 PDV & Vendas"**
10. [ ] No **TOPO da página**, verificar se aparece **Widget "Meta Pessoal"**
11. [ ] Widget deve ter:
    - [ ] Ícone 🎯 (Target) laranja
    - [ ] Título: **"Meta Pessoal"**
    - [ ] Subtítulo: "Progresso do mês atual"
    - [ ] Display: **"R$ X.XXX / R$ 10.000,00"**
    - [ ] **Barra de progresso** colorida (horizontal)
    - [ ] **Percentual dentro da barra** (ex: 15%)
    - [ ] **Mensagem motivacional** abaixo:
      - Se < 70%: 🔴 Vermelho + **"🚀 Vamos acelerar! Falta R$ X.XXX"**
      - Se 70-99%: 🟡 Amarelo + **"💪 Quase lá! Continue assim!"**
      - Se >= 100%: 🟢 Verde + **"🎉 Parabéns! Você atingiu sua meta!"**

### Testar Atualização Dinâmica (opcional)
12. [ ] Rolar até formulário **"Registrar Venda"**
13. [ ] Criar venda:
    - [ ] Produto: Selecionar qualquer
    - [ ] Cliente: Selecionar qualquer
    - [ ] Valor Venda: `500.00`
    - [ ] Canal: WhatsApp
14. [ ] Clicar em **"Adicionar Venda"**
15. [ ] Rolar para cima até widget "Meta Pessoal"
16. [ ] Verificar se:
    - [ ] Valor atualiza: "R$ 500,00 / R$ 10.000,00"
    - [ ] Barra avança para ~5%
    - [ ] Cor continua vermelha (< 70%)
17. [ ] Criar mais vendas até atingir ~R$ 7.500 (75%)
18. [ ] Verificar se barra fica **AMARELA** e mensagem muda para "💪 Quase lá!"
19. [ ] Criar mais vendas até passar de R$ 10.000
20. [ ] Verificar se barra fica **VERDE** e mensagem "🎉 Parabéns!"

---

## 🔒 TESTE 6: Audit Log (CEO Only) (2 min)

### Login como CEO
1. [ ] Fazer **Logout**
2. [ ] Clicar em **"Acesso Rápido - CEO"** (dourado)

### Alterar Preço de Produto
3. [ ] Ir para aba **"📦 Produtos"** (ou similar)
4. [ ] Encontrar qualquer produto existente
5. [ ] **Anotar o preço atual** (ex: R$ 50,00)
6. [ ] Editar produto:
   - [ ] Alterar preço de venda: De `50.00` para `80.00`
   - [ ] Salvar
7. [ ] Verificar que preço foi atualizado na tabela

### Verificar Audit Log
8. [ ] Ir para aba **"🔒 Audit Log"** (deve aparecer apenas para CEO)
9. [ ] Verificar **Dashboard de Estatísticas** no topo:
   - [ ] Total de Eventos
   - [ ] Mudanças de Preço
   - [ ] Alterações de Config
   - [ ] Ações de Usuários
10. [ ] Na tabela de eventos, verificar **evento mais recente**:
    - [ ] Action: **PRICE_CHANGE**
    - [ ] Resource Type: **produtos**
    - [ ] User: **admin**
    - [ ] Old Value: `{"precoVenda": 50}`
    - [ ] New Value: `{"precoVenda": 80}`
    - [ ] Description: "Ajuste manual de preço"
11. [ ] Testar filtros:
    - [ ] Busca: Digitar nome do produto → Deve filtrar
    - [ ] Tipo de Ação: Selecionar "PRICE_CHANGE" → Deve mostrar apenas mudanças de preço
    - [ ] Data: Selecionar "Últimos 7 dias"
12. [ ] Clicar em **"Exportar CSV"**
13. [ ] Verificar se arquivo baixa (audit_log_YYYY-MM-DD.csv)

### Verificar que Outros Perfis NÃO Veem Audit Log
14. [ ] Fazer **Logout**
15. [ ] Login como **ESTOQUE**, **COMPRAS** ou **VENDAS**
16. [ ] Verificar que aba **"🔒 Audit Log"** **NÃO aparece** na sidebar

---

## 📊 RESUMO DOS TESTES

| # | Teste | Tempo | Status |
|---|-------|-------|--------|
| 1 | Login Básico | 2 min | ⏳ Pendente |
| 2 | RBAC - UnifiedInventory (ESTOQUE) | 4 min | ⏳ **COMEÇAR AQUI** |
| 3 | Validação NOT NULL | 2 min | ⏳ Pendente |
| 4 | Lead Time Management (COMPRAS) | 3 min | ⏳ Pendente |
| 5 | Meta Pessoal (VENDAS) | 3 min | ⏳ Pendente |
| 6 | Audit Log (CEO) | 2 min | ⏳ Pendente |
| **TOTAL** | **16 minutos** | ⏳ |

---

## 🎯 CRITÉRIOS DE SUCESSO

### ✅ Teste Passou Se:
- [ ] ESTOQUE consegue editar quantidade mas não preços
- [ ] Ocultar valores remove colunas monetárias
- [ ] Validação NOT NULL bloqueia criação incompleta
- [ ] Lead Time é editável por COMPRAS e readonly para outros
- [ ] Meta Pessoal mostra barra colorida e atualiza dinamicamente
- [ ] Audit Log registra PRICE_CHANGE automaticamente
- [ ] Apenas CEO vê Audit Log

### ❌ Teste Falhou Se:
- [ ] Erros no console do navegador (F12)
- [ ] ESTOQUE consegue deletar produtos
- [ ] Validação permite criar produto sem fornecedor
- [ ] Barra de Meta Pessoal não atualiza após venda
- [ ] Audit Log não registra mudanças de preço

---

## 🐛 REPORTAR BUGS

Se encontrar algum problema:

1. Abrir DevTools (F12)
2. Ir para aba **Console**
3. Copiar mensagens de erro
4. Anotar:
   - Perfil logado
   - Ação realizada
   - Resultado esperado vs obtido

---

**URL**: http://localhost:5174  
**Credenciais**:
- CEO: `admin` / `admin123`
- ESTOQUE: `estoque` / `estoque123`
- COMPRAS: `compras` / `compras123`
- VENDAS: `vendedor` / `vendedor123`
