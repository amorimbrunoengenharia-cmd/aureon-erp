import { useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';

/**
 * Componente utilitário para limpar banco de produção e manter apenas simulação
 * Executa apenas uma vez quando o app carrega
 */
export default function ResetProductionDatabase() {
  const { isSimulationMode } = useSimulation();

  useEffect(() => {
    // Chaves do banco de PRODUÇÃO que devem ser limpas
    const productionKeys = [
      'aureon_produtos',
      'aureon_fornecedores',
      'aureon_clientes',
      'aureon_vendas',
      'aureon_movimentacoes',
      'aureon_despesas',
      'aureon_contasReceber',
      'aureon_contasBancarias',
      'aureon_lancamentosBancarios',
      'aureon_impostos',
      'aureon_fluxoCaixa',
      'aureon_dre'
    ];

    // Verificar se já existe flag de reset
    const resetDone = localStorage.getItem('aureon_production_reset_done');
    
    if (!resetDone) {
      // Limpar todos os dados de produção
      productionKeys.forEach(key => {
        const currentData = localStorage.getItem(key);
        if (currentData) {
          console.log(`🗑️ Limpando ${key} (${currentData.length} bytes)`);
        }
        localStorage.setItem(key, JSON.stringify([]));
      });

      // Inicializar arrays vazios
      const emptyCollections = {
        aureon_produtos: [],
        aureon_fornecedores: [],
        aureon_clientes: [],
        aureon_vendas: [],
        aureon_movimentacoes: [],
        aureon_despesas: [],
        aureon_contasReceber: [],
        aureon_contasBancarias: [],
        aureon_lancamentosBancarios: [],
        aureon_impostos: [],
        aureon_fluxoCaixa: [],
        aureon_dre: []
      };

      Object.entries(emptyCollections).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });

      // Marcar reset como concluído
      localStorage.setItem('aureon_production_reset_done', 'true');
      
      console.log('✅ Banco de produção resetado com sucesso');
      console.log('📊 Dados de simulação preservados (prefixo aureon_sim_*)');
      console.log('💾 Total de coleções limpas:', productionKeys.length);
    }
  }, []);

  return null; // Componente invisível
}
