/**
 * ============================================
 * REPLENISHMENT SERVICE (SERVIÇO DE REPOSIÇÃO)
 * ============================================
 * 
 * Algoritmo Avançado de Sugestão de Compras baseado em:
 * - Venda Média Diária (VMD)
 * - Lead Time do Fornecedor
 * - Meta de Crescimento do CEO
 * - Estoque de Segurança
 * - Margem de Lucro e Volume de Vendas (Score)
 * 
 * @author Arquiteto de Software Sênior
 * @version 2.0
 * @date 2025-12-04
 */

/**
 * Classe principal para cálculo de reposição de estoque
 */
export class ReplenishmentService {
  /**
   * Calcula a Venda Média Diária (VMD) dos últimos N dias
   * 
   * @param {Array} vendas - Array de vendas históricas
   * @param {string} produtoId - ID do produto
   * @param {number} dias - Período de análise (padrão: 30 dias)
   * @returns {number} VMD (Venda Média Diária)
   */
  static calcularVMD(vendas, produtoId, dias = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);

    const vendasRecentes = vendas.filter(venda => {
      const dataVenda = this.parseDataBR(venda.data);
      return dataVenda >= dataLimite && 
             (venda.produtoId === produtoId || venda.produto === produtoId);
    });

    const totalVendido = vendasRecentes.reduce((acc, v) => acc + (v.quantidade || 1), 0);
    return totalVendido / dias;
  }

  /**
   * Parse de data brasileira (dd/mm/yyyy) para Date
   */
  static parseDataBR(dataStr) {
    if (!dataStr) return new Date();
    const [dia, mes, ano] = dataStr.split('/');
    return new Date(ano, mes - 1, dia);
  }

  /**
   * ALGORITMO PRINCIPAL DE SUGESTÃO DE COMPRA
   * 
   * Implementa a lógica exata conforme especificação:
   * 1. VMD Projetada = VMD * (1 + meta_crescimento)
   * 2. Estoque Segurança = VMD Projetada * fator_segurança
   * 3. Ponto de Pedido = (VMD Projetada * lead_time) + estoque_segurança
   * 4. Sugestão Compra = MAX(0, ponto_pedido - estoque_atual)
   * 
   * @param {Object} params - Parâmetros do cálculo
   * @param {number} params.vmd - Venda Média Diária
   * @param {number} params.lead_time - Tempo de entrega em dias
   * @param {number} params.estoque_atual - Quantidade em estoque
   * @param {number} params.meta_crescimento - Meta do CEO (ex: 0.20 para 20%)
   * @param {number} params.fator_seguranca - Margem de segurança em dias
   * @returns {Object} Resultado do cálculo
   */
  static calcularSugestaoCompra({
    vmd,
    lead_time,
    estoque_atual,
    meta_crescimento,
    fator_seguranca
  }) {
    // ===== PASSO 1: Projetar a venda futura considerando a meta do CEO =====
    // Se a meta é 20%, e a VMD é 10, a VMD Projetada será 12.
    const vmd_projetada = vmd * (1 + meta_crescimento);

    // ===== PASSO 2: Calcular Estoque de Segurança (Safety Stock) =====
    // Garante que não falte produto se houver oscilação.
    const estoque_seguranca = vmd_projetada * fator_seguranca;

    // ===== PASSO 3: Calcular Ponto de Pedido (Reorder Point) =====
    // O gatilho: quando o estoque baixar disso, precisa comprar.
    const ponto_de_pedido = (vmd_projetada * lead_time) + estoque_seguranca;

    // ===== PASSO 4: Calcular Sugestão de Compra (Quantity to Buy) =====
    // Define quanto comprar para cobrir o ciclo.
    // Use MAX para evitar números negativos se o estoque estiver cheio.
    const sugestao_compra = Math.max(0, ponto_de_pedido - estoque_atual);

    return {
      vmd_original: vmd,
      vmd_projetada,
      estoque_seguranca,
      ponto_de_pedido,
      sugestao_compra: Math.ceil(sugestao_compra), // Arredonda para cima
      estoque_atual,
      status: sugestao_compra > 0 ? 'COMPRAR' : 'ESTOQUE_OK'
    };
  }

  /**
   * Calcula o Score de priorização para ordenação
   * 
   * Score = Margem_Lucro * Volume_Vendas
   * 
   * @param {number} margemLucro - Margem de lucro percentual (ex: 35 para 35%)
   * @param {number} volumeVendas - Total de unidades vendidas
   * @returns {number} Score de priorização
   */
  static calcularScore(margemLucro, volumeVendas) {
    return margemLucro * volumeVendas;
  }

  /**
   * Calcula margem de lucro percentual
   * 
   * @param {number} precoCusto - Preço de custo
   * @param {number} precoVenda - Preço de venda
   * @returns {number} Margem de lucro em percentual
   */
  static calcularMargemLucro(precoCusto, precoVenda) {
    if (precoVenda === 0) return 0;
    return ((precoVenda - precoCusto) / precoVenda) * 100;
  }

  /**
   * Processa todos os produtos e gera lista de sugestões de compra
   * 
   * @param {Array} produtos - Lista de produtos
   * @param {Array} vendas - Histórico de vendas
   * @param {Array} fornecedores - Lista de fornecedores
   * @param {Object} config - Configurações do sistema
   * @returns {Array} Lista ordenada de sugestões de compra
   */
  static gerarListaSugestoes(produtos, vendas, fornecedores, config) {
    const metaCrescimento = (config.metaCrescimento || 20) / 100; // Converte % para decimal
    const fatorSeguranca = config.fatorSeguranca || 3; // Dias de segurança

    const sugestoes = produtos.map(produto => {
      // Calcular VMD dos últimos 30 dias
      const vmd = this.calcularVMD(vendas, produto.id, 30);

      // Buscar lead time do fornecedor
      const fornecedor = fornecedores.find(f => 
        f.id === produto.fornecedorId || f.nome === produto.fornecedorId
      );
      const leadTime = fornecedor?.leadTime || 7; // Padrão: 7 dias

      // Calcular sugestão de compra
      const resultado = this.calcularSugestaoCompra({
        vmd,
        lead_time: leadTime,
        estoque_atual: produto.estoque || 0,
        meta_crescimento: metaCrescimento,
        fator_seguranca: fatorSeguranca
      });

      // Calcular margem de lucro
      const precoCusto = produto.valorCompra || produto.custoAlibaba || 0;
      const precoVenda = produto.valorVenda || produto.preco || 0;
      const margemLucro = this.calcularMargemLucro(precoCusto, precoVenda);

      // Calcular volume de vendas (últimos 90 dias)
      const volumeVendas = vendas.filter(v => 
        v.produtoId === produto.id || v.produto === produto.produto
      ).reduce((acc, v) => acc + (v.quantidade || 1), 0);

      // Calcular Score de priorização
      const score = this.calcularScore(margemLucro, volumeVendas);

      // Calcular custo total da compra
      const custoTotal = resultado.sugestao_compra * precoCusto;

      return {
        // Dados do produto
        produtoId: produto.id,
        produtoNome: produto.produto || produto.nome,
        fornecedor: fornecedor?.nome || 'Não vinculado',
        fornecedorId: produto.fornecedorId,
        
        // Preços
        precoCusto,
        precoVenda,
        margemLucro,
        
        // Estoque
        estoqueAtual: produto.estoque || 0,
        
        // Cálculos de reposição
        vmd: resultado.vmd_original,
        vmdProjetada: resultado.vmd_projetada,
        estoqueSeguranca: resultado.estoque_seguranca,
        pontoPedido: resultado.ponto_de_pedido,
        sugestaoCompra: resultado.sugestao_compra,
        
        // Métricas de priorização
        volumeVendas,
        score,
        custoTotal,
        
        // Status
        status: resultado.status,
        leadTime,
        
        // Classificação de prioridade
        prioridade: this.classificarPrioridade(resultado.sugestao_compra, produto.estoque || 0, score)
      };
    });

    // Filtrar apenas produtos que precisam de reposição
    const precisaComprar = sugestoes.filter(s => s.sugestaoCompra > 0);

    // Ordenar por Score (maior primeiro)
    return precisaComprar.sort((a, b) => b.score - a.score);
  }

  /**
   * Classifica a prioridade da compra
   * 
   * @param {number} sugestaoCompra - Quantidade sugerida
   * @param {number} estoqueAtual - Quantidade em estoque
   * @param {number} score - Score de priorização
   * @returns {string} Nível de prioridade
   */
  static classificarPrioridade(sugestaoCompra, estoqueAtual, score) {
    if (estoqueAtual === 0 && score > 500) return 'CRITICA';
    if (estoqueAtual === 0 || sugestaoCompra > 50) return 'ALTA';
    if (sugestaoCompra > 20 || score > 300) return 'MEDIA';
    return 'BAIXA';
  }

  /**
   * Gera relatório de análise de compras
   * 
   * @param {Array} sugestoes - Lista de sugestões
   * @returns {Object} Relatório consolidado
   */
  static gerarRelatorio(sugestoes) {
    const totalItens = sugestoes.length;
    const totalUnidades = sugestoes.reduce((acc, s) => acc + s.sugestaoCompra, 0);
    const custoTotalCompra = sugestoes.reduce((acc, s) => acc + s.custoTotal, 0);
    const receitaProjetada = sugestoes.reduce((acc, s) => 
      acc + (s.sugestaoCompra * s.precoVenda), 0
    );
    const lucroProjetado = receitaProjetada - custoTotalCompra;
    const margemMedia = custoTotalCompra > 0 ? (lucroProjetado / receitaProjetada) * 100 : 0;

    const porPrioridade = {
      CRITICA: sugestoes.filter(s => s.prioridade === 'CRITICA').length,
      ALTA: sugestoes.filter(s => s.prioridade === 'ALTA').length,
      MEDIA: sugestoes.filter(s => s.prioridade === 'MEDIA').length,
      BAIXA: sugestoes.filter(s => s.prioridade === 'BAIXA').length
    };

    return {
      totalItens,
      totalUnidades,
      custoTotalCompra,
      receitaProjetada,
      lucroProjetado,
      margemMedia,
      porPrioridade
    };
  }
}

export default ReplenishmentService;
