import React, { useState } from 'react';
import { Database, Play, RotateCcw, Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { executarCenarioE2E, executarCenarioBulkLoad } from '../services/SimulationSeederService';

/**
 * SIMULATION CONTROL PANEL
 * Painel de controle para executar cenários de teste E2E
 * Visível apenas quando Modo Simulação está ativo
 */
export default function SimulationControlPanel() {
  const { 
    isSimulationMode, 
    getSimulationData, 
    resetSimulationDatabase, 
    exportSimulationData,
    simulationStats
  } = useSimulation();

  const dataContext = useContext(DataContext);
  
  const [loading, setLoading] = useState(false);
  const [lastScenario, setLastScenario] = useState(null);

  if (!isSimulationMode) return null;

  const handleRunE2E = async () => {
    setLoading(true);
    try {
      // ✅ Passar getPrefix do SimulationContext para o seeder
      const contextComPrefix = {
        ...dataContext,
        getPrefix: () => isSimulationMode ? 'aureon_sim_' : 'aureon_'
      };
      
      await executarCenarioE2E(contextComPrefix);
      setLastScenario('E2E Completo');
      
      // Aguardar dados serem salvos
      setTimeout(() => {
        alert('✅ Cenário E2E executado com sucesso!\n\n📊 Criado:\n- 5 fornecedores\n- 20 produtos\n- 10 clientes\n- 30 vendas\n\nVerifique o Dashboard CEO e Estoque!');
        window.location.reload(); // Recarregar para atualizar UI
      }, 2000);
    } catch (error) {
      console.error(error);
      alert(`❌ Erro ao executar cenário: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBulk = () => {
    setLoading(true);
    try {
      const quantidade = parseInt(prompt('Quantos registros de cada tipo deseja criar?', '10'));
      if (!quantidade || quantidade < 1) return;
      
      executarCenarioBulkLoad(dataContext, quantidade);
      setLastScenario(`Bulk Load (${quantidade} registros)`);
      alert(`✅ Carga de massa concluída!\n${quantidade} fornecedores, ${quantidade * 3} produtos e ${quantidade * 2} clientes criados.`);
    } catch (error) {
      console.error(error);
      alert(`❌ Erro ao executar bulk load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const stats = getSimulationData();

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-purple-500/30 rounded-xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database size={28} className="text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-purple-400">Simulation Control Panel</h2>
            <p className="text-sm text-purple-300/70">Cenários de teste automatizados com IA</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-purple-300/70">Status</div>
          <div className="flex items-center gap-2 text-green-400 font-bold">
            <CheckCircle size={16} />
            <span>Ativo</span>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-950/30 rounded-lg p-4">
          <div className="text-purple-300/70 text-xs mb-1">Produtos</div>
          <div className="text-2xl font-bold text-purple-400">{stats.produtos || 0}</div>
        </div>
        <div className="bg-purple-950/30 rounded-lg p-4">
          <div className="text-purple-300/70 text-xs mb-1">Fornecedores</div>
          <div className="text-2xl font-bold text-purple-400">{stats.fornecedores || 0}</div>
        </div>
        <div className="bg-purple-950/30 rounded-lg p-4">
          <div className="text-purple-300/70 text-xs mb-1">Vendas</div>
          <div className="text-2xl font-bold text-purple-400">{stats.vendas || 0}</div>
        </div>
        <div className="bg-purple-950/30 rounded-lg p-4">
          <div className="text-purple-300/70 text-xs mb-1">Clientes</div>
          <div className="text-2xl font-bold text-purple-400">{stats.clientes || 0}</div>
        </div>
      </div>

      {/* Cenários */}
      <div className="space-y-3 mb-6">
        <h3 className="text-lg font-bold text-purple-400 mb-3">🎬 Cenários Pré-Configurados</h3>
        
        {/* Cenário 1: E2E */}
        <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-bold text-purple-400">1. Fluxo E2E Completo</h4>
              <p className="text-xs text-purple-300/70 mt-1">
                Cria: Fornecedor → Item → Produto → Cliente → Venda (com baixa de estoque)
              </p>
            </div>
            <button
              onClick={handleRunE2E}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <Play size={16} />
              <span>Executar</span>
            </button>
          </div>
        </div>

        {/* Cenário 2: Bulk Load */}
        <div className="bg-purple-950/30 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-bold text-purple-400">2. Carga de Massa (Bulk Load)</h4>
              <p className="text-xs text-purple-300/70 mt-1">
                Popula banco com quantidade massiva de dados sintéticos
              </p>
            </div>
            <button
              onClick={handleRunBulk}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <Upload size={16} />
              <span>Executar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Informações do Último Cenário */}
      {lastScenario && (
        <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle size={16} />
            <span>Último cenário executado: <strong>{lastScenario}</strong></span>
          </div>
        </div>
      )}

      {/* Ações de Gerenciamento */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (window.confirm('⚠️ Resetar todos os dados de simulação?')) {
              resetSimulationDatabase();
              alert('✅ Banco de simulação resetado!');
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
        >
          <RotateCcw size={18} />
          <span>Reset Database</span>
        </button>

        <button
          onClick={() => {
            exportSimulationData();
            alert('💾 Dados exportados com sucesso!');
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Download size={18} />
          <span>Export Data</span>
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 p-3 bg-purple-950/30 border border-purple-500/20 rounded-lg">
        <div className="flex items-start gap-2 text-xs text-purple-300/70">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <p>
            <strong>Isolamento Garantido:</strong> Todos os dados são salvos em <span className="font-mono text-purple-400">aureon_sim_*</span> e não afetam o banco de produção.
          </p>
        </div>
      </div>
    </div>
  );
}
