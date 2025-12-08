# 🏢 AUREON ERP - Sistema de Gestão Empresarial

## ✨ Características Principais

O AUREON ERP é uma aplicação web completa para gerenciamento de negócios, desenvolvida com React e Tailwind CSS.

### 📊 Abas Disponíveis (9 Módulos)

#### 1. **Dashboard** 📈
- KPIs em tempo real (Vendas Total, Produtos em Estoque, Margem Média, Total de Clientes)
- Gráficos de vendas por mês (Line Chart)
- Gráficos de vendas por canal (Bar Chart)
- Visualização rápida do status do negócio

#### 2. **Estoque** 📦
- Adicionar novos produtos com nome, quantidade e preço
- Tabela dinâmica de produtos
- Indicadores de status: ✅ OK, ⚠️ Baixo, ❌ Fora de Estoque
- Cálculo automático de valor total do estoque
- Alertas para produtos com estoque baixo

#### 3. **Vendas** 💰
- Gráfico de vendas mensais (Bar Chart)
- Resumo de vendas por canal (WhatsApp, Email, Loja Física, Alibaba)
- Percentual de vendas por canal
- Análise de desempenho

#### 4. **Relatórios** 📋
- Exportar dados em **CSV** para análise em Excel
- Exportar dados em **JSON** para integração com outros sistemas
- Resumo consolidado de dados (Total de Vendas, Produtos, Clientes, Canais)

#### 5. **CRM** 👥
- Cadastro de clientes com nome, email e telefone
- Gestão completa de relacionamento
- Tabela dinâmica com ações
- Deleção de clientes
- Sincronização com DataContext global

#### 6. **Comunicação** 💬
- **5 Templates Predefinidos:**
  - 🎉 Promoção Especial
  - 💰 Cupom de Desconto
  - ✨ Nova Coleção
  - 👋 Volte a Nos Visitar
  - 📝 Feedback do Cliente

- **Canais de Envio:**
  - 📱 WhatsApp Web (sem API necessária)
  - 📧 Email (integrado com cliente padrão)
  - Contador de mensagens enviadas

#### 7. **Análises** 📊
- **Análise de Inventário:**
  - Total de produtos em estoque
  - Valor total do inventário
  - Produtos com alerta
  
- **Análise de Clientes:**
  - Total de clientes
  - Clientes ativos (com compras)
  - Gasto médio por cliente
  
- **Recomendações de Compra:**
  - Produtos que precisam reabastecimento
  - Quantidade recomendada
  - Nível de urgência

#### 8. **Metas** 🎯
- Defina metas de vendas mensais
- Configure margem mínima de lucro
- Estabeleça meta de clientes
- Configure meta de estoque
- Acompanhe progresso com barras de progresso visuais
- Salvar metas e persistir em localStorage

#### 9. **Configurações** ⚙️
- Preferências gerais (notificações, relatórios por email)
- Seleção de idioma (PT-BR, PT-PT, EN-US, ES-ES)
- Backup e restauração de dados
- Informações sobre a aplicação

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico
- **Frontend:** React 18.2.0
- **Build Tool:** Vite 5.1.6
- **Styling:** Tailwind CSS 3.4.18 + CSS Inline
- **Charts:** Recharts 3.5.1
- **Icons:** Lucide React 0.344.0
- **State Management:** React Context API + localStorage

### Estrutura de Pastas
```
src/
├── App.jsx                 # Componente principal com todas as abas
├── main.jsx                # Entrada da aplicação com DataProvider
├── index.css               # Estilos globais
├── components/
│   ├── CardKPI.jsx        # Componente de card com KPI
│   ├── ButtonCustom.jsx   # Botão reutilizável
│   └── LogoZenith.jsx
├── pages/
│   ├── DashboardTab.jsx       # Dashboard com gráficos
│   ├── InventoryTab.jsx       # Gestão de estoque
│   ├── CommunicationTab.jsx   # Central de comunicação
│   ├── AnalyticsTab.jsx       # Análises avançadas
│   ├── GoalsTab.jsx           # Gestão de metas
│   └── [outros componentes]
└── context/
    └── DataContext.jsx    # Contexto global com localStorage
```

### State Management
O aplicativo usa **React Context API** com **localStorage** para persistência:
- ✅ Dados persistem após refresh
- ✅ Sincronização automática entre abas
- ✅ Sem necessidade de backend

---

## 🚀 Como Usar

### Iniciando a Aplicação
```bash
cd aureon-os
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### Fluxo de Uso Recomendado

1. **Começar no CRM** 👥
   - Adicione seus primeiros clientes
   - Inclua emails e telefones para comunicação

2. **Adicionar Produtos** 📦
   - Vá para a aba "Estoque"
   - Registre seus produtos com preços

3. **Usar Comunicação** 💬
   - Vá para "Comunicação"
   - Selecione um cliente
   - Envie mensagens via WhatsApp ou Email

4. **Acompanhar Metas** 🎯
   - Configure suas metas na aba "Metas"
   - Acompanhe o progresso

5. **Analisar Dados** 📊
   - Consulte a aba "Análises" regularmente
   - Revise recomendações de compra

6. **Gerar Relatórios** 📋
   - Exporte dados em CSV/JSON

---

## 💾 Dados Persistentes

O aplicativo salva automaticamente em **localStorage**:
- Produtos (nome, estoque, preço)
- Clientes (nome, email, telefone)
- Vendas (data, hora, valor, lucro)
- Configurações e metas
- Histórico de mensagens enviadas

### Fazer Backup
- Vá para **Configurações > Dados e Backup**
- Clique em "Fazer Backup"
- Um arquivo JSON será baixado

### Restaurar Backup
- Clique em "Restaurar Backup"
- Selecione um arquivo de backup anterior

---

## 🎨 Design & UX

### Cores da Marca
- **Primária:** #D4AF37 (Ouro)
- **Sucesso:** #4CAF50 (Verde)
- **Info:** #2196F3 (Azul)
- **Warning:** #FF9800 (Laranja)
- **Danger:** #FF6B6B (Vermelho)

### Responsividade
- ✅ Totalmente funcional em desktop
- ✅ Adaptável para tablets
- ✅ Suporte a dispositivos móveis
- ✅ Navegação intuitiva

---

## 📱 Funcionalidades Avançadas

### WhatsApp Integration
- Envio direto para WhatsApp Web
- Templates personalizáveis
- Contador de mensagens
- Sem necessidade de API (usa WhatsApp Web)

### Email Integration
- Abre cliente de email padrão
- Templates em HTML
- Assunto automático
- Compatível com qualquer cliente de email

### Análises Inteligentes
- Detecção de produtos com estoque baixo
- Recomendações automáticas de compra
- Cálculo de gasto médio por cliente
- Percentual de clientes ativos

---

## 🔄 Próximas Melhorias Sugeridas

- [ ] Integração com API WhatsApp Business (envio automático)
- [ ] Integração com API de Email (envio automático)
- [ ] Gráficos de sazonalidade
- [ ] Modo escuro completo
- [ ] Relatórios em PDF
- [ ] Sistema de usuários com login
- [ ] Sincronização com banco de dados remoto

---

## 📞 Suporte

Para dúvidas ou sugestões sobre o AUREON ERP, entre em contato através da aba **Comunicação**.

---

**Desenvolvido com ❤️ | Versão 1.0.0 | December 2024**
