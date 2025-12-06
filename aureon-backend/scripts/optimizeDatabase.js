import sequelize from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Script para adicionar índices otimizados ao banco de dados SQLite
 * Melhora performance de queries complexas
 * 
 * Executar com: node scripts/optimizeDatabase.js
 */

async function createIndexes() {
  try {
    logger.info('🔧 Iniciando otimização do banco de dados...');

    const indexes = [
      // Sales - Índices compostos para queries analíticas
      {
        name: 'sales_date_status_idx',
        table: 'sales',
        columns: ['data_venda', 'status'],
        description: 'Otimiza queries de vendas por data e status'
      },
      {
        name: 'sales_vendedor_date_idx',
        table: 'sales',
        columns: ['vendedor_id', 'data_venda'],
        description: 'Performance de vendedores por período'
      },
      {
        name: 'sales_cliente_date_idx',
        table: 'sales',
        columns: ['cliente_id', 'data_venda'],
        description: 'Histórico de compras de clientes'
      },

      // Products - Busca e filtros
      {
        name: 'products_active_categoria_idx',
        table: 'products',
        columns: ['active', 'categoria'],
        description: 'Produtos ativos por categoria'
      },
      {
        name: 'products_fornecedor_active_idx',
        table: 'products',
        columns: ['fornecedor_id', 'active'],
        description: 'Produtos ativos por fornecedor'
      },

      // Clients - Busca e segmentação
      {
        name: 'clients_active_categoria_idx',
        table: 'clients',
        columns: ['active', 'categoria'],
        description: 'Clientes ativos por categoria'
      },
      {
        name: 'clients_origem_active_idx',
        table: 'clients',
        columns: ['origem', 'active'],
        description: 'Clientes ativos por origem'
      },

      // StockMovements - Relatórios de estoque
      {
        name: 'stock_movements_produto_data_idx',
        table: 'stock_movements',
        columns: ['produto_id', 'data'],
        description: 'Movimentações de estoque por produto e data'
      },
      {
        name: 'stock_movements_tipo_data_idx',
        table: 'stock_movements',
        columns: ['tipo', 'data'],
        description: 'Movimentações por tipo e data'
      },

      // FinanceTransactions - Relatórios financeiros
      {
        name: 'finance_data_tipo_idx',
        table: 'finance_transactions',
        columns: ['data', 'tipo'],
        description: 'Transações por data e tipo'
      },
      {
        name: 'finance_status_data_idx',
        table: 'finance_transactions',
        columns: ['status', 'data'],
        description: 'Transações por status e data'
      },
      {
        name: 'finance_categoria_data_idx',
        table: 'finance_transactions',
        columns: ['categoria', 'data'],
        description: 'Transações por categoria e data'
      },

      // Events - Performance do event log
      {
        name: 'events_status_created_idx',
        table: 'events',
        columns: ['status', 'created_at'],
        description: 'Eventos por status e data de criação'
      },
      {
        name: 'events_type_created_idx',
        table: 'events',
        columns: ['event_type', 'created_at'],
        description: 'Eventos por tipo e data'
      },

      // AuditLogs - Auditoria rápida
      {
        name: 'audit_resource_action_idx',
        table: 'audit_logs',
        columns: ['resource_type', 'action'],
        description: 'Logs de auditoria por recurso e ação'
      },
      {
        name: 'audit_user_created_idx',
        table: 'audit_logs',
        columns: ['user_id', 'created_at'],
        description: 'Logs de auditoria por usuário e data'
      },

      // Prescriptions - Busca de receitas
      {
        name: 'prescriptions_status_validade_idx',
        table: 'prescriptions',
        columns: ['status', 'data_validade'],
        description: 'Receitas por status e validade'
      },
      {
        name: 'prescriptions_cliente_created_idx',
        table: 'prescriptions',
        columns: ['cliente_id', 'created_at'],
        description: 'Receitas por cliente e data'
      }
    ];

    let created = 0;
    let skipped = 0;

    for (const index of indexes) {
      try {
        const indexExists = await checkIndexExists(index.name);

        if (indexExists) {
          logger.info(`⏭️  Índice ${index.name} já existe, pulando...`);
          skipped++;
          continue;
        }

        const sql = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${index.columns.join(', ')})`;
        
        await sequelize.query(sql);
        logger.info(`✅ Criado: ${index.name}`);
        logger.info(`   📝 ${index.description}`);
        created++;
      } catch (error) {
        logger.error(`❌ Erro ao criar índice ${index.name}:`, error.message);
      }
    }

    logger.info('');
    logger.info('═══════════════════════════════════════════════');
    logger.info(`✅ Otimização concluída!`);
    logger.info(`   ✓ ${created} índices criados`);
    logger.info(`   ⏭️  ${skipped} índices já existiam`);
    logger.info('═══════════════════════════════════════════════');

    // Analyze para atualizar estatísticas
    logger.info('');
    logger.info('📊 Atualizando estatísticas do banco...');
    await sequelize.query('ANALYZE');
    logger.info('✅ Estatísticas atualizadas');

  } catch (error) {
    logger.error('❌ Erro ao otimizar banco de dados:', error);
    throw error;
  }
}

/**
 * Verifica se índice já existe
 */
async function checkIndexExists(indexName) {
  try {
    const [results] = await sequelize.query(
      `SELECT name FROM sqlite_master WHERE type='index' AND name='${indexName}'`
    );
    return results.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Analisa uso dos índices
 */
async function analyzeIndexUsage() {
  try {
    logger.info('');
    logger.info('📊 Analisando uso dos índices...');

    const [indexes] = await sequelize.query(`
      SELECT name, tbl_name
      FROM sqlite_master
      WHERE type='index'
      AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name
    `);

    logger.info(`Total de índices: ${indexes.length}`);
    
    // Agrupar por tabela
    const byTable = indexes.reduce((acc, idx) => {
      if (!acc[idx.tbl_name]) {
        acc[idx.tbl_name] = [];
      }
      acc[idx.tbl_name].push(idx.name);
      return acc;
    }, {});

    for (const [table, idxList] of Object.entries(byTable)) {
      logger.info(`   ${table}: ${idxList.length} índices`);
    }

  } catch (error) {
    logger.error('Erro ao analisar índices:', error);
  }
}

/**
 * Otimiza tabelas (VACUUM)
 */
async function optimizeTables() {
  try {
    logger.info('');
    logger.info('🧹 Executando VACUUM para otimizar espaço...');
    await sequelize.query('VACUUM');
    logger.info('✅ VACUUM concluído');
  } catch (error) {
    logger.error('Erro ao executar VACUUM:', error);
  }
}

// Executar otimizações
async function main() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conectado ao banco de dados');
    logger.info('');

    await createIndexes();
    await analyzeIndexUsage();
    await optimizeTables();

    logger.info('');
    logger.info('🎉 Todas as otimizações foram concluídas com sucesso!');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
