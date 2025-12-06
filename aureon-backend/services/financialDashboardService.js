/**
 * Financial Dashboard Service
 * Serviço para análises financeiras completas: DRE, Fluxo de Caixa, Indicadores
 */

import { Op } from 'sequelize';
import { Sale, FinanceTransaction, Product, Client, Supplier } from '../models/index.js';
import { sequelize } from '../config/database.js';
import logger from '../utils/logger.js';

class FinancialDashboardService {
  /**
   * DRE - Demonstração de Resultado do Exercício
   * Receitas, Custos, Despesas, Lucro Bruto, Lucro Líquido
   */
  async getDRE(tenantId, startDate, endDate) {
    try {
      const where = {
        tenant_id: tenantId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };

      // 1. RECEITAS (Vendas concluídas)
      const vendas = await Sale.findAll({
        where: {
          ...where,
          status: 'CONCLUIDA'
        },
        include: [{ model: Product, attributes: ['preco_custo'] }]
      });

      const receitaBruta = vendas.reduce((sum, venda) => sum + parseFloat(venda.valor_total || 0), 0);
      const custoVendas = vendas.reduce((sum, venda) => {
        const precoCusto = parseFloat(venda.Product?.preco_custo || 0);
        return sum + (precoCusto * venda.quantidade);
      }, 0);

      // 2. DESPESAS (Transações de saída)
      const despesas = await FinanceTransaction.findAll({
        where: {
          ...where,
          tipo: 'SAIDA'
        },
        attributes: [
          'categoria',
          [sequelize.fn('SUM', sequelize.col('valor')), 'total']
        ],
        group: ['categoria'],
        raw: true
      });

      const despesasDetalhadas = {};
      let totalDespesas = 0;

      despesas.forEach(desp => {
        const valor = parseFloat(desp.total || 0);
        despesasDetalhadas[desp.categoria] = valor;
        totalDespesas += valor;
      });

      // 3. OUTRAS RECEITAS (Transações de entrada não relacionadas a vendas)
      const outrasReceitas = await FinanceTransaction.findAll({
        where: {
          ...where,
          tipo: 'ENTRADA',
          sale_id: null
        }
      });

      const totalOutrasReceitas = outrasReceitas.reduce((sum, rec) => sum + parseFloat(rec.valor || 0), 0);

      // 4. CÁLCULOS
      const lucroBruto = receitaBruta - custoVendas;
      const lucroOperacional = lucroBruto - totalDespesas;
      const lucroLiquido = lucroOperacional + totalOutrasReceitas;

      const margemBruta = receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0;
      const margemOperacional = receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : 0;
      const margemLiquida = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

      return {
        periodo: { inicio: startDate, fim: endDate },
        receitas: {
          receitaBruta: receitaBruta.toFixed(2),
          outrasReceitas: totalOutrasReceitas.toFixed(2),
          receitaTotal: (receitaBruta + totalOutrasReceitas).toFixed(2)
        },
        custos: {
          custoVendas: custoVendas.toFixed(2),
          percentualCusto: receitaBruta > 0 ? ((custoVendas / receitaBruta) * 100).toFixed(2) : 0
        },
        despesas: {
          detalhamento: despesasDetalhadas,
          total: totalDespesas.toFixed(2)
        },
        resultados: {
          lucroBruto: lucroBruto.toFixed(2),
          lucroOperacional: lucroOperacional.toFixed(2),
          lucroLiquido: lucroLiquido.toFixed(2)
        },
        margens: {
          margemBruta: margemBruta.toFixed(2) + '%',
          margemOperacional: margemOperacional.toFixed(2) + '%',
          margemLiquida: margemLiquida.toFixed(2) + '%'
        },
        quantidades: {
          vendas: vendas.length,
          transacoes: despesas.length + outrasReceitas.length
        }
      };
    } catch (error) {
      logger.error('Erro ao gerar DRE:', error);
      throw error;
    }
  }

  /**
   * Fluxo de Caixa
   * Entradas, Saídas, Saldo por período
   */
  async getFluxoCaixa(tenantId, startDate, endDate, agrupamento = 'dia') {
    try {
      const where = {
        tenant_id: tenantId,
        data: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };

      // Formato de data conforme agrupamento
      let dateFormat;
      switch (agrupamento) {
        case 'mes':
          dateFormat = '%Y-%m';
          break;
        case 'semana':
          dateFormat = '%Y-%W';
          break;
        default: // dia
          dateFormat = '%Y-%m-%d';
      }

      // Buscar transações agrupadas
      const transacoes = await FinanceTransaction.findAll({
        where,
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('data'), dateFormat), 'periodo'],
          'tipo',
          [sequelize.fn('SUM', sequelize.col('valor')), 'total']
        ],
        group: ['periodo', 'tipo'],
        order: [['periodo', 'ASC']],
        raw: true
      });

      // Organizar dados por período
      const fluxoPorPeriodo = {};
      let saldoAcumulado = 0;

      transacoes.forEach(trans => {
        const periodo = trans.periodo;
        if (!fluxoPorPeriodo[periodo]) {
          fluxoPorPeriodo[periodo] = {
            periodo,
            entradas: 0,
            saidas: 0,
            saldo: 0,
            saldoAcumulado: 0
          };
        }

        const valor = parseFloat(trans.total || 0);
        if (trans.tipo === 'ENTRADA') {
          fluxoPorPeriodo[periodo].entradas += valor;
        } else {
          fluxoPorPeriodo[periodo].saidas += valor;
        }
      });

      // Calcular saldos
      const resultado = Object.values(fluxoPorPeriodo).map(item => {
        item.saldo = item.entradas - item.saidas;
        saldoAcumulado += item.saldo;
        item.saldoAcumulado = saldoAcumulado;
        
        return {
          periodo: item.periodo,
          entradas: item.entradas.toFixed(2),
          saidas: item.saidas.toFixed(2),
          saldo: item.saldo.toFixed(2),
          saldoAcumulado: item.saldoAcumulado.toFixed(2)
        };
      });

      // Resumo geral
      const totalEntradas = resultado.reduce((sum, item) => sum + parseFloat(item.entradas), 0);
      const totalSaidas = resultado.reduce((sum, item) => sum + parseFloat(item.saidas), 0);

      return {
        periodo: { inicio: startDate, fim: endDate },
        agrupamento,
        resumo: {
          totalEntradas: totalEntradas.toFixed(2),
          totalSaidas: totalSaidas.toFixed(2),
          saldoFinal: (totalEntradas - totalSaidas).toFixed(2)
        },
        fluxo: resultado
      };
    } catch (error) {
      logger.error('Erro ao gerar fluxo de caixa:', error);
      throw error;
    }
  }

  /**
   * Indicadores Financeiros (KPIs)
   */
  async getIndicadores(tenantId, startDate, endDate) {
    try {
      const where = {
        tenant_id: tenantId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };

      // Vendas
      const vendas = await Sale.findAll({
        where: {
          ...where,
          status: 'CONCLUIDA'
        },
        include: [{ model: Product }]
      });

      const totalVendas = vendas.reduce((sum, v) => sum + parseFloat(v.valor_total || 0), 0);
      const custoTotal = vendas.reduce((sum, v) => {
        const custo = parseFloat(v.Product?.preco_custo || 0);
        return sum + (custo * v.quantidade);
      }, 0);

      // Ticket Médio
      const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;

      // Margem de Lucro Média
      const margemLucro = totalVendas > 0 ? ((totalVendas - custoTotal) / totalVendas) * 100 : 0;

      // ROI (Return on Investment)
      const lucro = totalVendas - custoTotal;
      const roi = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

      // Clientes únicos
      const clientesUnicos = new Set(vendas.map(v => v.cliente_id)).size;

      // Ticket médio por cliente
      const ticketPorCliente = clientesUnicos > 0 ? totalVendas / clientesUnicos : 0;

      // Taxa de conversão (simular - em produção viria de analytics)
      const visitantes = vendas.length * 5; // Mock: 5 visitantes por venda
      const taxaConversao = visitantes > 0 ? (vendas.length / visitantes) * 100 : 0;

      // Produtos mais vendidos
      const produtosMaisVendidos = await Sale.findAll({
        where: {
          ...where,
          status: 'CONCLUIDA'
        },
        attributes: [
          'produto_id',
          [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'quantidade_vendas'],
          [sequelize.fn('SUM', sequelize.col('quantidade')), 'quantidade_total'],
          [sequelize.fn('SUM', sequelize.col('valor_total')), 'receita_total']
        ],
        include: [{
          model: Product,
          attributes: ['produto', 'preco_venda']
        }],
        group: ['produto_id'],
        order: [[sequelize.literal('receita_total'), 'DESC']],
        limit: 5,
        raw: true,
        nest: true
      });

      return {
        periodo: { inicio: startDate, fim: endDate },
        vendas: {
          total: totalVendas.toFixed(2),
          quantidade: vendas.length,
          ticketMedio: ticketMedio.toFixed(2),
          ticketPorCliente: ticketPorCliente.toFixed(2)
        },
        lucratividade: {
          custoTotal: custoTotal.toFixed(2),
          lucro: lucro.toFixed(2),
          margemLucro: margemLucro.toFixed(2) + '%',
          roi: roi.toFixed(2) + '%'
        },
        clientes: {
          total: clientesUnicos,
          ticketMedio: ticketPorCliente.toFixed(2),
          taxaConversao: taxaConversao.toFixed(2) + '%'
        },
        topProdutos: produtosMaisVendidos.map(p => ({
          produto: p.Product?.produto || 'N/A',
          quantidadeVendas: parseInt(p.quantidade_vendas),
          quantidadeTotal: parseInt(p.quantidade_total),
          receitaTotal: parseFloat(p.receita_total).toFixed(2)
        }))
      };
    } catch (error) {
      logger.error('Erro ao calcular indicadores:', error);
      throw error;
    }
  }

  /**
   * Projeções Financeiras
   * Baseado em tendências e médias históricas
   */
  async getProjecoes(tenantId, mesesFuturos = 3) {
    try {
      // Buscar dados dos últimos 6 meses para base de cálculo
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 6);

      const vendas = await Sale.findAll({
        where: {
          tenant_id: tenantId,
          status: 'CONCLUIDA',
          created_at: {
            [Op.gte]: dataInicio
          }
        }
      });

      if (vendas.length === 0) {
        return {
          aviso: 'Dados insuficientes para projeção',
          mesesFuturos: 0,
          projecoes: []
        };
      }

      // Calcular médias mensais
      const vendasPorMes = {};
      vendas.forEach(venda => {
        const mes = new Date(venda.created_at).toISOString().substring(0, 7);
        if (!vendasPorMes[mes]) {
          vendasPorMes[mes] = { quantidade: 0, valor: 0 };
        }
        vendasPorMes[mes].quantidade++;
        vendasPorMes[mes].valor += parseFloat(venda.valor_total || 0);
      });

      const meses = Object.keys(vendasPorMes).sort();
      const mediaMensal = meses.reduce((sum, mes) => sum + vendasPorMes[mes].valor, 0) / meses.length;
      const mediaQuantidade = meses.reduce((sum, mes) => sum + vendasPorMes[mes].quantidade, 0) / meses.length;

      // Calcular tendência (crescimento/decrescimento)
      let tendencia = 0;
      if (meses.length >= 2) {
        const valores = meses.map(mes => vendasPorMes[mes].valor);
        const primeiraMetade = valores.slice(0, Math.floor(valores.length / 2));
        const segundaMetade = valores.slice(Math.floor(valores.length / 2));
        
        const mediaInicio = primeiraMetade.reduce((a, b) => a + b, 0) / primeiraMetade.length;
        const mediaFim = segundaMetade.reduce((a, b) => a + b, 0) / segundaMetade.length;
        
        tendencia = mediaInicio > 0 ? ((mediaFim - mediaInicio) / mediaInicio) * 100 : 0;
      }

      // Gerar projeções
      const projecoes = [];
      const dataAtual = new Date();
      
      for (let i = 1; i <= mesesFuturos; i++) {
        const mesProjecao = new Date(dataAtual);
        mesProjecao.setMonth(mesProjecao.getMonth() + i);
        const mesStr = mesProjecao.toISOString().substring(0, 7);

        // Aplicar tendência na projeção
        const fatorCrescimento = 1 + (tendencia / 100) * i;
        const valorProjetado = mediaMensal * fatorCrescimento;
        const quantidadeProjetada = Math.round(mediaQuantidade * fatorCrescimento);

        projecoes.push({
          mes: mesStr,
          valorProjetado: valorProjetado.toFixed(2),
          quantidadeProjetada: quantidadeProjetada,
          confianca: Math.max(0, 100 - (i * 10)) + '%' // Confiança diminui com distância
        });
      }

      return {
        baseCalculo: {
          mesesAnalisados: meses.length,
          periodoInicio: meses[0],
          periodoFim: meses[meses.length - 1]
        },
        mediasHistoricas: {
          valorMensal: mediaMensal.toFixed(2),
          quantidadeMensal: Math.round(mediaQuantidade),
          tendencia: tendencia.toFixed(2) + '%'
        },
        projecoes,
        observacao: tendencia > 5 
          ? 'Tendência de crescimento identificada' 
          : tendencia < -5 
            ? 'Tendência de queda identificada'
            : 'Tendência estável'
      };
    } catch (error) {
      logger.error('Erro ao gerar projeções:', error);
      throw error;
    }
  }

  /**
   * Dashboard Completo
   * Todos os dados financeiros em uma única chamada
   */
  async getDashboardCompleto(tenantId, startDate, endDate) {
    try {
      const [dre, fluxoCaixa, indicadores, projecoes] = await Promise.all([
        this.getDRE(tenantId, startDate, endDate),
        this.getFluxoCaixa(tenantId, startDate, endDate, 'mes'),
        this.getIndicadores(tenantId, startDate, endDate),
        this.getProjecoes(tenantId, 3)
      ]);

      return {
        periodo: { inicio: startDate, fim: endDate },
        dre,
        fluxoCaixa,
        indicadores,
        projecoes,
        geradoEm: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Erro ao gerar dashboard completo:', error);
      throw error;
    }
  }
}

export default new FinancialDashboardService();
