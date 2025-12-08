import React, { createContext, useState, useEffect, useContext } from 'react';

export const SimulationContext = createContext();

/**
 * SIMULATION MODE (SANDBOX) - Isolamento de Dados para Testes E2E
 * 
 * ARQUITETURA:
 * - Production DB: localStorage com prefixo 'aureon_*'
 * - Simulation DB: localStorage com prefixo 'aureon_sim_*'
 * 
 * COMPORTAMENTO:
 * - SimulationMode ON: Todos os Contexts usam 'aureon_sim_*'
 * - SimulationMode OFF: Todos os Contexts usam 'aureon_*'
 * 
 * REPLICAÇÃO:
 * - Ao ativar: Copia estrutura (schema) do banco real para simulado
 * - Dados de simulação são isolados e podem ser resetados
 */

// ===== PREFIXOS DE DATABASE =====
export const DB_PREFIX = {
  PRODUCTION: 'aureon_',
  SIMULATION: 'aureon_sim_'
};

// ===== TODAS AS TABELAS DO SISTEMA =====
export const TABLES = [
  'config',
  'produtos',
  'vendas',
  'despesas',
  'clientes',
  'fornecedores',
  'itensEstoque',
  'movimentacoes',
  'tarefas',
  'metasPorCanal',
  'devolucoes',
  'current_user',
  'users',
  'user_settings',
  'audit_log',
  // Tabelas Financeiras
  'finance_despesas',
  'finance_contas_receber',
  'finance_contas_bancarias'
];

export const SimulationProvider = ({ children }) => {
  // ===== ESTADO DE SIMULAÇÃO =====
  const [isSimulationMode, setIsSimulationMode] = useState(() => {
    const stored = sessionStorage.getItem('simulation_mode');
    return stored === 'true';
  });

  const [simulationStats, setSimulationStats] = useState({
    activated: false,
    startTime: null,
    operationsCount: 0,
    lastOperation: null
  });

  // ===== PERSISTIR ESTADO NA SESSÃO =====
  useEffect(() => {
    sessionStorage.setItem('simulation_mode', isSimulationMode.toString());
  }, [isSimulationMode]);

  // ===== FUNÇÃO: OBTER PREFIXO CORRETO =====
  const getPrefix = () => {
    return isSimulationMode ? DB_PREFIX.SIMULATION : DB_PREFIX.PRODUCTION;
  };

  // ===== FUNÇÃO: ATIVAR MODO SIMULAÇÃO =====
  const activateSimulation = () => {
    console.log('🎭 [SIMULATION MODE] Ativando Sandbox...');
    
    // 1. Replicar estrutura do banco de produção
    replicateProductionStructure();
    
    // 2. Ativar flag
    setIsSimulationMode(true);
    
    // 3. Registrar estatísticas
    setSimulationStats({
      activated: true,
      startTime: new Date().toISOString(),
      operationsCount: 0,
      lastOperation: 'SIMULATION_ACTIVATED'
    });

    console.log('✅ [SIMULATION MODE] Sandbox ativado com sucesso!');
    console.log('📊 Todas as operações serão salvas em:', DB_PREFIX.SIMULATION);
  };

  // ===== FUNÇÃO: DESATIVAR MODO SIMULAÇÃO =====
  const deactivateSimulation = () => {
    console.log('🔚 [SIMULATION MODE] Desativando Sandbox...');
    
    setIsSimulationMode(false);
    
    setSimulationStats({
      activated: false,
      startTime: null,
      operationsCount: 0,
      lastOperation: 'SIMULATION_DEACTIVATED'
    });

    console.log('✅ [SIMULATION MODE] Retornado ao banco de produção');
  };

  // ===== FUNÇÃO: REPLICAR ESTRUTURA (SCHEMA) =====
  const replicateProductionStructure = () => {
    console.log('📋 [REPLICATION] Copiando estrutura do banco de produção...');

    TABLES.forEach(table => {
      const prodKey = `${DB_PREFIX.PRODUCTION}${table}`;
      const simKey = `${DB_PREFIX.SIMULATION}${table}`;
      
      const prodData = localStorage.getItem(prodKey);
      
      if (prodData) {
        try {
          // Parsear para validar JSON
          const parsed = JSON.parse(prodData);
          
          // Se é array, criar vazio. Se é objeto, copiar estrutura base
          if (Array.isArray(parsed)) {
            localStorage.setItem(simKey, JSON.stringify([]));
          } else {
            // Copiar estrutura do objeto (config, por exemplo)
            localStorage.setItem(simKey, JSON.stringify(parsed));
          }
          
          console.log(`  ✅ ${table}: Estrutura replicada`);
        } catch (e) {
          console.warn(`  ⚠️ ${table}: Erro ao replicar`, e);
        }
      } else {
        // Tabela não existe em produção, criar vazia
        localStorage.setItem(simKey, JSON.stringify([]));
        console.log(`  ℹ️ ${table}: Criada vazia`);
      }
    });

    console.log('✅ [REPLICATION] Estrutura replicada com sucesso!');
  };

  // ===== FUNÇÃO: RESETAR BANCO SIMULADO =====
  const resetSimulationDatabase = () => {
    console.log('🗑️ [SIMULATION MODE] Resetando banco de simulação...');

    TABLES.forEach(table => {
      const simKey = `${DB_PREFIX.SIMULATION}${table}`;
      localStorage.removeItem(simKey);
    });

    // Replicar estrutura novamente
    replicateProductionStructure();

    setSimulationStats(prev => ({
      ...prev,
      operationsCount: 0,
      lastOperation: 'DATABASE_RESET'
    }));

    console.log('✅ [SIMULATION MODE] Banco de simulação resetado!');
  };

  // ===== FUNÇÃO: OBTER ESTATÍSTICAS =====
  const getSimulationData = () => {
    const data = {};
    
    TABLES.forEach(table => {
      const simKey = `${DB_PREFIX.SIMULATION}${table}`;
      const item = localStorage.getItem(simKey);
      
      if (item) {
        try {
          const parsed = JSON.parse(item);
          data[table] = Array.isArray(parsed) ? parsed.length : 'object';
        } catch (e) {
          data[table] = 'error';
        }
      }
    });

    return data;
  };

  // ===== FUNÇÃO: REGISTRAR OPERAÇÃO =====
  const logOperation = (operation) => {
    setSimulationStats(prev => ({
      ...prev,
      operationsCount: prev.operationsCount + 1,
      lastOperation: operation
    }));
  };

  // ===== FUNÇÃO: EXPORTAR DADOS DE SIMULAÇÃO =====
  const exportSimulationData = () => {
    const data = {};
    
    TABLES.forEach(table => {
      const simKey = `${DB_PREFIX.SIMULATION}${table}`;
      const item = localStorage.getItem(simKey);
      
      if (item) {
        try {
          data[table] = JSON.parse(item);
        } catch (e) {
          data[table] = null;
        }
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('💾 [SIMULATION MODE] Dados de simulação exportados!');
  };

  // ===== CONTEXT VALUE =====
  const value = {
    // Estado
    isSimulationMode,
    simulationStats,
    
    // Controles
    activateSimulation,
    deactivateSimulation,
    resetSimulationDatabase,
    
    // Utilitários
    getPrefix,
    getSimulationData,
    logOperation,
    exportSimulationData,
    
    // Constantes
    DB_PREFIX,
    TABLES
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

// ===== HOOK CUSTOMIZADO =====
export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation deve ser usado dentro de SimulationProvider');
  }
  return context;
};

export default SimulationProvider;
