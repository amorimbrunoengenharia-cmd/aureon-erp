import React, { useState, useContext } from 'react';
import ButtonCustom from '../components/ButtonCustom';
import { DataContext } from '../context/DataContext';

export default function InventoryTab() {
  const { produtos, addProduto, deleteProduto, fornecedores } = useContext(DataContext);
  const [formData, setFormData] = useState({ produto: '', estoque: '', preco: '', fornecedorId: '' });
  const [busca, setBusca] = useState('');
  const [filtroEstoque, setFiltroEstoque] = useState('todos');
  const [mensagem, setMensagem] = useState('');

  const mostrarMensagem = (texto) => {
    setMensagem(texto);
    setTimeout(() => setMensagem(''), 3000);
  };

  const handleAddProduct = () => {
    if (!formData.produto || !formData.estoque || !formData.preco) {
      mostrarMensagem('⚠️ Preencha todos os campos obrigatórios');
      return;
    }
    addProduto({
      produto: formData.produto,
      estoque: parseInt(formData.estoque),
      preco: parseFloat(formData.preco),
      fornecedorId: formData.fornecedorId || null
    });
    setFormData({ produto: '', estoque: '', preco: '', fornecedorId: '' });
    mostrarMensagem('✅ Produto adicionado!');
  };

  const handleDeleteProduct = (id, nome) => {
    if (window.confirm(`Deletar produto "${nome}"?`)) {
      deleteProduto(id);
      mostrarMensagem('🗑️ Produto removido');
    }
  };

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.produto?.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro = 
      filtroEstoque === 'todos' ? true :
      filtroEstoque === 'baixo' ? (p.estoque < 10 && p.estoque > 0) :
      filtroEstoque === 'zerado' ? p.estoque === 0 :
      filtroEstoque === 'ok' ? p.estoque >= 10 : true;
    return matchBusca && matchFiltro;
  });

  const lowStockProducts = produtos.filter(p => p.estoque < 10 && p.estoque > 0);
  const outOfStockProducts = produtos.filter(p => p.estoque === 0);
  const totalEstoque = produtos.reduce((acc, p) => acc + (p.estoque || 0), 0);
  // ✅ FIX: Usar precoCusto em vez de preco
  const valorTotalEstoque = produtos.reduce((acc, p) => {
    const estoque = Number(p.estoque) || 0;
    const precoCusto = Number(p.precoCusto) || Number(p.valorCompra) || 0;
    return acc + (estoque * precoCusto);
  }, 0);

  return (
    <div style={{ padding: 24, color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: '#D4AF37', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            📦 Estoque
            <span style={{ fontSize: 12, background: 'rgba(212, 175, 55, 0.2)', padding: '2px 8px', borderRadius: 12, color: '#D4AF37' }}>
              {produtos.length} itens
            </span>
          </h2>
          <p style={{ color: '#aaa', fontSize: 14 }}>Gestão de inventário e produtos</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4ade80' }}>{produtos.length - lowStockProducts.length - outOfStockProducts.length}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>OK</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fb923c' }}>{lowStockProducts.length}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>Baixo</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f87171' }}>{outOfStockProducts.length}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>Zero</div>
          </div>
        </div>
      </div>

      {mensagem && (
        <div style={{ padding: '12px 16px', background: mensagem.includes('✅') ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 146, 60, 0.2)', border: `1px solid ${mensagem.includes('✅') ? '#4ade80' : '#fb923c'}`, borderRadius: 8, marginBottom: 16, color: mensagem.includes('✅') ? '#4ade80' : '#fb923c', fontSize: 14, animation: 'slideIn 0.3s ease' }}>
          {mensagem}
        </div>
      )}

      {/* Busca e Filtros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: 8, fontSize: 14, background: '#0A0A0C', color: '#fff', outline: 'none', transition: 'border 0.3s' }}
          onFocus={(e) => e.target.style.borderColor = '#D4AF37'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)'}
        />
        <select
          value={filtroEstoque}
          onChange={(e) => setFiltroEstoque(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: 8, fontSize: 14, background: '#0A0A0C', color: '#fff', outline: 'none', cursor: 'pointer' }}
        >
          <option value="todos">Todos os produtos</option>
          <option value="ok">Estoque OK (≥10)</option>
          <option value="baixo">Estoque Baixo (&lt;10)</option>
          <option value="zerado">Zerado</option>
        </select>
      </div>

      {/* Alertas */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div style={{ 
          padding: 12, 
          background: 'rgba(212, 175, 55, 0.15)', 
          border: '1px solid #D4AF37', 
          borderRadius: 8, 
          marginTop: 16, 
          marginBottom: 16 
        }}>
          {lowStockProducts.length > 0 && (
            <p style={{ margin: '0 0 8px 0', color: '#F3E5AB' }}>
              ⚠️ {lowStockProducts.length} produto(s) com estoque baixo
            </p>
          )}
          {outOfStockProducts.length > 0 && (
            <p style={{ margin: 0, color: '#f87171' }}>
              🔴 {outOfStockProducts.length} produto(s) fora de estoque
            </p>
          )}
        </div>
      )}

      {/* Formulário de Produto */}
      <div style={{ padding: 16, background: '#0A0A0C', borderRadius: 8, marginTop: 16, marginBottom: 16, border: '1px solid #1a1a1d' }}>
        <h3 style={{ marginTop: 0, color: '#D4AF37' }}>Adicionar Produto</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Nome do Produto *"
            value={formData.produto}
            onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
            style={{ padding: 8, border: '1px solid #1a1a1d', borderRadius: 4, fontSize: 14, background: '#030305', color: '#fff' }}
          />
          <input
            type="number"
            placeholder="Quantidade *"
            value={formData.estoque}
            onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
            style={{ padding: 8, border: '1px solid #1a1a1d', borderRadius: 4, fontSize: 14, background: '#030305', color: '#fff' }}
          />
          <input
            type="number"
            placeholder="Preço *"
            value={formData.preco}
            onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
            step="0.01"
            style={{ padding: 8, border: '1px solid #1a1a1d', borderRadius: 4, fontSize: 14, background: '#030305', color: '#fff' }}
          />
          <select
            value={formData.fornecedorId}
            onChange={(e) => setFormData({ ...formData, fornecedorId: e.target.value })}
            style={{ padding: 8, border: '1px solid #1a1a1d', borderRadius: 4, fontSize: 14, background: '#030305', color: '#fff', cursor: 'pointer' }}
          >
            <option value="">Fornecedor (Opcional)</option>
            {fornecedores.map(f => (
              <option key={f.id} value={f.id}>{f.nome || f.empresa || 'Sem nome'}</option>
            ))}
          </select>
          <ButtonCustom label="Adicionar Produto" onClick={handleAddProduct} variant="primary" />
        </div>
      </div>

      {/* Grid de Produtos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
        {produtosFiltrados.length > 0 ? (
          produtosFiltrados.map((product) => {
            const estoqueStatus = product.estoque === 0 ? 'zerado' : product.estoque < 10 ? 'baixo' : 'ok';
            const corEstoque = estoqueStatus === 'zerado' ? '#f87171' : estoqueStatus === 'baixo' ? '#fb923c' : '#4ade80';
            
            return (
              <div
                key={product.id}
                style={{
                  background: 'linear-gradient(135deg, #0A0A0C 0%, #1a1a1d 100%)',
                  border: `1px solid ${corEstoque}40`,
                  borderRadius: 12,
                  padding: 16,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 16px ${corEstoque}20`;
                  e.currentTarget.style.borderColor = corEstoque;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = `${corEstoque}40`;
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, color: '#F3E5AB', fontSize: 16, fontWeight: 'bold' }}>{product.produto}</h3>
                  <span style={{ background: `${corEstoque}20`, color: corEstoque, padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 'bold' }}>
                    {product.estoque} un.
                  </span>
                </div>
                <div style={{ marginBottom: 12, color: '#aaa', fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Preço unitário:</span>
                    <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>
                      R$ {((product.preco || product.precoVenda || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Valor total:</span>
                    <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>
                      R$ {((product.estoque || 0) * (product.preco || product.precoVenda || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: corEstoque, fontWeight: 'bold' }}>
                    {estoqueStatus === 'zerado' ? '❌ Fora de Estoque' : estoqueStatus === 'baixo' ? '⚠️ Estoque Baixo' : '✅ Estoque OK'}
                  </span>
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.produto)}
                    style={{ padding: '6px 12px', background: '#f8717140', color: '#f87171', border: '1px solid #f87171', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 'bold', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f87171';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f8717140';
                      e.target.style.color = '#f87171';
                    }}
                  >
                    🗑️ Deletar
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', padding: 32, textAlign: 'center', color: '#aaa', background: '#0A0A0C', borderRadius: 12, border: '1px solid #1a1a1d' }}>
            <p style={{ fontSize: 48, margin: 0 }}>🔍</p>
            <p style={{ fontSize: 16, marginTop: 8 }}>{busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
