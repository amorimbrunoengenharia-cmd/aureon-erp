import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Card from '../components/Card';
import apiService from '../services/ApiService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const FinancialDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState({
    inicio: getDefaultStartDate(),
    fim: getDefaultEndDate()
  });
  const [agrupamento, setAgrupamento] = useState('mes');
  
  const [dre, setDre] = useState(null);
  const [fluxoCaixa, setFluxoCaixa] = useState(null);
  const [indicadores, setIndicadores] = useState(null);
  const [projecoes, setProjecoes] = useState(null);

  // Funções auxiliares de data
  function getDefaultStartDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Buscar dados do dashboard
  useEffect(() => {
    fetchDashboardData();
  }, [periodo]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Usar apiService que tem retry automático e tratamento de 401
      const result = await apiService.get('/financial/dashboard', {
        startDate: periodo.inicio,
        endDate: periodo.fim
      });

      if (result.success) {
        setDre(result.data.dre);
        setFluxoCaixa(result.data.fluxoCaixa);
        setIndicadores(result.data.indicadores);
        setProjecoes(result.data.projecoes);
      } else {
        throw new Error(result.message || 'Erro ao processar dados');
      }
    } catch (err) {
      console.error('Erro ao buscar dashboard financeiro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler de mudança de período
  const handlePeriodoChange = (e) => {
    setPeriodo({
      ...periodo,
      [e.target.name]: e.target.value
    });
  };

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <h3 className="text-red-800 font-bold text-lg mb-2">Erro ao carregar dados</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Financeiro</h1>
          <p className="text-gray-600">Análises financeiras completas: DRE, Fluxo de Caixa, Indicadores e Projeções</p>
        </div>

        {/* Filtros de Período */}
        <Card className="mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                name="inicio"
                value={periodo.inicio}
                onChange={handlePeriodoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                name="fim"
                value={periodo.fim}
                onChange={handlePeriodoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Atualizar
            </button>
          </div>
        </Card>

        {/* Cards de Indicadores */}
        {indicadores && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Total de Vendas</h3>
              <p className="text-3xl font-bold">{formatCurrency(indicadores.vendas.total)}</p>
              <p className="text-sm opacity-80 mt-1">{indicadores.vendas.quantidade} vendas</p>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Margem de Lucro</h3>
              <p className="text-3xl font-bold">{indicadores.lucratividade.margemLucro}</p>
              <p className="text-sm opacity-80 mt-1">Lucro: {formatCurrency(indicadores.lucratividade.lucro)}</p>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">ROI</h3>
              <p className="text-3xl font-bold">{indicadores.lucratividade.roi}</p>
              <p className="text-sm opacity-80 mt-1">Return on Investment</p>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <h3 className="text-sm font-semibold opacity-90 mb-1">Ticket Médio</h3>
              <p className="text-3xl font-bold">{formatCurrency(indicadores.vendas.ticketMedio)}</p>
              <p className="text-sm opacity-80 mt-1">{indicadores.clientes.total} clientes</p>
            </Card>
          </div>
        )}

        {/* DRE - Demonstração de Resultado */}
        {dre && (
          <Card className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Demonstração de Resultado (DRE)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna 1: Receitas e Custos */}
              <div>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Receitas</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Receita Bruta</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(dre.receitas.receitaBruta)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outras Receitas</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(dre.receitas.outrasReceitas)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Receita Total</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(dre.receitas.receitaTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Custos</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Custo das Vendas</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(dre.custos.custoVendas)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>% da Receita</span>
                      <span>{dre.custos.percentualCusto}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Despesas</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(dre.despesas.detalhamento).map(([categoria, valor]) => (
                      <div key={categoria} className="flex justify-between">
                        <span className="capitalize">{categoria.toLowerCase()}</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(valor)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Total Despesas</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(dre.despesas.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Resultados e Margens */}
              <div>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Resultados</h3>
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Lucro Bruto</span>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(dre.resultados.lucroBruto)}
                        </span>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Lucro Operacional</span>
                        <span className="font-bold text-purple-700">
                          {formatCurrency(dre.resultados.lucroOperacional)}
                        </span>
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Lucro Líquido</span>
                        <span className="font-bold text-green-700 text-lg">
                          {formatCurrency(dre.resultados.lucroLiquido)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Margens</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Margem Bruta</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: dre.margens.margemBruta }}
                          />
                        </div>
                        <span className="font-semibold">{dre.margens.margemBruta}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Margem Operacional</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: dre.margens.margemOperacional }}
                          />
                        </div>
                        <span className="font-semibold">{dre.margens.margemOperacional}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Margem Líquida</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: dre.margens.margemLiquida }}
                          />
                        </div>
                        <span className="font-semibold">{dre.margens.margemLiquida}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Fluxo de Caixa */}
        {fluxoCaixa && fluxoCaixa.fluxo && fluxoCaixa.fluxo.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Fluxo de Caixa</h2>
            
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(fluxoCaixa.resumo.totalEntradas)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(fluxoCaixa.resumo.totalSaidas)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Saldo Final</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(fluxoCaixa.resumo.saldoFinal)}
                </p>
              </div>
            </div>

            {/* Gráfico */}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fluxoCaixa.fluxo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="entradas" stroke="#10B981" strokeWidth={2} name="Entradas" />
                <Line type="monotone" dataKey="saidas" stroke="#EF4444" strokeWidth={2} name="Saídas" />
                <Line type="monotone" dataKey="saldoAcumulado" stroke="#3B82F6" strokeWidth={2} name="Saldo Acumulado" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top Produtos */}
        {indicadores && indicadores.topProdutos && indicadores.topProdutos.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Top 5 Produtos</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Produto</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Vendas</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Quantidade</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {indicadores.topProdutos.map((produto, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{produto.produto}</td>
                      <td className="px-4 py-3 text-sm text-right">{produto.quantidadeVendas}</td>
                      <td className="px-4 py-3 text-sm text-right">{produto.quantidadeTotal}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                        {formatCurrency(produto.receitaTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Projeções */}
        {projecoes && projecoes.projecoes && projecoes.projecoes.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Projeções Financeiras</h2>
            
            {/* Informações da Base */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Média Mensal Histórica</p>
                  <p className="font-bold text-blue-700">
                    {formatCurrency(projecoes.mediasHistoricas.valorMensal)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Tendência</p>
                  <p className="font-bold text-blue-700">
                    {projecoes.mediasHistoricas.tendencia}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Observação</p>
                  <p className="font-bold text-blue-700">
                    {projecoes.observacao}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabela de Projeções */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Mês</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Valor Projetado</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Quantidade</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Confiança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projecoes.projecoes.map((proj, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{proj.mes}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                        {formatCurrency(proj.valorProjetado)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{proj.quantidadeProjetada}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          {proj.confianca}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Gráfico de Projeções */}
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projecoes.projecoes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="valorProjetado" fill="#3B82F6" name="Valor Projetado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboard;
