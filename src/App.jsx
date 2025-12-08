import React, { useState, useContext, useEffect, lazy, Suspense } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, TrendingUp, Settings as SettingsIcon, Link as LinkIcon, ArrowRightLeft, ShoppingBag, Award, Briefcase, LogOut, Shield, Eye } from 'lucide-react';

// ✅ Lazy loading para páginas pesadas (code-splitting)
const UnifiedDashboard = lazy(() => import('./pages/UnifiedDashboard'));
const Sales = lazy(() => import('./pages/Sales'));
const UnifiedInventory = lazy(() => import('./pages/UnifiedInventory'));
const UnifiedCRM = lazy(() => import('./pages/UnifiedCRM'));
const Reports = lazy(() => import('./pages/Reports'));
const StockMovements = lazy(() => import('./pages/StockMovements'));
const PurchaseCenter = lazy(() => import('./pages/PurchaseCenter'));
const SupplierManagement = lazy(() => import('./pages/SupplierManagement'));
const MarketplaceIntegration = lazy(() => import('./pages/MarketplaceIntegration'));
const FinancialDashboard = lazy(() => import('./pages/FinancialDashboard'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));
const MercadoLivreTab = lazy(() => import('./pages/MercadoLivreTab'));
const MercadoLivreCallback = lazy(() => import('./pages/MercadoLivreCallback'));
const PriceCalculator = lazy(() => import('./pages/PriceCalculator'));
const PrescriptionManager = lazy(() => import('./pages/PrescriptionManager'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const FinanceModule = lazy(() => import('./pages/FinanceModule'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const BugReports = lazy(() => import('./pages/BugReports'));

// ✅ Eager loading para páginas leves (sempre carregadas)
import Settings from './pages/Settings';
import UserSettings from './pages/UserSettings';
import Login from './pages/Login';
import LogoZenith from './components/LogoZenith';
import SimulationBanner from './components/SimulationBanner';
import EnsureDefaultUsers from './components/EnsureDefaultUsers';
import ResetProductionDatabase from './components/ResetProductionDatabase';
import ErrorBoundary from './components/ErrorBoundary';
import { DataContext } from './context/DataContext';
import { useAuth } from './context/AuthContextAPI';
import { useSimulation } from './context/SimulationContext';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

// ✅ Loading component para Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-aureon-bg">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-aureon-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-aureon-text/70">Carregando módulo...</p>
    </div>
  </div>
);

// ✅ Helper para envolver componentes lazy com Suspense
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// ===== ESTRUTURA POR PERFIL DE USUÁRIO =====
const perfisPorUsuario = {
  ceo: {
    nome: 'CEO',
    icon: Award,
    cor: '#D4AF37',
    tabs: [
      { id: 'dashboard', label: '📊 Visão Geral', icon: LayoutDashboard, component: withSuspense(UnifiedDashboard) },
      { id: 'finance', label: '💰 Contas & Bancos', icon: Briefcase, component: withSuspense(FinanceModule) },
      { id: 'financial-dashboard', label: '📈 Relatórios Financeiros', icon: BarChart3, component: withSuspense(FinancialDashboard) },
      { id: 'reports', label: '📈 Relatórios Executivos', icon: BarChart3, component: withSuspense(Reports) },
      { id: 'marketplace', label: '🛒 Marketplaces', icon: ShoppingBag, component: withSuspense(MarketplaceIntegration) },
      { id: 'crm', label: '👥 Clientes & Rede', icon: Users, component: withSuspense(UnifiedCRM) },
      { id: 'prescriptions', label: '👁️ Receitas Médicas', icon: Eye, component: withSuspense(PrescriptionManager) },
      { id: 'user-management', label: '👥 Usuários', icon: Users, component: withSuspense(UserManagement) },
      { id: 'bug-reports', label: '🐛 Bug Reports', icon: Shield, component: withSuspense(BugReports) },
      { id: 'audit-log', label: '🔒 Audit Log', icon: Shield, component: withSuspense(AuditLog) },
      { id: 'settings', label: '⚙️ Configurações', icon: SettingsIcon, component: <Settings /> },
      { id: 'user-settings', label: '👤 Minhas Preferências', icon: SettingsIcon, component: <UserSettings /> },
    ]
  },
  estoque: {
    nome: 'Estoque',
    icon: Package,
    cor: '#10B981',
    tabs: [
      { id: 'inventory', label: '📦 Produtos', icon: Package, component: withSuspense(UnifiedInventory) },
      { id: 'stock-movements', label: '🔄 Movimentações', icon: ArrowRightLeft, component: withSuspense(StockMovements) },
      { id: 'reports-estoque', label: '📊 Relatório Estoque', icon: BarChart3, component: withSuspense(Reports) },
      { id: 'settings-estoque', label: '⚙️ Configurações', icon: SettingsIcon, component: <Settings /> },
      { id: 'user-settings', label: '👤 Minhas Preferências', icon: SettingsIcon, component: <UserSettings /> },
    ]
  },
  compras: {
    nome: 'Compras',
    icon: ShoppingBag,
    cor: '#3B82F6',
    tabs: [
      { id: 'purchase-center', label: '🛒 Central de Compras', icon: ShoppingBag, component: withSuspense(PurchaseCenter) },
      { id: 'supplier-management', label: '📊 Gestão de Fornecedores', icon: Users, component: withSuspense(SupplierManagement) },
      { id: 'inventory-view', label: '📦 Visualizar Estoque', icon: Package, component: withSuspense(UnifiedInventory) },
      { id: 'settings-compras', label: '⚙️ Configurações', icon: SettingsIcon, component: <Settings /> },
      { id: 'user-settings', label: '👤 Minhas Preferências', icon: SettingsIcon, component: <UserSettings /> },
    ]
  },
  vendas: {
    nome: 'Vendas',
    icon: ShoppingCart,
    cor: '#F59E0B',
    tabs: [
      { id: 'sales', label: '💳 PDV & Vendas', icon: ShoppingCart, component: withSuspense(Sales) },
      { id: 'crm-vendas', label: '👥 Clientes', icon: Users, component: withSuspense(UnifiedCRM) },
      { id: 'prescriptions', label: '👁️ Receitas Médicas', icon: Eye, component: withSuspense(PrescriptionManager) },
      { id: 'mercado-livre', label: '🔗 Mercado Livre', icon: LinkIcon, component: withSuspense(MercadoLivreTab) },
      { id: 'price-calculator', label: '💰 Calculadora', icon: TrendingUp, component: withSuspense(PriceCalculator) },
      { id: 'settings-vendas', label: '⚙️ Configurações', icon: SettingsIcon, component: <Settings /> },
      { id: 'user-settings', label: '👤 Minhas Preferências', icon: SettingsIcon, component: <UserSettings /> },
    ]
  },
  financeiro: {
    nome: 'Financeiro',
    icon: Briefcase,
    cor: '#8B5CF6',
    tabs: [
      { id: 'finance', label: '💰 Contas & Bancos', icon: Briefcase, component: withSuspense(FinanceModule) },
      { id: 'financial-dashboard', label: '📈 Relatórios Financeiros', icon: BarChart3, component: withSuspense(FinancialDashboard) },
      { id: 'reports-finance', label: '📊 Relatórios', icon: BarChart3, component: withSuspense(Reports) },
      { id: 'settings-finance', label: '⚙️ Configurações', icon: SettingsIcon, component: <Settings /> },
      { id: 'user-settings', label: '👤 Minhas Preferências', icon: SettingsIcon, component: <UserSettings /> },
    ]
  },
  admin: {
    nome: 'Administrador',
    icon: Shield,
    cor: '#DC2626',
    tabs: [
      { id: 'dashboard', label: '📊 Dashboard', icon: LayoutDashboard, component: <UnifiedDashboard /> },
      { id: 'marketplace-admin', label: '🛒 Marketplaces', icon: ShoppingBag, component: <MarketplaceIntegration /> },
      { id: 'financial-dashboard-admin', label: '📈 Dashboard Financeiro', icon: BarChart3, component: <FinancialDashboard /> },
      { id: 'supplier-management-admin', label: '📊 Gestão de Fornecedores', icon: Users, component: <SupplierManagement /> },
      { id: 'audit-log-admin', label: '🔒 Audit Log', icon: Shield, component: <AuditLog /> },
      { id: 'settings-admin', label: '⚙️ Configurações', icon: SettingsIcon, component: <Settings /> },
      { id: 'user-settings', label: '👤 Minhas Preferências', icon: SettingsIcon, component: <UserSettings /> },
    ]
  },
  gerente: {
    nome: 'Gerente',
    icon: Award,
    cor: '#0891B2',
    tabs: [
      { id: 'dashboard-gerente', label: '📊 Dashboard', icon: LayoutDashboard, component: <UnifiedDashboard /> },
      { id: 'financial-dashboard-gerente', label: '📈 Dashboard Financeiro', icon: BarChart3, component: <FinancialDashboard /> },
      { id: 'supplier-management-gerente', label: '📊 Gestão de Fornecedores', icon: Users, component: <SupplierManagement /> },
      { id: 'inventory-gerente', label: '📦 Estoque', icon: Package, component: <ErrorBoundary showDetails={import.meta.env.DEV}><UnifiedInventory /></ErrorBoundary> },
      { id: 'reports-gerente', label: '📈 Relatórios', icon: BarChart3, component: <Reports /> },
      { id: 'settings-gerente', label: '⚙️ Configurações', icon: SettingsIcon, component: <Settings /> },
      { id: 'user-settings', label: '👤 Minhas Preferências', icon: SettingsIcon, component: <UserSettings /> },
    ]
  }
};

// Navegação rápida universal (sempre disponível)
const acessoRapido = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Vendas', icon: ShoppingCart },
  { id: 'inventory', label: 'Estoque', icon: Package },
  { id: 'purchase-center', label: 'Compras', icon: ShoppingBag },
];

// ========== COMPONENTE PRINCIPAL - APP ==========
export default function App() {
  const { currentUser, logout, getCurrentRole } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false);
  const [modoSimplificado, setModoSimplificado] = useState(false); // Toggle navegação simplificada

  // ✅ Atalhos de teclado (SEMPRE chamar hooks antes de early returns)
  useKeyboardShortcuts({
    'Ctrl+B': () => setSidebarOpen(!sidebarOpen),
    'Ctrl+1': () => setActiveTab(0),
    'Ctrl+2': () => setActiveTab(1),
    'Ctrl+3': () => setActiveTab(2),
    'Ctrl+4': () => setActiveTab(3),
    'Ctrl+P': () => setModoSimplificado(!modoSimplificado),
    'Ctrl+/': () => setMostrarAtalhos(!mostrarAtalhos),
  });

  // ✅ RBAC: Verificar autenticação
  if (!currentUser) {
    return <Login />;
  }

  // Verificar se é callback do Mercado Livre
  if (window.location.pathname === '/mercado-livre/callback') {
    return <MercadoLivreCallback />;
  }

  // ✅ RBAC: Usar role do usuário autenticado
  const perfilAtivo = currentUser.role.toLowerCase();
  const perfilSelecionado = perfisPorUsuario[perfilAtivo];
  const tabsAtivas = perfilSelecionado?.tabs || [];
  const roleData = getCurrentRole();

  // ✅ Fallback se roleData não estiver disponível
  if (!roleData) {
    if (import.meta.env.DEV) {
      console.warn('[App] Role data not found for user, redirecting to login:', currentUser);
    }
    return <Login />;
  }

  // ✅ Garantir que activeTab está dentro do range válido
  const validActiveTab = Math.min(activeTab, tabsAtivas.length - 1);
  if (activeTab !== validActiveTab && validActiveTab >= 0) {
    setActiveTab(validActiveTab);
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', display: 'flex', background: 'var(--color-background)' }}>
      {/* ✅ Garantir usuários padrão no localStorage */}
      <EnsureDefaultUsers />
      
      {/* ✅ Resetar banco de produção (manter apenas simulação) */}
      <ResetProductionDatabase />
      
      {/* ✅ SIMULATION BANNER (Topo Fixo) */}
      <SimulationBanner />
      
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 280 : 70,
        minWidth: sidebarOpen ? 280 : 70,
        background: 'var(--aureon-sidebar)',
        borderRight: '2px solid var(--color-primary)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: sidebarOpen ? '2px 0 16px rgba(0,0,0,0.1)' : '2px 0 8px rgba(0,0,0,0.05)'
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 16px',
          textAlign: 'center',
          borderBottom: '1px solid var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
        }}>
          <LogoZenith size={80} />
          {sidebarOpen && <span style={{ fontSize: 16, fontWeight: '700', color: 'var(--color-primary)', fontFamily: 'Cinzel, serif', letterSpacing: '0.1em' }}>AUREON</span>}
        </div>

        {/* ✅ RBAC: Informações do Usuário */}
        {sidebarOpen && (
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ 
              background: roleData.cor + '20',
              border: `1px solid ${roleData.cor}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ 
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: roleData.cor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-background)',
                  fontSize: 14
                }}>
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 'bold', color: '#F7FAFC', margin: 0 }}>
                    {currentUser.username}
                  </p>
                  <p style={{ fontSize: 10, color: roleData.cor, margin: 0 }}>
                    {roleData.nome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Deseja realmente sair?')) {
                    logout();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${roleData.cor}40`,
                  borderRadius: '6px',
                  color: roleData.cor,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.3s',
                  hover: { background: roleData.cor + '20' }
                }}
                onMouseEnter={(e) => e.target.style.background = roleData.cor + '20'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
            <p style={{ fontSize: 10, color: '#CBD5E0', textAlign: 'center' }}>
              🔒 Sessão protegida com RBAC
            </p>
          </div>
        )}

        {/* Navigation Menu */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '16px 0' }}>
          {sidebarOpen && (
            <p style={{ fontSize: 11, color: '#A0AEC0', padding: '0 16px', marginBottom: 8, textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>
              {perfilSelecionado.nome}
            </p>
          )}
          {tabsAtivas.map((tab, idx) => {
            const IconComponent = tab.icon;
            const isActive = validActiveTab === idx;
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                title={tab.label}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: isActive ? `${primaryColor}33` : 'transparent',
                  color: isActive ? 'var(--color-primary)' : '#E2E8F0',
                  border: 'none',
                  borderLeft: isActive ? `3px solid var(--color-primary)` : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: 13,
                  textAlign: 'left',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.background = `${primaryColor}1a`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#E2E8F0';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <IconComponent size={18} strokeWidth={2} />
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 10,
          color: '#A0AEC0',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontWeight: '500' }}>AUREON ERP v1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-background)' }}>
        {/* Top Bar */}
        <header style={{
          background: 'var(--aureon-header)',
          color: '#F7FAFC',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: 20,
                cursor: 'pointer'
              }}
            >
              ☰
            </button>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: '700', color: 'var(--color-primary)', fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}>
              {tabsAtivas[activeTab]?.label}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              background: perfilSelecionado.cor + '20', 
              border: `1px solid ${perfilSelecionado.cor}`, 
              padding: '6px 12px', 
              borderRadius: '8px',
              fontSize: 11,
              fontWeight: 'bold',
              color: perfilSelecionado.cor
            }}>
              {perfilSelecionado.nome.toUpperCase()}
            </div>
            <div style={{ color: '#CBD5E0', fontSize: 12 }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--color-background)'
        }}>
          {tabsAtivas[validActiveTab]?.component || <div className="text-center p-8" style={{ color: 'var(--color-text)' }}>Carregando...</div>}
        </main>

        {/* Footer */}
        <footer style={{
          background: 'var(--aureon-footer)',
          color: '#CBD5E0',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <p style={{ margin: 0 }}>© 2024 AUREON ERP - Todos os direitos reservados | v1.0.0</p>
          <button
            onClick={() => setMostrarAtalhos(!mostrarAtalhos)}
            style={{ background: 'transparent', border: '1px solid var(--color-text-secondary)', color: 'var(--color-text-secondary)', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10, transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
              e.target.style.color = 'var(--color-primary)';
              e.target.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary');
              e.target.style.color = textSecondary;
              e.target.style.borderColor = textSecondary;
            }}
          >
            ⌨️ Atalhos (Ctrl+/)
          </button>
        </footer>
      </div>

      {/* Modal de Atalhos */}
      {mostrarAtalhos && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setMostrarAtalhos(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              border: '2px solid var(--color-primary)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 20px 40px rgba(212, 175, 55, 0.3)',
              animation: 'slideUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: 'var(--color-primary)', marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⌨️ Atalhos de Teclado
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ marginBottom: 12, padding: 12, background: perfilSelecionado.cor + '20', borderRadius: 8, border: `1px solid ${perfilSelecionado.cor}` }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: perfilSelecionado.cor }}>
                  Perfil Ativo: {perfilSelecionado.nome}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {tabsAtivas.length} módulos disponíveis
                </p>
              </div>
              {[
                { tecla: 'Ctrl + B', acao: 'Alternar sidebar' },
                { tecla: 'Ctrl + 1-4', acao: 'Navegar entre módulos' },
                { tecla: 'Ctrl + P', acao: 'Alternar modo simplificado' },
                { tecla: 'Ctrl + /', acao: 'Mostrar/ocultar atalhos' },
                { tecla: 'Esc', acao: 'Fechar modais' },
              ].map((atalho, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    background: 'var(--color-surface)',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span style={{ color: 'var(--color-text)', fontSize: 14 }}>{atalho.acao}</span>
                  <code style={{ background: 'var(--color-primary)', opacity: 0.2, color: 'var(--color-primary)', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>
                    {atalho.tecla}
                  </code>
                </div>
              ))}
            </div>
            <button
              onClick={() => setMostrarAtalhos(false)}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--color-primary)';
                e.target.style.color = 'var(--color-background)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--color-primary)';
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}