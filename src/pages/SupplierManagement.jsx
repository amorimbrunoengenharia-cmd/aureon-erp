import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContextAPI';

const SupplierManagement = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('quotations');
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [comparison, setComparison] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state for new quotation
  const [newQuotation, setNewQuotation] = useState({
    supplier_id: '',
    produto_id: '',
    preco_cotado: '',
    quantidade_minima: '',
    prazo_entrega_dias: '',
    validade_cotacao: '',
    metadata: {}
  });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    loadQuotations();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadQuotations = async () => {
    try {
      setLoading(true);
      // This would need a GET /quotations endpoint - for now showing empty
      setQuotations([]);
    } catch (error) {
      console.error('Erro ao carregar cotações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/suppliers/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newQuotation)
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Cotação criada com sucesso!');
        setNewQuotation({
          supplier_id: '',
          produto_id: '',
          preco_cotado: '',
          quantidade_minima: '',
          prazo_entrega_dias: '',
          validade_cotacao: '',
          metadata: {}
        });
        loadQuotations();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao criar cotação:', error);
      alert('Erro ao criar cotação');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedProduct) {
      alert('Selecione um produto');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/suppliers/quotations/compare/${selectedProduct}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Erro ao comparar cotações:', error);
      alert('Erro ao comparar cotações');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (quotationId) => {
    if (!confirm('Deseja aprovar esta cotação?')) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/suppliers/quotations/${quotationId}/approve`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        alert('Cotação aprovada!');
        handleCompare(); // Refresh comparison
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar cotação');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (quotationId) => {
    const motivo = prompt('Motivo da rejeição:');
    if (!motivo) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/suppliers/quotations/${quotationId}/reject`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ motivo })
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        alert('Cotação rejeitada!');
        handleCompare(); // Refresh comparison
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('Erro ao rejeitar cotação');
    } finally {
      setLoading(false);
    }
  };

  const loadRanking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/suppliers/ranking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setRanking(data.ranking || []);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async (supplierId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/suppliers/${supplierId}/performance`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setPerformance(data);
      setSelectedSupplier(supplierId);
    } catch (error) {
      console.error('Erro ao carregar performance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ranking') {
      loadRanking();
    }
  }, [activeTab]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Fornecedores</h1>
        <p className="text-gray-600 mt-1">Cotações, comparações e análise de performance</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('quotations')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'quotations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Nova Cotação
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'compare'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Comparar Preços
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'ranking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Ranking de Fornecedores
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'performance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Performance Detalhada
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Solicitar Nova Cotação</h2>
          <form onSubmit={handleCreateQuotation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor *
                </label>
                <select
                  value={newQuotation.supplier_id}
                  onChange={(e) =>
                    setNewQuotation({ ...newQuotation, supplier_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome_fornecedor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto *
                </label>
                <select
                  value={newQuotation.produto_id}
                  onChange={(e) =>
                    setNewQuotation({ ...newQuotation, produto_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.produto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Cotado (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newQuotation.preco_cotado}
                  onChange={(e) =>
                    setNewQuotation({ ...newQuotation, preco_cotado: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Mínima *
                </label>
                <input
                  type="number"
                  value={newQuotation.quantidade_minima}
                  onChange={(e) =>
                    setNewQuotation({ ...newQuotation, quantidade_minima: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prazo de Entrega (dias) *
                </label>
                <input
                  type="number"
                  value={newQuotation.prazo_entrega_dias}
                  onChange={(e) =>
                    setNewQuotation({
                      ...newQuotation,
                      prazo_entrega_dias: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validade da Cotação
                </label>
                <input
                  type="date"
                  value={newQuotation.validade_cotacao}
                  onChange={(e) =>
                    setNewQuotation({ ...newQuotation, validade_cotacao: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Cotação'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'compare' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Comparar Preços</h2>
            <div className="flex gap-4">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.produto}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCompare}
                disabled={loading || !selectedProduct}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Comparar
              </button>
            </div>
          </div>

          {comparison && comparison.quotations.length > 0 && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Total de Cotações</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {comparison.comparacao.total_cotacoes}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Menor Preço</div>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {comparison.comparacao.menor_preco}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Preço Médio</div>
                  <div className="text-2xl font-bold text-gray-700">
                    R$ {comparison.comparacao.preco_medio}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Variação</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {comparison.comparacao.variacao}
                  </div>
                </div>
              </div>

              {/* Quotations Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fornecedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Economia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Qtd. Mínima
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Prazo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparison.quotations.map((q) => (
                      <tr key={q.id} className={q.e_mais_barato ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {q.supplier?.nome_fornecedor}
                                {q.e_mais_barato && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    Melhor Preço
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {q.supplier?.cnpj}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            R$ {parseFloat(q.preco_cotado).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600">
                            {q.economia_percentual}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {q.quantidade_minima}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {q.prazo_entrega_dias} dias
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              q.status === 'PENDENTE'
                                ? 'bg-yellow-100 text-yellow-800'
                                : q.status === 'APROVADA'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {q.status === 'PENDENTE' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(q.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleReject(q.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Rejeitar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {comparison && comparison.quotations.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Nenhuma cotação encontrada para este produto
            </div>
          )}
        </div>
      )}

      {activeTab === 'ranking' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Ranking de Fornecedores</h2>
            <p className="text-gray-600 mb-6">
              Classificação baseada em taxa de aprovação, qualidade e cumprimento de prazos
            </p>
          </div>

          {ranking.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Posição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Taxa Aprovação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cotações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Qualidade Média
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ranking.map((supplier, index) => (
                    <tr key={supplier.supplier_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`text-lg font-bold ${
                              index === 0
                                ? 'text-yellow-500'
                                : index === 1
                                ? 'text-gray-400'
                                : index === 2
                                ? 'text-orange-600'
                                : 'text-gray-600'
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.nome_fornecedor}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-blue-600">
                            {supplier.score}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">/100</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.taxa_aprovacao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {supplier.total_cotacoes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {supplier.avaliacao_qualidade !== 'N/A' ? (
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {supplier.avaliacao_qualidade}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">/5</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            loadPerformance(supplier.supplier_id);
                            setActiveTab('performance');
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              {loading ? 'Carregando...' : 'Nenhum fornecedor com cotações'}
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Análise de Performance Detalhada</h2>
            <div className="flex gap-4">
              <select
                value={selectedSupplier || ''}
                onChange={(e) => loadPerformance(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um fornecedor...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome_fornecedor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {performance && performance.estatisticas_gerais && (
            <div className="space-y-6">
              {/* General Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Estatísticas Gerais</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total de Cotações</div>
                    <div className="text-xl font-bold text-gray-900">
                      {performance.estatisticas_gerais.total_cotacoes}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Taxa de Aprovação</div>
                    <div className="text-xl font-bold text-green-600">
                      {performance.estatisticas_gerais.taxa_aprovacao}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Preço Médio Aprovado</div>
                    <div className="text-xl font-bold text-blue-600">
                      R$ {performance.estatisticas_gerais.preco_medio_aprovado}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Aprovadas</div>
                    <div className="text-xl font-bold text-green-600">
                      {performance.estatisticas_gerais.cotacoes_aprovadas}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Rejeitadas</div>
                    <div className="text-xl font-bold text-red-600">
                      {performance.estatisticas_gerais.cotacoes_rejeitadas}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Pendentes</div>
                    <div className="text-xl font-bold text-yellow-600">
                      {performance.estatisticas_gerais.cotacoes_pendentes}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Analysis */}
              {performance.analise_prazos && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Análise de Prazos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total de Entregas</div>
                      <div className="text-xl font-bold">
                        {performance.analise_prazos.total_entregas}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Taxa de Cumprimento</div>
                      <div className="text-xl font-bold text-green-600">
                        {performance.analise_prazos.taxa_cumprimento}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">No Prazo</div>
                      <div className="text-xl font-bold text-blue-600">
                        {performance.analise_prazos.entregas_no_prazo}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Atrasadas</div>
                      <div className="text-xl font-bold text-red-600">
                        {performance.analise_prazos.entregas_atrasadas}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Adiantadas</div>
                      <div className="text-xl font-bold text-green-600">
                        {performance.analise_prazos.entregas_adiantadas}
                      </div>
                    </div>
                    {performance.analise_prazos.atraso_medio_dias > 0 && (
                      <div>
                        <div className="text-sm text-gray-600">Atraso Médio</div>
                        <div className="text-xl font-bold text-orange-600">
                          {performance.analise_prazos.atraso_medio_dias} dias
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quality Analysis */}
              {performance.analise_qualidade && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Análise de Qualidade</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total de Avaliações</div>
                      <div className="text-xl font-bold">
                        {performance.analise_qualidade.total_avaliacoes}
                      </div>
                    </div>
                    {performance.analise_qualidade.avaliacao_qualidade_media && (
                      <div>
                        <div className="text-sm text-gray-600">Qualidade Média</div>
                        <div className="text-xl font-bold text-blue-600">
                          {performance.analise_qualidade.avaliacao_qualidade_media}/5.0
                        </div>
                      </div>
                    )}
                    {performance.analise_qualidade.avaliacao_prazo_media && (
                      <div>
                        <div className="text-sm text-gray-600">Avaliação de Prazo Média</div>
                        <div className="text-xl font-bold text-green-600">
                          {performance.analise_qualidade.avaliacao_prazo_media}/5.0
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price History */}
              {performance.historico_precos && performance.historico_precos.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Histórico de Preços (Últimas 5)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Data
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Produto
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Preço
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Qtd. Mínima
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {performance.historico_precos.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(item.data).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.produto}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              R$ {item.preco}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.quantidade_minima}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {!performance && !loading && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Selecione um fornecedor para ver a análise de performance
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
