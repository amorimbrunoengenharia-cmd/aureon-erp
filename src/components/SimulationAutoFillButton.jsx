import React from 'react';
import { Sparkles } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { autoFillForm } from '../services/SimulationSeederService';

/**
 * SIMULATION AUTO-FILL BUTTON
 * Botão que aparece APENAS em Modo Simulação
 * Preenche formulários automaticamente com dados sintéticos da IA
 * 
 * @param {string} formType - Tipo do formulário ('produto', 'fornecedor', 'cliente', 'item_fornecedor')
 * @param {function} onFill - Callback que recebe os dados gerados
 */
export default function SimulationAutoFillButton({ formType, onFill }) {
  const { isSimulationMode } = useSimulation();

  // Não renderizar se modo simulação estiver OFF
  if (!isSimulationMode) return null;

  const handleAutoFill = () => {
    try {
      const data = autoFillForm(formType);
      onFill(data);
      console.log(`✨ [AI AUTO-FILL] Formulário ${formType} preenchido automaticamente`);
    } catch (error) {
      console.error('❌ [AI AUTO-FILL] Erro ao preencher formulário:', error);
      alert(`Erro ao preencher formulário: ${error.message}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAutoFill}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
      title="Preencher automaticamente com IA (Modo Simulação)"
    >
      <Sparkles size={18} className="animate-pulse" />
      <span>Auto-Fill AI</span>
    </button>
  );
}
