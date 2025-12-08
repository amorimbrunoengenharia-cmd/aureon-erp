import React, { useContext, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CardKPI from '../components/CardKPI';
import { DataContext } from '../context/DataContext';
import { parseDataBR } from '../utils/dateUtils';

export default function DashboardTab() {
  const { produtos, clientes, vendas, canaisVenda } = useContext(DataContext);
  
  // Calcular dados reais do sistema
  const totalVendas = useMemo(() => vendas.reduce((acc, v) => acc + (v.valorVenda || 0), 0), [vendas]);
  const totalLucro = useMemo(() => vendas.reduce((acc, v) => acc + (v.lucro || 0), 0), [vendas]);
  const totalEstoque = useMemo(() => produtos.reduce((acc, p) => acc + (p.estoque || 0), 0), [produtos]);
  const margemMedia = totalVendas > 0 ? ((totalLucro / totalVendas) * 100).toFixed(1) : 0;
  
  // Vendas por mês (últimos 6 meses)
  const vendasPorMes = useMemo(() => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const hoje = new Date();
    const dados = [];
    
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = meses[data.getMonth()];
      const vendasMes = vendas.filter(v => {
        const dataVenda = parseDataBR(v.data);
        return dataVenda.getMonth() === data.getMonth() && dataVenda.getFullYear() === data.getFullYear();
      });
      
      dados.push({
        month: mes,
        vendas: vendasMes.reduce((acc, v) => acc + (v.valorVenda || 0), 0),
        margem: vendasMes.reduce((acc, v) => acc + (v.lucro || 0), 0)
      });
    }
    return dados;
  }, [vendas]);
  
  // Vendas por canal
  const vendasPorCanal = useMemo(() => {
    const porCanal = {};
    vendas.forEach(v => {
      const canal = v.canal || 'Outros';
      porCanal[canal] = (porCanal[canal] || 0) + (v.valorVenda || 0);
    });
    
    const total = Object.values(porCanal).reduce((acc, val) => acc + val, 0);
    return Object.entries(porCanal).map(([name, valor]) => ({
      name,
      valor,
      percentual: total > 0 ? ((valor / total) * 100).toFixed(1) : 0
    })).sort((a, b) => b.valor - a.valor);
  }, [vendas]);

  return (
    <div style={{ padding: 24, color: '#fff' }}>
      <h2 style={{ color: '#D4AF37', marginBottom: 8 }}>Dashboard</h2>
      <p style={{ color: '#aaa' }}>Resumo geral do seu negócio</p>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16, marginBottom: 32 }}>
        <CardKPI title="Faturamento Total" value={`R$ ${totalVendas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} subtitle={`${vendas.length} vendas`} color="#D4AF37" />
        <CardKPI title="Produtos em Estoque" value={totalEstoque} subtitle={`${produtos.length} produtos`} color="#4ade80" />
        <CardKPI title="Margem Média" value={`${margemMedia}%`} subtitle={`R$ ${totalLucro.toFixed(2)} lucro`} color="#60a5fa" />
        <CardKPI title="Total de Clientes" value={clientes.length} subtitle="cadastrados" color="#c084fc" />
      </div>

      {vendas.length === 0 ? (
        <div style={{ padding: 32, background: '#0A0A0C', borderRadius: 12, border: '1px solid rgba(212, 175, 55, 0.3)', textAlign: 'center' }}>
          <p style={{ color: '#F3E5AB', fontSize: 16, marginBottom: 8 }}>📈 Nenhuma venda registrada ainda</p>
          <p style={{ color: '#888', fontSize: 14 }}>Comece registrando vendas na aba "Vendas" para ver os gráficos aqui</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
          {/* Gráfico de Vendas por Mês */}
          <div style={{ padding: 16, background: '#0A0A0C', borderRadius: 12, border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <h3 style={{ marginTop: 0, color: '#D4AF37' }}>Vendas por Mês (Últimos 6 meses)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={vendasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1d" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: '#0A0A0C', border: '1px solid #D4AF37', color: '#fff' }} formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="vendas" stroke="#D4AF37" strokeWidth={2} name="Faturamento" />
                <Line type="monotone" dataKey="margem" stroke="#4ade80" strokeWidth={2} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Vendas por Canal */}
          <div style={{ padding: 16, background: '#0A0A0C', borderRadius: 12, border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <h3 style={{ marginTop: 0, color: '#D4AF37' }}>Vendas por Canal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendasPorCanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1d" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: '#0A0A0C', border: '1px solid #D4AF37', color: '#fff' }} formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Bar dataKey="valor" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
