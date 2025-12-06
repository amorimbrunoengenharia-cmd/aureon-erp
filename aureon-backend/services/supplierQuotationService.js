/**
 * Supplier Quotation Service
 * Serviço para gerenciar cotações e análise de performance de fornecedores
 */

import { SupplierQuotation, Supplier, Product, User } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

class SupplierQuotationService {
  /**
   * Criar nova cotação
   */
  async createQuotation(tenantId, quotationData) {
    try {
      const quotation = await SupplierQuotation.create({
        tenant_id: tenantId,
        ...quotationData
      });

      logger.info(`Cotação ${quotation.id} criada para fornecedor ${quotationData.supplier_id}`);

      return quotation;
    } catch (error) {
      logger.error('Erro ao criar cotação:', error);
      throw error;
    }
  }

  /**
   * Comparar preços entre fornecedores para um produto
   */
  async compareQuotations(tenantId, produtoId, options = {}) {
    try {
      const { status = 'PENDENTE', includeExpired = false } = options;

      const whereClause = {
        tenant_id: tenantId,
        produto_id: produtoId
      };

      if (status) {
        whereClause.status = status;
      }

      if (!includeExpired) {
        whereClause[Op.or] = [
          { validade_cotacao: null },
          { validade_cotacao: { [Op.gte]: new Date() } }
        ];
      }

      const quotations = await SupplierQuotation.findAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'nome_fornecedor', 'cnpj', 'email', 'telefone', 'endereco']
          },
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'produto', 'categoria', 'preco_custo', 'preco_venda']
          }
        ],
        order: [['preco_cotado', 'ASC']]
      });

      // Calcular estatísticas
      if (quotations.length === 0) {
        return {
          produto_id: produtoId,
          quotations: [],
          comparacao: null
        };
      }

      const precos = quotations.map(q => parseFloat(q.preco_cotado));
      const menorPreco = Math.min(...precos);
      const maiorPreco = Math.max(...precos);
      const precoMedio = precos.reduce((a, b) => a + b, 0) / precos.length;

      // Adicionar informações de economia
      const quotationsComEconomia = quotations.map(q => {
        const preco = parseFloat(q.preco_cotado);
        const economia = ((maiorPreco - preco) / maiorPreco) * 100;
        
        return {
          ...q.toJSON(),
          economia_percentual: economia.toFixed(2) + '%',
          diferenca_menor_preco: (preco - menorPreco).toFixed(2),
          e_mais_barato: preco === menorPreco
        };
      });

      return {
        produto_id: produtoId,
        produto: quotations[0].product?.produto,
        quotations: quotationsComEconomia,
        comparacao: {
          total_cotacoes: quotations.length,
          menor_preco: menorPreco.toFixed(2),
          maior_preco: maiorPreco.toFixed(2),
          preco_medio: precoMedio.toFixed(2),
          variacao: ((maiorPreco - menorPreco) / menorPreco * 100).toFixed(2) + '%',
          melhor_fornecedor: quotations[0].supplier?.nome_fornecedor
        }
      };
    } catch (error) {
      logger.error('Erro ao comparar cotações:', error);
      throw error;
    }
  }

  /**
   * Aprovar cotação
   */
  async approveQuotation(tenantId, quotationId, userId) {
    try {
      const quotation = await SupplierQuotation.findOne({
        where: {
          id: quotationId,
          tenant_id: tenantId
        }
      });

      if (!quotation) {
        throw new Error('Cotação não encontrada');
      }

      if (quotation.status !== 'PENDENTE') {
        throw new Error('Apenas cotações pendentes podem ser aprovadas');
      }

      if (!quotation.isValid()) {
        throw new Error('Cotação expirada');
      }

      await quotation.update({
        status: 'APROVADA',
        aprovado_por: userId,
        data_aprovacao: new Date()
      });

      logger.info(`Cotação ${quotationId} aprovada por usuário ${userId}`);

      return quotation;
    } catch (error) {
      logger.error('Erro ao aprovar cotação:', error);
      throw error;
    }
  }

  /**
   * Rejeitar cotação
   */
  async rejectQuotation(tenantId, quotationId, userId, motivo = null) {
    try {
      const quotation = await SupplierQuotation.findOne({
        where: {
          id: quotationId,
          tenant_id: tenantId
        }
      });

      if (!quotation) {
        throw new Error('Cotação não encontrada');
      }

      if (quotation.status !== 'PENDENTE') {
        throw new Error('Apenas cotações pendentes podem ser rejeitadas');
      }

      await quotation.update({
        status: 'REJEITADA',
        aprovado_por: userId,
        data_aprovacao: new Date(),
        motivo_rejeicao: motivo
      });

      logger.info(`Cotação ${quotationId} rejeitada por usuário ${userId}`);

      return quotation;
    } catch (error) {
      logger.error('Erro ao rejeitar cotação:', error);
      throw error;
    }
  }

  /**
   * Análise de performance de fornecedor
   */
  async analyzeSupplierPerformance(tenantId, supplierId) {
    try {
      // Buscar todas as cotações do fornecedor
      const quotations = await SupplierQuotation.findAll({
        where: {
          tenant_id: tenantId,
          supplier_id: supplierId
        },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'produto']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      if (quotations.length === 0) {
        return {
          supplier_id: supplierId,
          mensagem: 'Nenhuma cotação encontrada para este fornecedor'
        };
      }

      // Estatísticas gerais
      const totalCotacoes = quotations.length;
      const aprovadas = quotations.filter(q => q.status === 'APROVADA').length;
      const rejeitadas = quotations.filter(q => q.status === 'REJEITADA').length;
      const pendentes = quotations.filter(q => q.status === 'PENDENTE').length;
      const taxaAprovacao = totalCotacoes > 0 ? (aprovadas / totalCotacoes) * 100 : 0;

      // Análise de prazos (apenas cotações aprovadas com data de entrega)
      const quotationsComEntrega = quotations.filter(q => 
        q.status === 'APROVADA' && q.data_entrega_real && q.prazo_entrega_dias
      );

      let analise_prazos = null;
      if (quotationsComEntrega.length > 0) {
        const atrasos = quotationsComEntrega.map(q => q.calcularAtraso()).filter(a => a !== null);
        const totalAtrasos = atrasos.filter(a => a > 0).length;
        const totalAdiantamentos = atrasos.filter(a => a < 0).length;
        const prazoMedio = atrasos.reduce((sum, a) => sum + a, 0) / atrasos.length;

        analise_prazos = {
          total_entregas: quotationsComEntrega.length,
          entregas_no_prazo: quotationsComEntrega.length - totalAtrasos - totalAdiantamentos,
          entregas_atrasadas: totalAtrasos,
          entregas_adiantadas: totalAdiantamentos,
          taxa_cumprimento: ((1 - (totalAtrasos / quotationsComEntrega.length)) * 100).toFixed(2) + '%',
          atraso_medio_dias: prazoMedio > 0 ? prazoMedio.toFixed(1) : 0,
          adiantamento_medio_dias: prazoMedio < 0 ? Math.abs(prazoMedio).toFixed(1) : 0
        };
      }

      // Análise de qualidade
      const quotationsComAvaliacao = quotations.filter(q => 
        q.avaliacao_qualidade !== null || q.avaliacao_prazo !== null
      );

      let analise_qualidade = null;
      if (quotationsComAvaliacao.length > 0) {
        const avaliacoesQualidade = quotationsComAvaliacao
          .filter(q => q.avaliacao_qualidade !== null)
          .map(q => q.avaliacao_qualidade);
        
        const avaliacoesPrazo = quotationsComAvaliacao
          .filter(q => q.avaliacao_prazo !== null)
          .map(q => q.avaliacao_prazo);

        analise_qualidade = {
          total_avaliacoes: quotationsComAvaliacao.length,
          avaliacao_qualidade_media: avaliacoesQualidade.length > 0
            ? (avaliacoesQualidade.reduce((a, b) => a + b, 0) / avaliacoesQualidade.length).toFixed(1)
            : null,
          avaliacao_prazo_media: avaliacoesPrazo.length > 0
            ? (avaliacoesPrazo.reduce((a, b) => a + b, 0) / avaliacoesPrazo.length).toFixed(1)
            : null
        };
      }

      // Histórico de preços (últimas 5 cotações aprovadas)
      const historico_precos = quotations
        .filter(q => q.status === 'APROVADA')
        .slice(0, 5)
        .map(q => ({
          data: q.created_at,
          produto: q.product?.produto,
          preco: parseFloat(q.preco_cotado).toFixed(2),
          quantidade_minima: q.quantidade_minima
        }));

      // Preço médio
      const precosAprovados = quotations
        .filter(q => q.status === 'APROVADA')
        .map(q => parseFloat(q.preco_cotado));
      
      const precoMedio = precosAprovados.length > 0
        ? precosAprovados.reduce((a, b) => a + b, 0) / precosAprovados.length
        : 0;

      return {
        supplier_id: supplierId,
        estatisticas_gerais: {
          total_cotacoes: totalCotacoes,
          cotacoes_aprovadas: aprovadas,
          cotacoes_rejeitadas: rejeitadas,
          cotacoes_pendentes: pendentes,
          taxa_aprovacao: taxaAprovacao.toFixed(2) + '%',
          preco_medio_aprovado: precoMedio.toFixed(2)
        },
        analise_prazos,
        analise_qualidade,
        historico_precos
      };
    } catch (error) {
      logger.error('Erro ao analisar performance do fornecedor:', error);
      throw error;
    }
  }

  /**
   * Histórico de preços de um produto
   */
  async getPriceHistory(tenantId, produtoId, options = {}) {
    try {
      const { limit = 20, supplierId = null } = options;

      const whereClause = {
        tenant_id: tenantId,
        produto_id: produtoId,
        status: 'APROVADA'
      };

      if (supplierId) {
        whereClause.supplier_id = supplierId;
      }

      const quotations = await SupplierQuotation.findAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'nome_fornecedor']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit)
      });

      if (quotations.length === 0) {
        return {
          produto_id: produtoId,
          historico: [],
          analise: null
        };
      }

      const precos = quotations.map(q => parseFloat(q.preco_cotado));
      const menorPreco = Math.min(...precos);
      const maiorPreco = Math.max(...precos);
      const precoAtual = precos[0]; // Mais recente
      const precoAnterior = precos[1] || precoAtual;
      const variacao = ((precoAtual - precoAnterior) / precoAnterior) * 100;

      return {
        produto_id: produtoId,
        historico: quotations.map(q => ({
          data: q.created_at,
          fornecedor: q.supplier?.nome_fornecedor,
          preco: parseFloat(q.preco_cotado).toFixed(2),
          quantidade_minima: q.quantidade_minima,
          prazo_entrega_dias: q.prazo_entrega_dias
        })),
        analise: {
          preco_atual: precoAtual.toFixed(2),
          preco_anterior: precoAnterior.toFixed(2),
          variacao_percentual: variacao.toFixed(2) + '%',
          tendencia: variacao > 5 ? 'ALTA' : variacao < -5 ? 'BAIXA' : 'ESTÁVEL',
          menor_preco_historico: menorPreco.toFixed(2),
          maior_preco_historico: maiorPreco.toFixed(2),
          total_cotacoes: quotations.length
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar histórico de preços:', error);
      throw error;
    }
  }

  /**
   * Ranking de fornecedores
   */
  async getSupplierRanking(tenantId) {
    try {
      const suppliers = await Supplier.findAll({
        where: { tenant_id: tenantId },
        include: [
          {
            model: SupplierQuotation,
            as: 'quotations',
            where: { tenant_id: tenantId },
            required: false
          }
        ]
      });

      const ranking = [];

      for (const supplier of suppliers) {
        const performance = await this.analyzeSupplierPerformance(tenantId, supplier.id);
        
        if (performance.estatisticas_gerais) {
          const score = this.calculateSupplierScore(performance);
          
          ranking.push({
            supplier_id: supplier.id,
            nome_fornecedor: supplier.nome_fornecedor,
            score: score.toFixed(1),
            taxa_aprovacao: performance.estatisticas_gerais.taxa_aprovacao,
            total_cotacoes: performance.estatisticas_gerais.total_cotacoes,
            preco_medio: performance.estatisticas_gerais.preco_medio_aprovado,
            avaliacao_qualidade: performance.analise_qualidade?.avaliacao_qualidade_media || 'N/A',
            taxa_cumprimento_prazo: performance.analise_prazos?.taxa_cumprimento || 'N/A'
          });
        }
      }

      // Ordenar por score
      ranking.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

      return ranking;
    } catch (error) {
      logger.error('Erro ao gerar ranking de fornecedores:', error);
      throw error;
    }
  }

  /**
   * Calcular score do fornecedor (0-100)
   */
  calculateSupplierScore(performance) {
    let score = 0;
    
    // Taxa de aprovação (40 pontos)
    const taxaAprovacao = parseFloat(performance.estatisticas_gerais.taxa_aprovacao);
    score += (taxaAprovacao / 100) * 40;

    // Qualidade (30 pontos)
    if (performance.analise_qualidade?.avaliacao_qualidade_media) {
      const qualidade = parseFloat(performance.analise_qualidade.avaliacao_qualidade_media);
      score += (qualidade / 5) * 30;
    }

    // Cumprimento de prazo (30 pontos)
    if (performance.analise_prazos?.taxa_cumprimento) {
      const taxaCumprimento = parseFloat(performance.analise_prazos.taxa_cumprimento);
      score += (taxaCumprimento / 100) * 30;
    }

    return score;
  }
}

export default new SupplierQuotationService();
