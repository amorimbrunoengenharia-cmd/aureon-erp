import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, User, TrendingUp, Package, ShoppingCart, Eye, EyeOff, AlertCircle, CheckCircle, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContextAPI';

/**
 * USER SETTINGS - Configurações por Perfil
 * Cada role tem suas próprias configurações específicas
 */
export default function UserSettings() {
  const { getUserSettings, updateUserSettings, getCurrentRole, currentUser, addAuditLog } = useAuth();
  const [settings, setSettings] = useState(() => getUserSettings() || {});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  const role = getCurrentRole() || {};

  useEffect(() => {
    const userSettings = getUserSettings();
    if (userSettings) {
      setSettings(userSettings);
    }
  }, [getUserSettings]);

  const handleSave = () => {
    try {
      // Validações com safe access
      if (role?.id === 'CEO' && settings?.metaCrescimento && (settings.metaCrescimento < 0 || settings.metaCrescimento > 100)) {
        setError('Meta de crescimento deve estar entre 0% e 100%');
        return;
      }

      if (role?.id === 'COMPRAS') {
        if (settings?.diasSeguranca && (settings.diasSeguranca < 1 || settings.diasSeguranca > 30)) {
          setError('Dias de segurança deve estar entre 1 e 30');
          return;
        }
        if (settings.leadTimePadrao < 1 || settings.leadTimePadrao > 90) {
          setError('Lead time padrão deve estar entre 1 e 90 dias');
          return;
        }
      }

      if (role.id === 'VENDAS' && settings.metaPessoal < 0) {
        setError('Meta pessoal deve ser positiva');
        return;
      }

      updateUserSettings(settings);
      setSaved(true);
      setError('');
      
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderCEOSettings = () => (
    <div className="space-y-6">
      <div className="bg-aureon-gold/10 border border-aureon-gold/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={24} className="text-aureon-gold" />
          <h3 className="text-xl font-bold text-aureon-gold">Estratégia de Crescimento</h3>
        </div>

        {/* Meta de Crescimento */}
        <div className="mb-6">
          <label className="block text-aureon-text mb-2 font-semibold">
            Meta de Crescimento Global (%)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.metaCrescimento || 20}
              onChange={(e) => setSettings({ ...settings, metaCrescimento: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-aureon-bg rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--aureon-gold) 0%, var(--aureon-gold) ${settings.metaCrescimento || 20}%, var(--aureon-bg) ${settings.metaCrescimento || 20}%, var(--aureon-bg) 100%)`
              }}
            />
            <span className="text-3xl font-bold text-aureon-gold w-24 text-right">
              {settings.metaCrescimento || 20}%
            </span>
          </div>
          <p className="text-xs text-aureon-text/50 mt-2">
            Esta meta afeta o algoritmo de reposição. Maior crescimento = maior estoque sugerido.
          </p>
        </div>

        {/* Visualizar Audit Log */}
        <div className="flex items-center justify-between p-4 bg-aureon-bg border border-aureon-gold/20 rounded-lg">
          <div>
            <p className="text-aureon-text font-semibold">Acesso ao Audit Log</p>
            <p className="text-xs text-aureon-text/50">Rastreamento de alterações críticas</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.auditView !== false}
              onChange={(e) => setSettings({ ...settings, auditView: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-aureon-gold">
              {settings.auditView !== false ? 'Ativo' : 'Desativado'}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
        <h4 className="text-lg font-bold text-aureon-text mb-4">Alertas Executivos</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-aureon-bg rounded-lg cursor-pointer">
            <span className="text-aureon-text">Alertas Críticos (Estoque Zero)</span>
            <input
              type="checkbox"
              checked={settings.alertasCriticos !== false}
              onChange={(e) => setSettings({ ...settings, alertasCriticos: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderEstoqueSettings = () => (
    <div className="space-y-6">
      <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Package size={24} className="text-green-400" />
          <h3 className="text-xl font-bold text-green-400">Visualização de Estoque</h3>
        </div>

        {/* Toggle Ocultar Valores */}
        <div className="mb-6 p-4 bg-aureon-bg border border-green-400/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {settings.ocultarValores ? (
                <EyeOff size={20} className="text-orange-400" />
              ) : (
                <Eye size={20} className="text-green-400" />
              )}
              <div>
                <p className="text-aureon-text font-semibold">Ocultar Valores Monetários</p>
                <p className="text-xs text-aureon-text/50">Esconde custos e margens de lucro na grid</p>
              </div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, ocultarValores: !settings.ocultarValores })}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                settings.ocultarValores
                  ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30'
                  : 'bg-green-400/20 text-green-400 border border-green-400/30'
              }`}
            >
              {settings.ocultarValores ? 'OCULTO' : 'VISÍVEL'}
            </button>
          </div>
        </div>

        {/* Alertas de Estoque */}
        <div>
          <label className="block text-aureon-text mb-2 font-semibold">
            Alerta de Estoque Mínimo
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.alertaEstoqueMinimo || 5}
            onChange={(e) => setSettings({ ...settings, alertaEstoqueMinimo: parseInt(e.target.value) })}
            className="w-full bg-aureon-bg border border-green-400/30 rounded-lg px-4 py-3 text-aureon-text focus:outline-none focus:border-green-400"
          />
          <p className="text-xs text-aureon-text/50 mt-2">
            Notificar quando estoque &lt; {settings.alertaEstoqueMinimo || 5} unidades
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-aureon-text mb-2 font-semibold">
            Alerta de Estoque Crítico
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={settings.alertaEstoqueCritico || 0}
            onChange={(e) => setSettings({ ...settings, alertaEstoqueCritico: parseInt(e.target.value) })}
            className="w-full bg-aureon-bg border border-green-400/30 rounded-lg px-4 py-3 text-aureon-text focus:outline-none focus:border-green-400"
          />
          <p className="text-xs text-aureon-text/50 mt-2">
            Alerta vermelho quando estoque = {settings.alertaEstoqueCritico || 0}
          </p>
        </div>
      </div>

      {/* Notificações */}
      <div className="bg-aureon-surface border border-green-400/20 rounded-xl p-6">
        <h4 className="text-lg font-bold text-aureon-text mb-4">Notificações</h4>
        <label className="flex items-center justify-between p-3 bg-aureon-bg rounded-lg cursor-pointer">
          <span className="text-aureon-text">Notificações Ativas</span>
          <input
            type="checkbox"
            checked={settings.notificacoesAtivas !== false}
            onChange={(e) => setSettings({ ...settings, notificacoesAtivas: e.target.checked })}
            className="w-5 h-5"
          />
        </label>
      </div>
    </div>
  );

  const renderComprasSettings = () => (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingCart size={24} className="text-blue-400" />
          <h3 className="text-xl font-bold text-blue-400">Algoritmo de Reposição</h3>
        </div>

        {/* Dias de Segurança */}
        <div className="mb-6">
          <label className="block text-aureon-text mb-2 font-semibold">
            Dias de Segurança (Safety Stock)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={settings.diasSeguranca || 3}
              onChange={(e) => setSettings({ ...settings, diasSeguranca: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-aureon-bg rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-3xl font-bold text-blue-400 w-24 text-right">
              {settings.diasSeguranca || 3} dias
            </span>
          </div>
          <p className="text-xs text-aureon-text/50 mt-2">
            Margem de segurança para proteger contra variações de demanda e atrasos.
          </p>
        </div>

        {/* Lead Time Padrão */}
        <div className="mb-6">
          <label className="block text-aureon-text mb-2 font-semibold">
            Lead Time Padrão (Novos Fornecedores)
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={settings.leadTimePadrao || 7}
            onChange={(e) => setSettings({ ...settings, leadTimePadrao: parseInt(e.target.value) })}
            className="w-full bg-aureon-bg border border-blue-400/30 rounded-lg px-4 py-3 text-aureon-text focus:outline-none focus:border-blue-400"
          />
          <p className="text-xs text-aureon-text/50 mt-2">
            Tempo padrão de entrega para fornecedores sem histórico (em dias)
          </p>
        </div>

        {/* Exibir Fórmulas */}
        <div className="flex items-center justify-between p-4 bg-aureon-bg border border-blue-400/20 rounded-lg">
          <div>
            <p className="text-aureon-text font-semibold">Exibir Fórmulas do Algoritmo</p>
            <p className="text-xs text-aureon-text/50">Mostra o cálculo passo a passo</p>
          </div>
          <input
            type="checkbox"
            checked={settings.exibirFormulas !== false}
            onChange={(e) => setSettings({ ...settings, exibirFormulas: e.target.checked })}
            className="w-5 h-5"
          />
        </div>
      </div>

      {/* Alertas */}
      <div className="bg-aureon-surface border border-blue-400/20 rounded-xl p-6">
        <h4 className="text-lg font-bold text-aureon-text mb-4">Alertas de Reposição</h4>
        <label className="flex items-center justify-between p-3 bg-aureon-bg rounded-lg cursor-pointer">
          <span className="text-aureon-text">Alertas de Reposição Ativos</span>
          <input
            type="checkbox"
            checked={settings.alertasReposicao !== false}
            onChange={(e) => setSettings({ ...settings, alertasReposicao: e.target.checked })}
            className="w-5 h-5"
          />
        </label>
      </div>
    </div>
  );

  const renderVendasSettings = () => (
    <div className="space-y-6">
      <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target size={24} className="text-orange-400" />
          <h3 className="text-xl font-bold text-orange-400">Meta Pessoal</h3>
        </div>

        {/* Meta Pessoal */}
        <div className="mb-6">
          <label className="block text-aureon-text mb-2 font-semibold">
            Meta de Vendas Pessoal (R$)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={settings.metaPessoal || 15000}
            onChange={(e) => setSettings({ ...settings, metaPessoal: parseFloat(e.target.value) })}
            className="w-full bg-aureon-bg border border-orange-400/30 rounded-lg px-4 py-3 text-aureon-text text-2xl font-bold focus:outline-none focus:border-orange-400"
          />
          <p className="text-xs text-aureon-text/50 mt-2">
            Sua meta mensal de vendas (usado no dashboard de progresso)
          </p>
        </div>

        {/* Exibir Progresso */}
        <div className="flex items-center justify-between p-4 bg-aureon-bg border border-orange-400/20 rounded-lg mb-4">
          <div>
            <p className="text-aureon-text font-semibold">Exibir Barra de Progresso</p>
            <p className="text-xs text-aureon-text/50">Mostrar progresso vs meta no dashboard</p>
          </div>
          <input
            type="checkbox"
            checked={settings.exibirProgressoMeta !== false}
            onChange={(e) => setSettings({ ...settings, exibirProgressoMeta: e.target.checked })}
            className="w-5 h-5"
          />
        </div>

        {/* Canais Preferidos */}
        <div>
          <label className="block text-aureon-text mb-2 font-semibold">
            Canais de Venda Preferidos
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Instagram', 'WhatsApp', 'Mercado Livre', 'Shopee', 'Amazon', 'Shein'].map(canal => (
              <label key={canal} className="flex items-center gap-2 p-2 bg-aureon-bg rounded cursor-pointer hover:bg-aureon-bg/50">
                <input
                  type="checkbox"
                  checked={settings.canaisPreferidos?.includes(canal)}
                  onChange={(e) => {
                    const canais = settings.canaisPreferidos || [];
                    if (e.target.checked) {
                      setSettings({ ...settings, canaisPreferidos: [...canais, canal] });
                    } else {
                      setSettings({ ...settings, canaisPreferidos: canais.filter(c => c !== canal) });
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-aureon-text">{canal}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Notificações */}
      <div className="bg-aureon-surface border border-orange-400/20 rounded-xl p-6">
        <h4 className="text-lg font-bold text-aureon-text mb-4">Notificações</h4>
        <label className="flex items-center justify-between p-3 bg-aureon-bg rounded-lg cursor-pointer">
          <span className="text-aureon-text">Notificações de Clientes</span>
          <input
            type="checkbox"
            checked={settings.notificacoesClientes !== false}
            onChange={(e) => setSettings({ ...settings, notificacoesClientes: e.target.checked })}
            className="w-5 h-5"
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg via-aureon-surface to-aureon-bg text-aureon-text p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif text-aureon-gold mb-2 flex items-center gap-3">
                <SettingsIcon size={36} />
                Configurações do Perfil
              </h1>
              <p className="text-aureon-text/70">
                Personalize suas preferências - Perfil: <span className="font-bold" style={{ color: role.cor }}>{role.nome}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-aureon-text/50">Logado como</p>
              <p className="text-lg font-bold text-aureon-gold">{currentUser.username}</p>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={24} className="text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {saved && (
          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle size={24} className="text-green-400" />
            <span className="text-green-400">Configurações salvas com sucesso!</span>
          </div>
        )}

        {/* Configurações por Perfil */}
        {role.id === 'CEO' && renderCEOSettings()}
        {role.id === 'ESTOQUE' && renderEstoqueSettings()}
        {role.id === 'COMPRAS' && renderComprasSettings()}
        {role.id === 'VENDAS' && renderVendasSettings()}

        {/* Botão Salvar */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-aureon-gold to-aureon-gold-strong text-aureon-gold-contrast px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-aureon-gold/30 transition-all flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aureon-gold focus-visible:ring-offset-2 focus-visible:ring-offset-aureon-bg"
          >
            <Save size={24} />
            Salvar Configurações
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-aureon-surface border border-aureon-gold/20 rounded-lg">
          <p className="text-xs text-aureon-text/50 text-center">
            ℹ️ Suas configurações são salvas automaticamente no localStorage e afetam o comportamento do sistema
          </p>
        </div>
      </div>
    </div>
  );
}

