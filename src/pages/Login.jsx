import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContextAPI';
import { useSimulation } from '../context/SimulationContext';
import LogoZenith from '../components/LogoZenith';

/**
 * Tela de Login com RBAC + Modo Simulação
 * Suporta 4 perfis: CEO, ESTOQUE, COMPRAS, VENDAS
 * ✅ Toggle de Simulação para testes E2E
 */
export default function Login() {
  const { login } = useAuth();
  const { isSimulationMode, activateSimulation, deactivateSimulation } = useSimulation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg via-aureon-surface to-aureon-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoZenith size={80} />
          </div>
          <h1 className="text-4xl font-serif text-aureon-gold mb-2">AUREON ERP</h1>
          <p className="text-aureon-text/70">Sistema de Gestão Empresarial</p>
        </div>

        {/* Card de Login */}
        <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-aureon-gold mb-6 text-center">Login</h2>

          {/* Erro */}
          {error && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-6 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* TOGGLE DE SIMULAÇÃO */}
          <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-400/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database size={20} className={isSimulationMode ? 'text-red-400' : 'text-aureon-text/50'} />
                <span className="text-aureon-text font-semibold">Modo Simulação (Sandbox)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isSimulationMode) {
                    deactivateSimulation();
                  } else {
                    activateSimulation();
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isSimulationMode ? 'bg-red-600' : 'bg-aureon-muted-surface'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSimulationMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-aureon-text/70">
              {isSimulationMode ? (
                <span className="text-red-400 font-semibold">🎭 ATIVO: Dados isolados do ambiente de produção</span>
              ) : (
                <span>❌ Desativado: Usando banco de produção</span>
              )}
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-aureon-text/70 text-sm mb-2">Usuário</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-aureon-gold/50" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="w-full bg-aureon-bg border border-aureon-gold/30 rounded-lg pl-10 pr-4 py-3 text-aureon-text placeholder-aureon-text/30 focus:outline-none focus:border-aureon-gold transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-aureon-text/70 text-sm mb-2">Senha</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-aureon-gold/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-aureon-bg border border-aureon-gold/30 rounded-lg pl-10 pr-12 py-3 text-aureon-text placeholder-aureon-text/30 focus:outline-none focus:border-aureon-gold transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-aureon-gold/50 hover:text-aureon-gold transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-aureon-bg font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-aureon-gold/20"></div>
            <span className="text-aureon-text/50 text-sm">Acesso Rápido (Demo)</span>
            <div className="flex-1 h-px bg-aureon-gold/20"></div>
          </div>

          {/* Botões de Acesso Rápido */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => quickLogin('admin', 'admin123')}
              className="bg-aureon-gold/10 border border-aureon-gold/30 rounded-lg p-3 hover:bg-aureon-gold/20 transition-colors group"
            >
              <div className="text-aureon-gold font-bold mb-1">👑 CEO</div>
              <div className="text-aureon-text/50 text-xs">Acesso Total</div>
            </button>

            <button
              onClick={() => quickLogin('estoque', 'estoque123')}
              className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 hover:bg-green-500/20 transition-colors group"
            >
              <div className="text-green-400 font-bold mb-1">📦 Estoque</div>
              <div className="text-aureon-text/50 text-xs">Operacional</div>
            </button>

            <button
              onClick={() => quickLogin('compras', 'compras123')}
              className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 hover:bg-blue-500/20 transition-colors group"
            >
              <div className="text-blue-400 font-bold mb-1">🛒 Compras</div>
              <div className="text-aureon-text/50 text-xs">Procurement</div>
            </button>

            <button
              onClick={() => quickLogin('vendedor', 'vendedor123')}
              className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 hover:bg-orange-500/20 transition-colors group"
            >
              <div className="text-orange-400 font-bold mb-1">💰 Vendas</div>
              <div className="text-aureon-text/50 text-xs">Sales</div>
            </button>

            <button
              onClick={() => quickLogin('financeiro', 'financeiro123')}
              className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-3 hover:bg-purple-500/20 transition-colors group col-span-2"
            >
              <div className="text-purple-400 font-bold mb-1">💼 Financeiro</div>
              <div className="text-aureon-text/50 text-xs">Gestão Financeira</div>
            </button>
          </div>

          {/* Info Adicional */}
          <div className="mt-6 pt-6 border-t border-aureon-gold/20">
            <p className="text-aureon-text/50 text-xs text-center">
              ⚠️ Modo Demo: Use os botões de acesso rápido para testar os perfis
            </p>
          </div>
        </div>

        {/* Legenda de Permissões */}
        <div className="mt-6 bg-aureon-surface/50 border border-aureon-gold/20 rounded-xl p-4">
          <h3 className="text-sm font-bold text-aureon-gold mb-3">Permissões por Perfil:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-aureon-gold">
              <strong>CEO:</strong> Acesso total + Audit Log
            </div>
            <div className="text-green-400">
              <strong>Estoque:</strong> Edit quantidade only
            </div>
            <div className="text-blue-400">
              <strong>Compras:</strong> Gerencia fornecedores
            </div>
            <div className="text-orange-400">
              <strong>Vendas:</strong> Readonly custos
            </div>
            <div className="text-purple-400 col-span-2">
              <strong>Financeiro:</strong> Gestão completa de despesas, recebíveis e contas bancárias
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

