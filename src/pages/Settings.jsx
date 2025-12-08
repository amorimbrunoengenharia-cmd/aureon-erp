import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, Palette, Sliders, CheckCircle, XCircle, Sun, Moon, Key, Link } from 'lucide-react';

/**
 * Configurações Unificadas
 * Inclui: Tema, Canais de Venda, Preferências Gerais, Integrações
 */
export default function Settings() {
  const { config, setConfig } = useContext(DataContext);
  const { currentTheme, changeTheme, themes } = useTheme();
  const [viewMode, setViewMode] = useState('theme'); // 'theme' | 'channels' | 'system' | 'integrations'
  const [mensagem, setMensagem] = useState('');
  const [systemConfig, setSystemConfig] = useState({
    notifications: config?.notifications ?? true,
    autoSave: config?.autoSave ?? true,
    compactView: config?.compactView ?? false,
    showTutorials: config?.showTutorials ?? true,
  });
  const [mercadoLivreClientId, setMercadoLivreClientId] = useState(localStorage.getItem('ml_client_id') || '');
  const [mercadoLivreClientSecret, setMercadoLivreClientSecret] = useState(localStorage.getItem('ml_client_secret') || '');

  // Canais disponíveis
  const canaisDisponiveis = [
    { id: 'mercado-livre', nome: 'Mercado Livre', cor: '#FFE600', icon: '🛒' },
    { id: 'amazon', nome: 'Amazon', cor: '#FF9900', icon: '📦' },
    { id: 'shopee', nome: 'Shopee', cor: '#EE4D2D', icon: '🛍️' },
    { id: 'shein', nome: 'Shein', cor: '#000000', icon: '👗' },
    { id: 'instagram', nome: 'Instagram', cor: '#E4405F', icon: '📱' },
    { id: 'whatsapp', nome: 'WhatsApp', cor: '#25D366', icon: '💬' },
    { id: 'loja-fisica', nome: 'Loja Física', cor: '#4ade80', icon: '🏪' },
    { id: 'site-proprio', nome: 'Site Próprio', cor: '#60a5fa', icon: '🌐' },
  ];

  const temaAtual = currentTheme.id;
  const canaisAtivos = config.canaisAtivos || ['mercado-livre', 'whatsapp', 'loja-fisica'];

  const mostrarMensagem = (texto) => {
    setMensagem(texto);
    setTimeout(() => setMensagem(''), 3000);
  };

  const handleChangeTheme = (themeId) => {
    changeTheme(themeId);
    mostrarMensagem('✅ Tema alterado com sucesso!');
  };

  const toggleCanal = (canalId) => {
    const novosCanais = canaisAtivos.includes(canalId)
      ? canaisAtivos.filter(id => id !== canalId)
      : [...canaisAtivos, canalId];

    setConfig({ ...config, canaisAtivos: novosCanais });
    mostrarMensagem('✅ Canais atualizados!');
  };

  const handleSystemConfigChange = (key) => {
    const newConfig = { ...systemConfig, [key]: !systemConfig[key] };
    setSystemConfig(newConfig);
    setConfig({ ...config, ...newConfig });
    mostrarMensagem('✅ Configuração salva!');
  };

  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      config: config,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aureon_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensagem('✅ Backup realizado com sucesso!');
  };

  const handleClearData = () => {
    if (window.confirm('⚠️ Tem certeza? Isso irá limpar TODOS os dados do sistema!')) {
      if (window.confirm('⚠️ ÚLTIMA CONFIRMAÇÃO: Todos os dados serão perdidos permanentemente!')) {
        localStorage.clear();
        mostrarMensagem('🗑️ Dados limpos! Recarregue a página.');
        setTimeout(() => window.location.reload(), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-aureon-gold mb-2 font-serif flex items-center gap-2">
          <SettingsIcon size={28} />
          Configurações
        </h1>
        <p className="text-aureon-text/70 text-sm mb-4">Personalize sua experiência</p>
        
        {/* Toggle entre seções */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('theme')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'theme'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'bg-aureon-surface text-aureon-text border border-aureon-gold/30 hover:border-aureon-gold'
            }`}
          >
            <Palette size={18} />
            Tema
          </button>
          <button
            onClick={() => setViewMode('channels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'channels'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'bg-aureon-surface text-aureon-text border border-aureon-gold/30 hover:border-aureon-gold'
            }`}
          >
            <Sliders size={18} />
            Canais
          </button>
          <button
            onClick={() => setViewMode('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'system'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'bg-aureon-surface text-aureon-text border border-aureon-gold/30 hover:border-aureon-gold'
            }`}
          >
            <SettingsIcon size={18} />
            Sistema
          </button>
          <button
            onClick={() => setViewMode('integrations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'integrations'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'bg-aureon-surface text-aureon-text border border-aureon-gold/30 hover:border-aureon-gold'
            }`}
          >
            <Link size={18} />
            Integrações
          </button>
        </div>
      </div>

      {/* Mensagem Feedback */}
      {mensagem && (
        <div className="mb-4 p-3 rounded-lg border bg-green-500/20 border-green-500 text-green-400">
          {mensagem}
        </div>
      )}

      {/* ========== VIEW: TEMA ========== */}
      {viewMode === 'theme' && (
        <div>
            <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 mb-4">
            <h3 className="text-lg font-semibold text-aureon-gold mb-4">Escolha o Tema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(themes).map(tema => (
                <div
                  key={tema.id}
                  onClick={() => handleChangeTheme(tema.id)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    temaAtual === tema.id
                      ? 'border-aureon-gold bg-aureon-gold/10'
                      : 'border-aureon-gold/20 hover:border-aureon-gold/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {tema.id === 'dark' ? (
                        <Moon size={24} className="text-aureon-gold" />
                      ) : (
                        <Sun size={24} className="text-blue-500" />
                      )}
                      <h4 className="text-aureon-text font-bold">{tema.name}</h4>
                    </div>
                    {temaAtual === tema.id && (
                      <CheckCircle size={24} className="text-green-400" />
                    )}
                  </div>
                  <p className="text-aureon-text/70 text-sm mb-4">
                    {tema.id === 'dark' ? 'Dourado e preto elegante' : 'Branco e azul clean'}
                  </p>
                  
                  {/* Preview de Cores */}
                  <div className="flex gap-2">
                    <div
                      className="w-12 h-12 rounded-lg border border-white/20"
                      style={{ backgroundColor: tema.colors.primary }}
                      title="Cor Primária"
                    />
                    <div
                      className="w-12 h-12 rounded-lg border border-white/20"
                      style={{ backgroundColor: tema.colors.secondary }}
                      title="Cor Secundária"
                    />
                    <div
                      className="w-12 h-12 rounded-lg border border-white/20"
                      style={{ backgroundColor: tema.colors.background }}
                      title="Cor de Fundo"
                    />
                    <div
                      className="w-12 h-12 rounded-lg border border-white/20"
                      style={{ backgroundColor: tema.colors.surface }}
                      title="Cor de Superfície"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-500/20 border border-green-500 rounded-xl p-4 text-green-300 text-sm">
            <strong>✅ Tema Dinâmico:</strong> As alterações são aplicadas automaticamente em tempo real!
          </div>
        </div>
      )}

      {/* ========== VIEW: CANAIS ========== */}
      {viewMode === 'channels' && (
        <div>
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 mb-4">
            <h3 className="text-lg font-semibold text-aureon-gold mb-2">Canais de Venda</h3>
            <p className="text-aureon-text/70 text-sm mb-4">
              Ative apenas os canais que você utiliza no seu negócio
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {canaisDisponiveis.map(canal => {
                const ativo = canaisAtivos.includes(canal.id);
                return (
                  <div
                    key={canal.id}
                    onClick={() => toggleCanal(canal.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      ativo
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-aureon-gold/20 bg-aureon-bg hover:border-aureon-gold/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{canal.icon}</span>
                        <div>
                          <h4 className="text-aureon-text font-semibold">{canal.nome}</h4>
                          <p className="text-aureon-text/50 text-xs">
                            {ativo ? 'Ativo' : 'Inativo'}
                          </p>
                        </div>
                      </div>
                      {ativo ? (
                        <CheckCircle size={24} className="text-green-400" />
                      ) : (
                        <XCircle size={24} className="text-aureon-muted" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <h4 className="text-aureon-gold font-semibold mb-3">Canais Ativos</h4>
            {canaisAtivos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {canaisAtivos.map(id => {
                  const canal = canaisDisponiveis.find(c => c.id === id);
                  return canal ? (
                    <span
                      key={id}
                      className="px-3 py-1 bg-green-500/20 border border-green-500 text-green-400 rounded-full text-sm font-semibold"
                    >
                      {canal.icon} {canal.nome}
                    </span>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-aureon-text/50 text-sm">Nenhum canal ativo</p>
            )}
          </div>
        </div>
      )}

      {/* ========== VIEW: SISTEMA ========== */}
      {viewMode === 'system' && (
        <div className="space-y-6">
          {/* Preferências do Sistema */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-aureon-gold mb-4">Preferências do Sistema</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-aureon-bg rounded-lg cursor-pointer hover:bg-aureon-surface transition-all border border-transparent hover:border-aureon-gold/20">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    systemConfig.notifications ? 'bg-aureon-gold border-aureon-gold' : 'border-aureon-text/30'
                  }`}>
                    {systemConfig.notifications && <CheckCircle size={14} className="text-aureon-bg" />}
                  </div>
                  <div>
                    <p className="text-aureon-text font-semibold">Notificações</p>
                    <p className="text-aureon-text/60 text-xs">Receber alertas do sistema</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={systemConfig.notifications}
                  onChange={() => handleSystemConfigChange('notifications')}
                  className="hidden"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-aureon-bg rounded-lg cursor-pointer hover:bg-aureon-surface transition-all border border-transparent hover:border-aureon-gold/20">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    systemConfig.autoSave ? 'bg-aureon-gold border-aureon-gold' : 'border-aureon-text/30'
                  }`}>
                    {systemConfig.autoSave && <CheckCircle size={14} className="text-aureon-bg" />}
                  </div>
                  <div>
                    <p className="text-aureon-text font-semibold">Salvamento Automático</p>
                    <p className="text-aureon-text/60 text-xs">Salvar alterações automaticamente</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={systemConfig.autoSave}
                  onChange={() => handleSystemConfigChange('autoSave')}
                  className="hidden"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-aureon-bg rounded-lg cursor-pointer hover:bg-aureon-surface transition-all border border-transparent hover:border-aureon-gold/20">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    systemConfig.compactView ? 'bg-aureon-gold border-aureon-gold' : 'border-aureon-text/30'
                  }`}>
                    {systemConfig.compactView && <CheckCircle size={14} className="text-aureon-bg" />}
                  </div>
                  <div>
                    <p className="text-aureon-text font-semibold">Visualização Compacta</p>
                    <p className="text-aureon-text/60 text-xs">Reduzir espaçamento entre elementos</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={systemConfig.compactView}
                  onChange={() => handleSystemConfigChange('compactView')}
                  className="hidden"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-aureon-bg rounded-lg cursor-pointer hover:bg-aureon-surface transition-all border border-transparent hover:border-aureon-gold/20">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    systemConfig.showTutorials ? 'bg-aureon-gold border-aureon-gold' : 'border-aureon-text/30'
                  }`}>
                    {systemConfig.showTutorials && <CheckCircle size={14} className="text-aureon-bg" />}
                  </div>
                  <div>
                    <p className="text-aureon-text font-semibold">Mostrar Tutoriais</p>
                    <p className="text-aureon-text/60 text-xs">Exibir dicas e tutoriais de uso</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={systemConfig.showTutorials}
                  onChange={() => handleSystemConfigChange('showTutorials')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Backup e Dados */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-aureon-gold mb-4">Backup e Dados</h3>
            <p className="text-aureon-text/70 text-sm mb-4">
              Gerencie seus dados e faça backup de suas informações
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleExportData}
                className="flex flex-col items-center gap-3 p-6 bg-aureon-bg border border-aureon-gold/30 rounded-lg hover:border-aureon-gold hover:bg-aureon-surface transition-all group"
              >
                <div className="w-12 h-12 bg-aureon-gold/20 rounded-full flex items-center justify-center group-hover:bg-aureon-gold/30 transition-all">
                  <span className="text-2xl">💾</span>
                </div>
                <div className="text-center">
                  <p className="text-aureon-text font-semibold mb-1">Fazer Backup</p>
                  <p className="text-aureon-text/60 text-xs">Exportar todos os dados</p>
                </div>
              </button>

              <button
                onClick={handleClearData}
                className="flex flex-col items-center gap-3 p-6 bg-aureon-bg border border-red-500/30 rounded-lg hover:border-red-500 hover:bg-red-500/5 transition-all group"
              >
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center group-hover:bg-red-500/30 transition-all">
                  <span className="text-2xl">🗑️</span>
                </div>
                <div className="text-center">
                  <p className="text-red-400 font-semibold mb-1">Limpar Dados</p>
                  <p className="text-aureon-text/60 text-xs">Apagar tudo permanentemente</p>
                </div>
              </button>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-aureon-gold mb-4">Informações do Sistema</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-aureon-text/10">
                <span className="text-aureon-text/70 text-sm">Versão</span>
                <span className="text-aureon-text font-semibold">1.0.0</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-aureon-text/10">
                <span className="text-aureon-text/70 text-sm">Desenvolvido</span>
                <span className="text-aureon-text font-semibold">Dezembro 2024</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-aureon-text/10">
                <span className="text-aureon-text/70 text-sm">Tecnologias</span>
                <span className="text-aureon-text font-semibold">React + Vite + TailwindCSS</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-aureon-text/10">
                <span className="text-aureon-text/70 text-sm">Armazenamento</span>
                <span className="text-aureon-text font-semibold">LocalStorage</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-aureon-text/70 text-sm">Última Atualização</span>
                <span className="text-aureon-text font-semibold">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Sobre */}
          <div className="bg-gradient-to-r from-[var(--aureon-gold)]/10 to-purple-500/10 border border-aureon-gold/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-aureon-gold mb-2">Sobre o AUREON ERP</h3>
            <p className="text-aureon-text/80 text-sm mb-4">
              Sistema completo de gestão empresarial com foco em óculos e acessórios. 
              Desenvolvido com as mais modernas tecnologias web para proporcionar uma 
              experiência rápida, intuitiva e eficiente.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-aureon-gold/20 rounded-full text-xs font-semibold text-aureon-gold">
                ERP
              </span>
              <span className="px-3 py-1 bg-purple-500/20 rounded-full text-xs font-semibold text-purple-400">
                IA Integrada
              </span>
              <span className="px-3 py-1 bg-blue-500/20 rounded-full text-xs font-semibold text-blue-400">
                Multi-Canal
              </span>
              <span className="px-3 py-1 bg-green-500/20 rounded-full text-xs font-semibold text-green-400">
                Analytics
              </span>
            </div>
            <p className="text-aureon-text/50 text-xs mt-4">
              © 2024 AUREON ERP - Todos os direitos reservados
            </p>
          </div>
        </div>
      )}

      {/* ========== VIEW: INTEGRAÇÕES ========== */}
      {viewMode === 'integrations' && (
        <div className="space-y-6">
          {/* Mercado Livre OAuth */}
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-aureon-gold flex items-center gap-2">
                  <Key size={20} />
                  Mercado Livre OAuth
                </h3>
                <p className="text-aureon-text/70 text-sm mt-1">
                  Sincronizar pedidos automaticamente (requer backend)
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                mercadoLivreClientId ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {mercadoLivreClientId ? '✅ Configurada' : '❌ Não configurada'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-aureon-text text-sm font-semibold mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={mercadoLivreClientId}
                  onChange={(e) => setMercadoLivreClientId(e.target.value)}
                  placeholder="Cole seu Client ID aqui"
                  className="w-full px-4 py-3 bg-aureon-bg border border-aureon-gold/30 rounded-lg text-aureon-text focus:border-aureon-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-aureon-text text-sm font-semibold mb-2">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={mercadoLivreClientSecret}
                  onChange={(e) => setMercadoLivreClientSecret(e.target.value)}
                  placeholder="Cole seu Client Secret aqui"
                  className="w-full px-4 py-3 bg-aureon-bg border border-aureon-gold/30 rounded-lg text-aureon-text focus:border-aureon-gold focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('ml_client_id', mercadoLivreClientId);
                  localStorage.setItem('ml_client_secret', mercadoLivreClientSecret);
                  mostrarMensagem('✅ Credenciais do ML salvas!');
                }}
                className="w-full px-4 py-3 bg-aureon-gold/20 border-2 border-aureon-gold rounded-lg text-aureon-gold font-semibold hover:bg-aureon-gold hover:text-aureon-bg transition-all"
              >
                Salvar Credenciais
              </button>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                  ⚠️ Backend Necessário
                </h4>
                <p className="text-aureon-text/80 text-sm mb-2">
                  Para o Mercado Livre funcionar, você precisa implementar um backend Node.js 
                  para gerenciar o fluxo OAuth 2.0.
                </p>
                <p className="text-aureon-text/60 text-xs">
                  📖 Consulte o arquivo <code className="bg-black/30 px-2 py-1 rounded">INTEGRACOES.md</code> na raiz do projeto
                </p>
              </div>

              <button
                onClick={() => window.open('https://developers.mercadolivre.com.br', '_blank')}
                className="w-full px-4 py-2 bg-aureon-bg border border-aureon-gold/30 rounded-lg text-aureon-text hover:border-aureon-gold transition-all"
              >
                🔗 Mercado Livre Developers
              </button>
            </div>
          </div>

          {/* Status das Integrações */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-4">Status das Integrações</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-aureon-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛍️</span>
                  <div>
                    <p className="text-aureon-text font-semibold">Mercado Livre</p>
                    <p className="text-aureon-text/60 text-xs">Sincronização automática de vendas, clientes, feedback e devoluções</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  mercadoLivreClientId ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {mercadoLivreClientId ? '🟢 Configurado' : '⚠️ Não configurado'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-aureon-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💱</span>
                  <div>
                    <p className="text-aureon-text font-semibold">Cotação USD/BRL</p>
                    <p className="text-aureon-text/60 text-xs">Taxa de câmbio para cálculo de importação</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                  🟢 Ativo
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

