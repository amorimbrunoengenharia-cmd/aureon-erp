import React from 'react';
import { AlertTriangle, Database, X, RotateCcw, Download } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

/**
 * SIMULATION MODE BANNER
 * Barra de alerta visual exibida em TODAS as telas quando modo simulação está ativo
 * 
 * FEATURES:
 * - Cor vermelha chamativa
 * - Sempre visível (fixed top)
 * - Botões de controle: Reset DB, Export Data, Deactivate
 * - Estatísticas em tempo real
 */
export default function SimulationBanner() {
  const {
    isSimulationMode,
    deactivateSimulation,
    resetSimulationDatabase,
    exportSimulationData,
    simulationStats
  } = useSimulation();

  // Não renderizar se modo simulação estiver OFF
  if (!isSimulationMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 border-b-4 border-red-800 shadow-2xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Lado Esquerdo: Alerta */}
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-white animate-pulse" />
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                🎭 MODO SIMULAÇÃO ATIVO
                <span className="text-xs bg-red-800 px-2 py-1 rounded">SANDBOX</span>
              </h3>
              <p className="text-red-100 text-xs">
                Todos os dados são temporários e isolados do banco de produção
              </p>
            </div>
          </div>

          {/* Centro: Estatísticas */}
          <div className="hidden md:flex items-center gap-6 text-white text-sm">
            <div className="flex items-center gap-2">
              <Database size={16} />
              <span>DB: <span className="font-mono font-bold">aureon_sim_*</span></span>
            </div>
            {simulationStats.operationsCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">{simulationStats.operationsCount}</span>
                <span className="text-red-100">operações</span>
              </div>
            )}
            {simulationStats.startTime && (
              <div className="text-xs text-red-100">
                Desde: {new Date(simulationStats.startTime).toLocaleTimeString('pt-BR')}
              </div>
            )}
          </div>

          {/* Lado Direito: Ações */}
          <div className="flex items-center gap-2">
            {/* Reset Database */}
            <button
              onClick={() => {
                if (window.confirm('⚠️ Resetar banco de simulação?\n\nTodos os dados de teste serão apagados.')) {
                  resetSimulationDatabase();
                  alert('✅ Banco de simulação resetado!');
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg text-sm font-semibold transition-colors"
              title="Resetar banco de simulação"
            >
              <RotateCcw size={16} />
              <span className="hidden lg:inline">Reset DB</span>
            </button>

            {/* Export Data */}
            <button
              onClick={() => {
                exportSimulationData();
                alert('💾 Dados de simulação exportados!');
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg text-sm font-semibold transition-colors"
              title="Exportar dados de simulação"
            >
              <Download size={16} />
              <span className="hidden lg:inline">Export</span>
            </button>

            {/* Deactivate */}
            <button
              onClick={() => {
                if (window.confirm('🔚 Desativar modo simulação?\n\nVocê retornará ao banco de produção.')) {
                  deactivateSimulation();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
              title="Desativar modo simulação"
            >
              <X size={16} />
              <span>Desativar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
