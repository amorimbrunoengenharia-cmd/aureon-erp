import React, { useContext, useMemo, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { FileText, TrendingUp, Package, ShoppingBag, DollarSign, Download, Filter, Calendar, Eye, Users, Glasses, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { parseDataBR } from '../utils/dateUtils';

/**
 * Sistema de Relatórios Completo para Ótica
 * Relatórios: Vendas, Estoque, Compras, Financeiro, Receitas Médicas
 */
export default function Reports() {
  const { vendas = [], produtos = [], fornecedores = [], clientes = [], despesas = [] } = useContext(DataContext);
  const [reportType, setReportType] = useState('vendas'); // 'vendas' | 'estoque' | 'compras' | 'financeiro' | 'receitas'
  const [periodo, setPeriodo] = useState('mes'); // 'dia' | 'semana' | 'mes' | 'ano'
  const [filtroData, setFiltroData] = useState({ inicio: '', fim: '' });

  const COLORS = ['var(--aureon-gold)', 'var(--aureon-text)', 'var(--aureon-muted)', 'var(--aureon-gold)', 'var(--aureon-gold-strong)', 'var(--aureon-gold-strong)'];

  // ===== FILTROS DE DATA =====
  const dataFiltrada = useMemo(() => {
    if (!filtroData.inicio && !filtroData.fim) return vendas;
    
    return vendas.filter(venda => {
      const dataVenda = parseDataBR(venda.data);
      if (!dataVenda) return false;
      
      if (filtroData.inicio) {
        const inicio = new Date(filtroData.inicio);
        if (dataVenda < inicio) return false;
      }
      
      if (filtroData.fim) {
        const fim = new Date(filtroData.fim);
        if (dataVenda > fim) return false;
      }
      
      return true;
    });
  }, [vendas, filtroData]);

  // ===== CÁLCULOS FINANCEIROS =====
  const calculos = useMemo(() => {
    const totalVendas = dataFiltrada.reduce((acc, v) => acc + (v.valorVenda || 0), 0);
    const totalCusto = dataFiltrada.reduce((acc, v) => {
      const produto = produtos.find(p => p.nome === v.produto);
      return acc + ((produto?.preco || 0) * 0.6); // Assumindo 40% de margem
    }, 0);
    const totalLucro = dataFiltrada.reduce((acc, v) => acc + (v.lucro || 0), 0);
    const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor || 0), 0);
    const lucroLiquido = totalLucro - totalDespesas;

    // Estoque
    const valorEstoque = produtos.reduce((acc, p) => acc + ((p.estoque || 0) * (p.preco || 0)), 0);
    const produtosBaixoEstoque = produtos.filter(p => (p.estoque || 0) < 10).length;
    const produtosSemEstoque = produtos.filter(p => (p.estoque || 0) === 0).length;

    // Produtos para ótica
    const produtosOculos = produtos.filter(p => p.tipo === 'Óculos' || p.nome?.toLowerCase().includes('oculos') || p.nome?.toLowerCase().includes('óculos'));
    const produtosLentes = produtos.filter(p => p.tipo === 'Lentes' || p.nome?.toLowerCase().includes('lente'));
    const produtosArmacoes = produtos.filter(p => p.tipo === 'Armações' || p.nome?.toLowerCase().includes('armação') || p.nome?.toLowerCase().includes('armacao'));

    // Compras (baseado em fornecedores)
    const totalItensComprados = fornecedores.reduce((acc, f) => {
      return acc + (f.itens?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0);
    }, 0);

    return {
      totalVendas,
      totalCusto,
      totalLucro,
      totalDespesas,
      lucroLiquido,
      margemLucro: totalVendas > 0 ? ((totalLucro / totalVendas) * 100).toFixed(1) : 0,
      valorEstoque,
      produtosBaixoEstoque,
      produtosSemEstoque,
      totalItensComprados,
      produtosOculos,
      produtosLentes,
      produtosArmacoes,
      ticketMedio: dataFiltrada.length > 0 ? (totalVendas / dataFiltrada.length).toFixed(2) : 0
    };
  }, [dataFiltrada, produtos, despesas, fornecedores]);

  // ===== VENDAS POR CATEGORIA (ÓTICA) =====
  const vendasPorCategoria = useMemo(() => {
    const categorias = {};
    
    dataFiltrada.forEach(venda => {
      const produto = produtos.find(p => p.nome === venda.produto);
      let categoria = 'Outros';
      
      if (produto) {
        if (produto.tipo) {
          categoria = produto.tipo;
        } else {
          const nome = produto.nome.toLowerCase();
          if (nome.includes('oculos') || nome.includes('óculos')) categoria = 'Óculos';
          else if (nome.includes('lente')) categoria = 'Lentes';
          else if (nome.includes('armação') || nome.includes('armacao')) categoria = 'Armações';
          else if (nome.includes('solar') || nome.includes('sol')) categoria = 'Óculos de Sol';
          else if (nome.includes('grau')) categoria = 'Óculos de Grau';
        }
      }
      
      categorias[categoria] = (categorias[categoria] || 0) + (venda.valorVenda || 0);
    });
    
    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  }, [dataFiltrada, produtos]);

  // ===== VENDAS POR PERÍODO =====
  const vendasPorMes = useMemo(() => {
    const meses = {};
    
    dataFiltrada.forEach(venda => {
      const data = parseDataBR(venda.data);
      if (!data) return;
      
      const mesAno = `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
      
      if (!meses[mesAno]) {
        meses[mesAno] = { mes: mesAno, vendas: 0, lucro: 0, quantidade: 0 };
      }
      
      meses[mesAno].vendas += venda.valorVenda || 0;
      meses[mesAno].lucro += venda.lucro || 0;
      meses[mesAno].quantidade += 1;
    });
    
    return Object.values(meses).sort((a, b) => {
      const [mesA, anoA] = a.mes.split('/');
      const [mesB, anoB] = b.mes.split('/');
      return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
    });
  }, [dataFiltrada]);

  // ===== TOP PRODUTOS =====
  const topProdutos = useMemo(() => {
    const produtosVendidos = {};
    
    dataFiltrada.forEach(venda => {
      if (!produtosVendidos[venda.produto]) {
        produtosVendidos[venda.produto] = { nome: venda.produto, quantidade: 0, valor: 0 };
      }
      produtosVendidos[venda.produto].quantidade += 1;
      produtosVendidos[venda.produto].valor += venda.valorVenda || 0;
    });
    
    return Object.values(produtosVendidos)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [dataFiltrada]);

  // ===== DESPESAS POR TIPO =====
  const despesasPorTipo = useMemo(() => {
    const tipos = {};
    
    despesas.forEach(despesa => {
      const tipo = despesa.tipo || 'Outros';
      tipos[tipo] = (tipos[tipo] || 0) + (despesa.valor || 0);
    });
    
    return Object.entries(tipos).map(([name, value]) => ({ name, value }));
  }, [despesas]);

  // ===== FORMATADORES =====
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const exportToCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + data;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ===== RENDER RELATÓRIOS =====
  const renderRelatorioVendas = () => (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[var(--aureon-gold)]/20 to-aureon-bg border border-aureon-gold/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Total Vendas</span>
            <DollarSign size={20} className="text-aureon-gold" />
          </div>
          <p className="text-3xl font-bold text-aureon-gold">{formatCurrency(calculos.totalVendas)}</p>
          <p className="text-xs text-aureon-text/60 mt-1">{dataFiltrada.length} transações</p>
        </div>

        <div className="bg-gradient-to-br from-green-400/20 to-aureon-bg border border-green-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Lucro Total</span>
            <TrendingUp size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(calculos.totalLucro)}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Margem: {calculos.margemLucro}%</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400/20 to-aureon-bg border border-blue-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Ticket Médio</span>
            <ShoppingBag size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">{formatCurrency(calculos.ticketMedio)}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Por transação</p>
        </div>

        <div className="bg-gradient-to-br from-purple-400/20 to-aureon-bg border border-purple-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Clientes</span>
            <Users size={20} className="text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-purple-400">{clientes.length}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Base total</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Mês */}
        <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
          <h3 className="text-aureon-gold font-serif text-lg mb-4">Evolução de Vendas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={vendasPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--aureon-gold)" opacity={0.1} />
              <XAxis dataKey="mes" stroke="var(--aureon-text)" />
              <YAxis stroke="var(--aureon-text)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--aureon-surface)', border: '1px solid var(--aureon-gold)' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Area type="monotone" dataKey="vendas" stroke="var(--aureon-gold)" fill="var(--aureon-gold)" fillOpacity={0.3} name="Vendas" />
              <Area type="monotone" dataKey="lucro" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Lucro" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vendas por Categoria */}
        <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
          <h3 className="text-aureon-gold font-serif text-lg mb-4">Vendas por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vendasPorCategoria}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {vendasPorCategoria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Produtos */}
      <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
        <h3 className="text-aureon-gold font-serif text-lg mb-4">Top 10 Produtos Mais Vendidos</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-aureon-gold/20">
                <th className="text-left py-3 px-4 text-aureon-text">Produto</th>
                <th className="text-center py-3 px-4 text-aureon-text">Quantidade</th>
                <th className="text-right py-3 px-4 text-aureon-text">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {topProdutos.map((produto, index) => (
                <tr key={index} className="border-b border-aureon-gold/10 hover:bg-aureon-gold/5">
                  <td className="py-3 px-4 text-aureon-text">{produto.nome}</td>
                  <td className="py-3 px-4 text-center text-aureon-text">{produto.quantidade}</td>
                  <td className="py-3 px-4 text-right text-aureon-gold font-semibold">{formatCurrency(produto.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRelatorioEstoque = () => (
    <div className="space-y-6">
      {/* KPIs Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[var(--aureon-gold)]/20 to-aureon-bg border border-aureon-gold/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Valor em Estoque</span>
            <Package size={20} className="text-aureon-gold" />
          </div>
          <p className="text-3xl font-bold text-aureon-gold">{formatCurrency(calculos.valorEstoque)}</p>
          <p className="text-xs text-aureon-text/60 mt-1">{produtos.length} produtos</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400/20 to-aureon-bg border border-blue-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Óculos</span>
            <Glasses size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">{calculos.produtosOculos.length}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Em estoque</p>
        </div>

        <div className="bg-gradient-to-br from-orange-400/20 to-aureon-bg border border-orange-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Baixo Estoque</span>
            <AlertCircle size={20} className="text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-orange-400">{calculos.produtosBaixoEstoque}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Menos de 10 unidades</p>
        </div>

        <div className="bg-gradient-to-br from-red-400/20 to-aureon-bg border border-red-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Sem Estoque</span>
            <TrendingDown size={20} className="text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">{calculos.produtosSemEstoque}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Reposição urgente</p>
        </div>
      </div>

      {/* Tabela de Estoque por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Óculos */}
        <div className="bg-aureon-surface border border-blue-400/30 rounded-xl p-6">
          <h3 className="text-blue-400 font-serif text-lg mb-4 flex items-center gap-2">
            <Glasses size={20} />
            Óculos ({calculos.produtosOculos.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {calculos.produtosOculos.map((produto, index) => (
              <div key={index} className="bg-aureon-bg p-3 rounded border border-blue-400/10">
                <div className="flex justify-between items-center">
                  <span className="text-aureon-text text-sm">{produto.nome}</span>
                  <span className={`font-bold ${(produto.estoque || 0) < 10 ? 'text-orange-400' : 'text-blue-400'}`}>
                    {produto.estoque || 0}
                  </span>
                </div>
                <div className="text-xs text-aureon-text/60 mt-1">{formatCurrency(produto.preco || 0)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lentes */}
        <div className="bg-aureon-surface border border-green-400/30 rounded-xl p-6">
          <h3 className="text-green-400 font-serif text-lg mb-4 flex items-center gap-2">
            <Eye size={20} />
            Lentes ({calculos.produtosLentes.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {calculos.produtosLentes.map((produto, index) => (
              <div key={index} className="bg-aureon-bg p-3 rounded border border-green-400/10">
                <div className="flex justify-between items-center">
                  <span className="text-aureon-text text-sm">{produto.nome}</span>
                  <span className={`font-bold ${(produto.estoque || 0) < 10 ? 'text-orange-400' : 'text-green-400'}`}>
                    {produto.estoque || 0}
                  </span>
                </div>
                <div className="text-xs text-aureon-text/60 mt-1">{formatCurrency(produto.preco || 0)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Armações */}
        <div className="bg-aureon-surface border border-purple-400/30 rounded-xl p-6">
          <h3 className="text-purple-400 font-serif text-lg mb-4 flex items-center gap-2">
            <Package size={20} />
            Armações ({calculos.produtosArmacoes.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {calculos.produtosArmacoes.map((produto, index) => (
              <div key={index} className="bg-aureon-bg p-3 rounded border border-purple-400/10">
                <div className="flex justify-between items-center">
                  <span className="text-aureon-text text-sm">{produto.nome}</span>
                  <span className={`font-bold ${(produto.estoque || 0) < 10 ? 'text-orange-400' : 'text-purple-400'}`}>
                    {produto.estoque || 0}
                  </span>
                </div>
                <div className="text-xs text-aureon-text/60 mt-1">{formatCurrency(produto.preco || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista Completa de Estoque */}
      <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
        <h3 className="text-aureon-gold font-serif text-lg mb-4">Inventário Completo</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-aureon-gold/20">
                <th className="text-left py-3 px-4 text-aureon-text">Produto</th>
                <th className="text-left py-3 px-4 text-aureon-text">Tipo</th>
                <th className="text-center py-3 px-4 text-aureon-text">Estoque</th>
                <th className="text-right py-3 px-4 text-aureon-text">Preço Unit.</th>
                <th className="text-right py-3 px-4 text-aureon-text">Valor Total</th>
                <th className="text-center py-3 px-4 text-aureon-text">Status</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto, index) => {
                const estoque = produto.estoque || 0;
                const valorTotal = estoque * (produto.preco || 0);
                let status = 'ok';
                if (estoque === 0) status = 'sem';
                else if (estoque < 10) status = 'baixo';
                
                return (
                  <tr key={index} className="border-b border-aureon-gold/10 hover:bg-aureon-gold/5">
                    <td className="py-3 px-4 text-aureon-text">{produto.nome}</td>
                    <td className="py-3 px-4 text-aureon-text/70">{produto.tipo || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${
                        status === 'sem' ? 'text-red-400' : 
                        status === 'baixo' ? 'text-orange-400' : 
                        'text-green-400'
                      }`}>
                        {estoque}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-aureon-text">{formatCurrency(produto.preco)}</td>
                    <td className="py-3 px-4 text-right text-aureon-gold font-semibold">{formatCurrency(valorTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        status === 'sem' ? 'bg-red-400/20 text-red-400' : 
                        status === 'baixo' ? 'bg-orange-400/20 text-orange-400' : 
                        'bg-green-400/20 text-green-400'
                      }`}>
                        {status === 'sem' ? 'SEM ESTOQUE' : status === 'baixo' ? 'BAIXO' : 'OK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRelatorioCompras = () => (
    <div className="space-y-6">
      {/* KPIs Compras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[var(--aureon-gold)]/20 to-aureon-bg border border-aureon-gold/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Fornecedores</span>
            <ShoppingBag size={20} className="text-aureon-gold" />
          </div>
          <p className="text-3xl font-bold text-aureon-gold">{fornecedores.length}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Ativos</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400/20 to-aureon-bg border border-blue-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Itens Comprados</span>
            <Package size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">{calculos.totalItensComprados}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Total de unidades</p>
        </div>

        <div className="bg-gradient-to-br from-green-400/20 to-aureon-bg border border-green-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Produtos Vinculados</span>
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">
            {produtos.filter(p => p.fornecedorId).length}
          </p>
          <p className="text-xs text-aureon-text/60 mt-1">Com fornecedor</p>
        </div>
      </div>

      {/* Lista de Fornecedores */}
      <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
        <h3 className="text-aureon-gold font-serif text-lg mb-4">Fornecedores e Estoque</h3>
        <div className="space-y-4">
          {fornecedores.map((fornecedor, index) => {
            const totalItens = fornecedor.itens?.reduce((acc, item) => acc + (item.quantidade || 0), 0) || 0;
            
            return (
              <div key={index} className="bg-aureon-bg border border-aureon-gold/20 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-aureon-gold font-semibold text-lg">{fornecedor.nome}</h4>
                    <p className="text-aureon-text/70 text-sm">{fornecedor.contato}</p>
                    {fornecedor.tipo && (
                      <span className="inline-block mt-1 px-2 py-1 bg-aureon-gold/20 text-aureon-gold text-xs rounded">
                        {fornecedor.tipo}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-aureon-gold">{totalItens}</p>
                    <p className="text-xs text-aureon-text/60">Unidades</p>
                  </div>
                </div>
                
                {fornecedor.itens && fornecedor.itens.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-aureon-text/70 text-sm font-semibold">Itens Disponíveis:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {fornecedor.itens.map((item, idx) => (
                        <div key={idx} className="bg-aureon-surface p-2 rounded border border-aureon-gold/10">
                          <div className="flex justify-between items-center">
                            <span className="text-aureon-text text-sm">{item.modelo}</span>
                            <span className="text-aureon-gold font-semibold text-sm">
                              {item.quantidade} un
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderRelatorioFinanceiro = () => (
    <div className="space-y-6">
      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-400/20 to-aureon-bg border border-green-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Receita</span>
            <TrendingUp size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(calculos.totalVendas)}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Total vendas</p>
        </div>

        <div className="bg-gradient-to-br from-red-400/20 to-aureon-bg border border-red-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Despesas</span>
            <TrendingDown size={20} className="text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">{formatCurrency(calculos.totalDespesas)}</p>
          <p className="text-xs text-aureon-text/60 mt-1">{despesas.length} lançamentos</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400/20 to-aureon-bg border border-blue-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Lucro Bruto</span>
            <DollarSign size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">{formatCurrency(calculos.totalLucro)}</p>
          <p className="text-xs text-aureon-text/60 mt-1">Margem: {calculos.margemLucro}%</p>
        </div>

        <div className={`bg-gradient-to-br ${calculos.lucroLiquido >= 0 ? 'from-[var(--aureon-gold)]/20 border-aureon-gold/30' : 'from-orange-400/20 border-orange-400/30'} to-aureon-bg border rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Lucro Líquido</span>
            <DollarSign size={20} className={calculos.lucroLiquido >= 0 ? 'text-aureon-gold' : 'text-orange-400'} />
          </div>
          <p className={`text-3xl font-bold ${calculos.lucroLiquido >= 0 ? 'text-aureon-gold' : 'text-orange-400'}`}>
            {formatCurrency(calculos.lucroLiquido)}
          </p>
          <p className="text-xs text-aureon-text/60 mt-1">Receita - Despesas</p>
        </div>
      </div>

      {/* Gráfico Receita vs Despesas */}
      <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
        <h3 className="text-aureon-gold font-serif text-lg mb-4">Análise Financeira por Período</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vendasPorMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--aureon-gold)" opacity={0.1} />
            <XAxis dataKey="mes" stroke="var(--aureon-text)" />
            <YAxis stroke="var(--aureon-text)" />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--aureon-surface)', border: '1px solid var(--aureon-gold)' }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
            <Bar dataKey="vendas" fill="#10B981" name="Receita" />
            <Bar dataKey="lucro" fill="var(--aureon-gold)" name="Lucro" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Despesas por Tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
          <h3 className="text-aureon-gold font-serif text-lg mb-4">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={despesasPorTipo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {despesasPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6">
          <h3 className="text-aureon-gold font-serif text-lg mb-4">Detalhamento de Despesas</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {despesas.map((despesa, index) => (
              <div key={index} className="bg-aureon-bg p-3 rounded border border-red-400/10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-aureon-text font-semibold">{despesa.descricao || 'Despesa'}</p>
                    <p className="text-xs text-aureon-text/60">{despesa.tipo || 'Outros'}</p>
                    {despesa.data && <p className="text-xs text-aureon-text/50">{despesa.data}</p>}
                  </div>
                  <span className="text-red-400 font-bold">{formatCurrency(despesa.valor)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRelatorioReceitas = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-400/20 to-aureon-bg border border-blue-400/30 rounded-xl p-8 text-center">
        <Eye size={48} className="text-blue-400 mx-auto mb-4" />
        <h3 className="text-2xl font-serif text-blue-400 mb-2">Sistema de Receitas Médicas</h3>
        <p className="text-aureon-text/70 mb-4">
          Funcionalidade em desenvolvimento para gestão completa de receitas oftalmológicas
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-left">
          <div className="bg-aureon-surface p-4 rounded border border-blue-400/20">
            <h4 className="text-aureon-gold font-semibold mb-2">Recursos Planejados:</h4>
            <ul className="text-aureon-text/70 text-sm space-y-1">
              <li>• Cadastro de receitas com OD/OE</li>
              <li>• Grau esférico e cilíndrico</li>
              <li>• Eixo e distância pupilar</li>
              <li>• Tipo de lente recomendada</li>
              <li>• Histórico de receitas por cliente</li>
            </ul>
          </div>
          <div className="bg-aureon-surface p-4 rounded border border-blue-400/20">
            <h4 className="text-aureon-gold font-semibold mb-2">Integrações:</h4>
            <ul className="text-aureon-text/70 text-sm space-y-1">
              <li>• Vinculação automática com clientes</li>
              <li>• Sugestão de produtos baseado em receita</li>
              <li>• Alertas de validade de receita</li>
              <li>• Relatórios de prescrições mais comuns</li>
              <li>• Export para sistema de laboratório</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg via-aureon-surface to-aureon-bg text-aureon-text p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-aureon-gold mb-2 flex items-center gap-3">
            <FileText size={36} />
            Relatórios - Sistema Ótica
          </h1>
          <p className="text-aureon-text/70">
            Sistema completo de relatórios gerenciais para gestão de ótica
          </p>
        </div>

        {/* Navegação e Filtros */}
        <div className="bg-aureon-surface border border-aureon-gold/20 rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Tipo de Relatório */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setReportType('vendas')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  reportType === 'vendas'
                    ? 'bg-aureon-gold text-aureon-bg'
                    : 'bg-aureon-bg text-aureon-text border border-aureon-gold/20 hover:border-aureon-gold'
                }`}
              >
                <ShoppingBag size={18} />
                Vendas
              </button>
              <button
                onClick={() => setReportType('estoque')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  reportType === 'estoque'
                    ? 'bg-aureon-gold text-aureon-bg'
                    : 'bg-aureon-bg text-aureon-text border border-aureon-gold/20 hover:border-aureon-gold'
                }`}
              >
                <Package size={18} />
                Estoque
              </button>
              <button
                onClick={() => setReportType('compras')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  reportType === 'compras'
                    ? 'bg-aureon-gold text-aureon-bg'
                    : 'bg-aureon-bg text-aureon-text border border-aureon-gold/20 hover:border-aureon-gold'
                }`}
              >
                <ShoppingBag size={18} />
                Compras
              </button>
              <button
                onClick={() => setReportType('financeiro')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  reportType === 'financeiro'
                    ? 'bg-aureon-gold text-aureon-bg'
                    : 'bg-aureon-bg text-aureon-text border border-aureon-gold/20 hover:border-aureon-gold'
                }`}
              >
                <DollarSign size={18} />
                Financeiro
              </button>
              <button
                onClick={() => setReportType('receitas')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  reportType === 'receitas'
                    ? 'bg-aureon-gold text-aureon-bg'
                    : 'bg-aureon-bg text-aureon-text border border-aureon-gold/20 hover:border-aureon-gold'
                }`}
              >
                <Eye size={18} />
                Receitas
              </button>
            </div>

            {/* Filtros de Data */}
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-aureon-gold" />
              <input
                type="date"
                value={filtroData.inicio}
                onChange={(e) => setFiltroData({ ...filtroData, inicio: e.target.value })}
                className="bg-aureon-bg border border-aureon-gold/20 rounded px-3 py-2 text-aureon-text text-sm focus:border-aureon-gold outline-none"
              />
              <span className="text-aureon-text/70">até</span>
              <input
                type="date"
                value={filtroData.fim}
                onChange={(e) => setFiltroData({ ...filtroData, fim: e.target.value })}
                className="bg-aureon-bg border border-aureon-gold/20 rounded px-3 py-2 text-aureon-text text-sm focus:border-aureon-gold outline-none"
              />
              <button
                onClick={() => setFiltroData({ inicio: '', fim: '' })}
                className="px-3 py-2 bg-red-400/20 text-red-400 rounded hover:bg-red-400/30 transition-all text-sm"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo do Relatório */}
        <div>
          {reportType === 'vendas' && renderRelatorioVendas()}
          {reportType === 'estoque' && renderRelatorioEstoque()}
          {reportType === 'compras' && renderRelatorioCompras()}
          {reportType === 'financeiro' && renderRelatorioFinanceiro()}
          {reportType === 'receitas' && renderRelatorioReceitas()}
        </div>

        {/* Botão Export */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              alert('Função de exportação será implementada com integração de backend');
            }}
            className="px-6 py-3 bg-aureon-gold text-aureon-bg font-bold rounded-lg hover:bg-aureon-text transition-all flex items-center gap-2"
          >
            <Download size={20} />
            Exportar Relatório
          </button>
        </div>
      </div>
    </div>
  );
}

