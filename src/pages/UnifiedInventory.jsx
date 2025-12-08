import React, { useContext, useMemo, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { useAuth } from '../context/AuthContextAPI';
import { Package, TrendingUp, Users, AlertTriangle, Plus, Edit, Trash2, CheckCircle, X, Lock } from 'lucide-react';
import { formatCurrency } from '../utils/productUtils';

// ========== COMPONENTE: PRODUTOS ==========
function InventoryTab() {
  const { produtos, addProduto, updateProduto, deleteProduto, fornecedores } = useContext(DataContext);
  const { getCurrentRole, hasPermission, getUserSettings, currentUser, isFieldVisible, isFieldEditable } = useAuth();
  const [novoProduto, setNovoProduto] = useState({ 
    produto: '', 
    estoque: '', 
    valorCompra: '', // ✅ Valor de compra
    valorVenda: '',  // ✅ Valor de venda
    preco: '',       // Compatibilidade
    fornecedorId: null,
    itemFornecedor: '',
    modelo: ''
  });
  const [editando, setEditando] = useState(null);

  // ✅ RBAC: Permissões e UI restrictions
  const role = getCurrentRole();
  const userSettings = getUserSettings();
  const canCreate = hasPermission('produtos', 'create');
  const canUpdate = hasPermission('produtos', 'update');
  const canDelete = hasPermission('produtos', 'delete');
  const ocultarValores = userSettings.ocultarValores === true && currentUser.role === 'ESTOQUE';

  const handleAdd = () => {
    // ✅ RBAC: Verificar permissão
    if (!canCreate) {
      alert('❌ Você não tem permissão para criar produtos');
      return;
    }

    // ✅ Validação: Todos os campos obrigatórios (NOT NULL)
    if (!novoProduto.produto || !novoProduto.estoque || !novoProduto.valorCompra || 
        !(novoProduto.valorVenda || novoProduto.preco) || !novoProduto.fornecedorId) {
      alert('⚠️ Preencha TODOS os campos obrigatórios:\n- Nome do Produto\n- Quantidade em Estoque\n- Valor de Compra\n- Valor de Venda\n- Fornecedor');
      return;
    }

    addProduto({
      ...novoProduto,
      estoque: parseInt(novoProduto.estoque),
      valorCompra: parseFloat(novoProduto.valorCompra),
      valorVenda: parseFloat(novoProduto.valorVenda || novoProduto.preco),
      preco: parseFloat(novoProduto.valorVenda || novoProduto.preco) // Compatibilidade
    });
    setNovoProduto({ produto: '', estoque: '', valorCompra: '', valorVenda: '', preco: '', fornecedorId: null, itemFornecedor: '', modelo: '' });
  };

  const getStatusColor = (estoque) => {
    if (estoque === 0) return 'text-red-400';
    if (estoque < 10) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = (estoque) => {
    if (estoque === 0) return '❌';
    if (estoque < 10) return '⚠️';
    return '✅';
  };

  // Cálculos de KPIs
  const totalProdutos = produtos.length;
  const totalEstoque = produtos.reduce((acc, p) => acc + (p.estoque || 0), 0);
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + ((p.estoque || 0) * (p.preco || 0)), 0);
  const produtosOK = produtos.filter(p => p.estoque >= 10).length;
  const produtosBaixo = produtos.filter(p => p.estoque > 0 && p.estoque < 10).length;
  const produtosZero = produtos.filter(p => p.estoque === 0).length;

  return (
    <div className="space-y-6">
      {/* KPIs de Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[var(--aureon-gold)]/10 to-aureon-surface border border-aureon-gold/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Total Produtos</span>
            <Package size={24} className="text-aureon-gold" />
          </div>
          <div className="text-3xl font-bold text-aureon-gold mb-1">{totalProdutos}</div>
          <div className="text-xs text-aureon-text/70">Produtos cadastrados</div>
        </div>

        <div className="bg-gradient-to-br from-blue-400/10 to-aureon-surface border border-blue-400/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Estoque Total</span>
            <TrendingUp size={24} className="text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">{totalEstoque}</div>
          <div className="text-xs text-aureon-text/70">Unidades em estoque</div>
        </div>

        <div className="bg-gradient-to-br from-green-400/10 to-aureon-surface border border-green-400/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Valor Total</span>
            <Package size={24} className="text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">
            R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-aureon-text/70">Valor total do estoque</div>
        </div>

        <div className="bg-gradient-to-br from-purple-400/10 to-aureon-surface border border-purple-400/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Status</span>
            <AlertTriangle size={24} className="text-purple-400" />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">{produtosOK}</div>
              <div className="text-xs text-aureon-text/70">OK</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-400">{produtosBaixo}</div>
              <div className="text-xs text-aureon-text/70">Baixo</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-400">{produtosZero}</div>
              <div className="text-xs text-aureon-text/70">Zero</div>
            </div>
          </div>
        </div>
      </div>
      {/* Formulário de Adição */}
      <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-aureon-gold mb-4 flex items-center gap-2">
          <Plus size={24} />
          Cadastrar Novo Produto
        </h3>
        <p className="text-sm text-aureon-text/70 mb-4">
          ✅ Todos os campos são obrigatórios para garantir integridade dos dados
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nome do Produto *"
            value={novoProduto.produto}
            onChange={(e) => setNovoProduto({ ...novoProduto, produto: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          />
          <input
            type="number"
            placeholder="Quantidade Estoque *"
            value={novoProduto.estoque}
            onChange={(e) => setNovoProduto({ ...novoProduto, estoque: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          />
          <input
            type="number"
            step="0.01"
            placeholder="💵 Valor de Compra (R$) *"
            value={novoProduto.valorCompra}
            onChange={(e) => setNovoProduto({ ...novoProduto, valorCompra: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-green-400/20 rounded-lg text-aureon-text focus:outline-none focus:border-green-400"
          />
          <input
            type="number"
            step="0.01"
            placeholder="💰 Valor de Venda (R$) *"
            value={novoProduto.valorVenda}
            onChange={(e) => setNovoProduto({ ...novoProduto, valorVenda: e.target.value, preco: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select
            value={novoProduto.fornecedorId || ''}
            onChange={(e) => {
              setNovoProduto({ 
                ...novoProduto, 
                fornecedorId: e.target.value || null,
                itemFornecedor: ''
              });
            }}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          >
            <option value="">Selecione o Fornecedor</option>
            {fornecedores.map((f, idx) => (
              <option key={idx} value={f.nome}>
                {f.nome} {f.tipo && `(${f.tipo})`}
              </option>
            ))}
          </select>

          {novoProduto.fornecedorId && (() => {
            const fornecedor = fornecedores.find(f => f.nome === novoProduto.fornecedorId);
            const itens = fornecedor?.itens || [];
            return itens.length > 0 ? (
              <select
                value={novoProduto.itemFornecedor}
                onChange={(e) => {
                  const itemSelecionado = itens.find(i => i.modelo === e.target.value);
                  setNovoProduto({ 
                    ...novoProduto, 
                    itemFornecedor: e.target.value,
                    modelo: itemSelecionado?.modelo || ''
                  });
                }}
                className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
              >
                <option value="">Selecione o Modelo</option>
                {itens.map((item, idx) => (
                  <option key={idx} value={item.modelo}>
                    {fornecedor.tipo}: {item.modelo} (Qtd: {item.quantidade})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-yellow-400 text-sm p-2 bg-yellow-400/10 rounded border border-yellow-400/30 flex items-center">
                ⚠️ Este fornecedor não possui itens cadastrados
              </div>
            );
          })()}
        </div>

        <button
          onClick={handleAdd}
          className="w-full px-6 py-2 bg-aureon-gold text-aureon-bg font-bold rounded-lg hover:bg-aureon-text transition-all"
        >
          <Plus size={20} className="inline mr-2" />
          Adicionar Produto
        </button>
      </div>

      {/* Tabela de Produtos - Grid Completa */}
      <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl overflow-hidden">
        <div className="p-4 bg-aureon-gold/5 border-b border-aureon-gold/20">
          <h3 className="text-lg font-bold text-aureon-gold flex items-center gap-2">
            <Package size={20} />
            Listagem Completa de Produtos
          </h3>
          <p className="text-xs text-aureon-text/70 mt-1">
            ✅ Grid com todos os dados obrigatórios | 🔓 Apenas "Quantidade" é editável
          </p>
        </div>
        <table className="w-full">
          <thead className="bg-aureon-gold/10">
            <tr>
              <th className="px-4 py-3 text-left text-aureon-gold font-bold text-sm">ID</th>
              {isFieldVisible('nome') && <th className="px-4 py-3 text-left text-aureon-gold font-bold text-sm">Nome do Produto</th>}
              {isFieldVisible('tipo') && <th className="px-4 py-3 text-left text-aureon-gold font-bold text-sm">Tipo</th>}
              {isFieldVisible('modelo') && <th className="px-4 py-3 text-left text-aureon-gold font-bold text-sm">Modelo</th>}
              {isFieldVisible('precoCusto') && <th className="px-4 py-3 text-center text-aureon-gold font-bold text-sm">💵 Preço Custo</th>}
              {isFieldVisible('precoImportacao') && <th className="px-4 py-3 text-center text-aureon-gold font-bold text-sm">🚚 Preço Importação</th>}
              {isFieldVisible('precoVenda') && <th className="px-4 py-3 text-center text-aureon-gold font-bold text-sm">💰 Preço Venda</th>}
              {isFieldVisible('lucro') && <th className="px-4 py-3 text-center text-green-400 font-bold text-sm">📊 Lucro</th>}
              {isFieldVisible('estoque') && <th className="px-4 py-3 text-center text-aureon-gold font-bold text-sm">
                {isFieldEditable('estoque') ? '🔓 Estoque (Editável)' : '📦 Estoque'}
              </th>}
              {isFieldVisible('quantidadeComprada') && <th className="px-4 py-3 text-center text-aureon-gold font-bold text-sm">
                {isFieldEditable('quantidadeComprada') ? '🔓 Qtd Comprada' : '📥 Qtd Comprada'}
              </th>}
              {isFieldVisible('fornecedorId') && <th className="px-4 py-3 text-left text-aureon-gold font-bold text-sm">🏢 Fornecedor</th>}
              {canDelete && <th className="px-4 py-3 text-center text-aureon-gold font-bold text-sm">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto, idx) => {
              const precoCusto = produto.precoCusto || produto.valorCompra || 0;
              const precoImportacao = produto.precoImportacao || 0;
              const precoVenda = produto.precoVenda || produto.valorVenda || produto.preco || 0;
              const lucro = produto.lucro || (precoVenda - precoCusto - precoImportacao);
              
              return (
              <tr key={idx} className="border-t border-aureon-gold/10 hover:bg-aureon-gold/5 transition-all">
                {/* ID (Sempre visível) */}
                <td className="px-4 py-3 text-aureon-text/70 text-xs font-mono">
                  #{produto.id || idx}
                </td>
                
                {/* Nome */}
                {isFieldVisible('nome') && (
                  <td className="px-4 py-3 text-aureon-text font-semibold">
                    {produto.produto || produto.nome}
                    {!isFieldEditable('nome') && <Lock size={12} className="inline ml-2 text-aureon-text/40" />}
                  </td>
                )}
                
                {/* Tipo */}
                {isFieldVisible('tipo') && (
                  <td className="px-4 py-3 text-aureon-text/80">
                    {produto.tipo || '-'}
                  </td>
                )}
                
                {/* Modelo */}
                {isFieldVisible('modelo') && (
                  <td className="px-4 py-3 text-aureon-text/80">
                    {produto.modelo || '-'}
                  </td>
                )}
                
                {/* Preço de Custo */}
                {isFieldVisible('precoCusto') && (
                  <td className="px-4 py-3 text-center text-orange-400 font-semibold">
                    {formatCurrency(precoCusto)}
                    {!isFieldEditable('precoCusto') && <Lock size={12} className="inline ml-2 text-aureon-text/40" />}
                  </td>
                )}
                
                {/* Preço de Importação */}
                {isFieldVisible('precoImportacao') && (
                  <td className="px-4 py-3 text-center text-blue-400 font-semibold">
                    {formatCurrency(precoImportacao)}
                    {!isFieldEditable('precoImportacao') && <Lock size={12} className="inline ml-2 text-aureon-text/40" />}
                  </td>
                )}
                
                {/* Preço de Venda */}
                {isFieldVisible('precoVenda') && (
                  <td className="px-4 py-3 text-center text-aureon-gold font-bold">
                    {isFieldEditable('precoVenda') && editando === `precoVenda-${idx}` ? (
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={precoVenda}
                        onBlur={(e) => {
                          updateProduto(produto.id, { precoVenda: parseFloat(e.target.value) || 0 });
                          setEditando(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateProduto(produto.id, { precoVenda: parseFloat(e.target.value) || 0 });
                            setEditando(null);
                          }
                        }}
                        autoFocus
                        className="w-24 px-2 py-1 bg-aureon-bg border-2 border-aureon-gold rounded text-center text-aureon-text font-bold focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => isFieldEditable('precoVenda') && setEditando(`precoVenda-${idx}`)}
                        disabled={!isFieldEditable('precoVenda')}
                        className={`px-2 py-1 rounded ${isFieldEditable('precoVenda') ? 'hover:bg-aureon-gold/10 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                      >
                        {formatCurrency(precoVenda)}
                        {!isFieldEditable('precoVenda') && <Lock size={12} className="inline ml-2" />}
                      </button>
                    )}
                  </td>
                )}
                
                {/* Lucro (Campo virtual calculado) */}
                {isFieldVisible('lucro') && (
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded font-bold text-xs ${
                      lucro >= 50 ? 'bg-green-400/20 text-green-400' :
                      lucro >= 20 ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-red-400/20 text-red-400'
                    }`}>
                      {formatCurrency(lucro)}
                    </span>
                  </td>
                )}
                
                {/* Estoque (Quantidade Física) */}
                {isFieldVisible('estoque') && (
                  <td className="px-4 py-3 text-center">
                    {isFieldEditable('estoque') && editando === `estoque-${idx}` ? (
                      <input
                        type="number"
                        defaultValue={produto.estoque || 0}
                        onBlur={(e) => {
                          updateProduto(produto.id, { estoque: parseInt(e.target.value) || 0 });
                          setEditando(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateProduto(produto.id, { estoque: parseInt(e.target.value) || 0 });
                            setEditando(null);
                          }
                        }}
                        autoFocus
                        className="w-20 px-2 py-1 bg-aureon-bg border-2 border-aureon-gold rounded text-center text-aureon-text font-bold focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => isFieldEditable('estoque') && setEditando(`estoque-${idx}`)}
                        disabled={!isFieldEditable('estoque')}
                        className={`px-2 py-1 rounded font-bold ${isFieldEditable('estoque') ? 'hover:bg-aureon-gold/10 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                      >
                        {produto.estoque || 0}
                        {!isFieldEditable('estoque') && <Lock size={12} className="inline ml-2" />}
                      </button>
                    )}
                  </td>
                )}
                
                {/* Quantidade Comprada (Entrada Original) */}
                {isFieldVisible('quantidadeComprada') && (
                  <td className="px-4 py-3 text-center">
                    {isFieldEditable('quantidadeComprada') && editando === `qtdComprada-${idx}` ? (
                      <input
                        type="number"
                        defaultValue={produto.quantidadeComprada || 0}
                        onBlur={(e) => {
                          updateProduto(produto.id, { quantidadeComprada: parseInt(e.target.value) || 0 });
                          setEditando(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateProduto(produto.id, { quantidadeComprada: parseInt(e.target.value) || 0 });
                            setEditando(null);
                          }
                        }}
                        autoFocus
                        className="w-20 px-2 py-1 bg-aureon-bg border-2 border-aureon-gold rounded text-center text-aureon-text font-bold focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => isFieldEditable('quantidadeComprada') && setEditando(`qtdComprada-${idx}`)}
                        disabled={!isFieldEditable('quantidadeComprada')}
                        className={`px-2 py-1 rounded ${isFieldEditable('quantidadeComprada') ? 'hover:bg-aureon-gold/10 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                      >
                        {produto.quantidadeComprada || 0}
                        {!isFieldEditable('quantidadeComprada') && <Lock size={12} className="inline ml-2" />}
                      </button>
                    )}
                  </td>
                )}
                
                {/* Fornecedor */}
                {isFieldVisible('fornecedorId') && (
                  <td className="px-4 py-3">
                    {produto.fornecedorId ? (
                      <span className="text-aureon-gold text-xs">🏢 {produto.fornecedorId}</span>
                    ) : (
                      <span className="text-aureon-text/40 text-xs">-</span>
                    )}
                  </td>
                )}
                
                {/* Ações (Somente CEO pode deletar) */}
                {canDelete && (
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        if (window.confirm('⚠️ Tem certeza que deseja excluir este produto?')) {
                          deleteProduto(produto.id);
                        }
                      }}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      title="Excluir produto (CEO only)"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
        {produtos.length === 0 && (
          <div className="text-center py-12 text-aureon-text/50">
            Nenhum produto cadastrado
          </div>
        )}
      </div>
    </div>
  );
}

// ========== COMPONENTE: FORNECEDORES ==========
function SuppliersTab() {
  const { fornecedores, addFornecedor, deleteFornecedor, produtos, itensEstoque = [], addItemEstoque, updateFornecedor } = useContext(DataContext);
  const { getUserSettings, currentUser, hasPermission } = useAuth();
  const userSettings = getUserSettings();
  const leadTimePadrao = userSettings.leadTimePadrao || 7; // Default 7 dias
  const canEditLeadTime = currentUser.role === 'CEO' || currentUser.role === 'COMPRAS';

  const [novoFornecedor, setNovoFornecedor] = useState({
    nome: '',
    contato: '',
    email: '',
    empresa: '',
    tipo: '',
    origem: '', // Novo campo: Alibaba, Nacional, etc.
    leadTime: leadTimePadrao, // ✅ Lead Time em dias (padrão do UserSettings)
    itens: [] // Array de IDs de itens vinculados
  });
  const [modalItemAberto, setModalItemAberto] = useState(false);
  const [novoItem, setNovoItem] = useState({ 
    tipo: '', 
    modelo: '', 
    quantidade: '',
    precoCusto: '',
    observacoes: ''
  });
  const [modalVincularAberto, setModalVincularAberto] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

  const handleAdd = () => {
    if (novoFornecedor.nome && novoFornecedor.contato && novoFornecedor.origem) {
      addFornecedor({
        ...novoFornecedor,
        leadTime: novoFornecedor.leadTime || leadTimePadrao
      });
      setNovoFornecedor({ nome: '', contato: '', email: '', empresa: '', tipo: '', origem: '', leadTime: leadTimePadrao, itens: [] });
    }
  };

  const handleAddItemEstoque = () => {
    if (novoItem.tipo && novoItem.modelo && novoItem.quantidade) {
      addItemEstoque({
        ...novoItem,
        quantidade: parseInt(novoItem.quantidade),
        precoCusto: parseFloat(novoItem.precoCusto) || 0,
        dataCadastro: new Date().toLocaleDateString('pt-BR')
      });
      setNovoItem({ tipo: '', modelo: '', quantidade: '', precoCusto: '', observacoes: '' });
      setModalItemAberto(false);
      alert('✅ Item cadastrado com sucesso!');
    } else {
      alert('⚠️ Preencha todos os campos obrigatórios (Tipo, Modelo e Quantidade)');
    }
  };

  const handleVincularItem = (itemId) => {
    if (fornecedorSelecionado !== null) {
      const fornecedor = fornecedores[fornecedorSelecionado];
      const itensAtualizados = [...(fornecedor.itens || [])];
      
      if (!itensAtualizados.includes(itemId)) {
        itensAtualizados.push(itemId);
        updateFornecedor(fornecedorSelecionado, { ...fornecedor, itens: itensAtualizados });
        alert('✅ Item vinculado ao fornecedor!');
      } else {
        alert('⚠️ Este item já está vinculado a este fornecedor');
      }
    }
  };

  const handleDesvincularItem = (fornecedorIdx, itemId) => {
    const fornecedor = fornecedores[fornecedorIdx];
    const itensAtualizados = (fornecedor.itens || []).filter(id => id !== itemId);
    updateFornecedor(fornecedorIdx, { ...fornecedor, itens: itensAtualizados });
  };

  // KPIs de Fornecedores
  const totalFornecedores = fornecedores.length;
  const produtosComFornecedor = produtos.filter(p => p.fornecedorId).length;
  const produtosSemFornecedor = produtos.filter(p => !p.fornecedorId).length;

  return (
    <div className="space-y-6">
      {/* KPIs de Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[var(--aureon-gold)]/10 to-aureon-surface border border-aureon-gold/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Total Fornecedores</span>
            <Users size={24} className="text-aureon-gold" />
          </div>
          <div className="text-3xl font-bold text-aureon-gold mb-1">{totalFornecedores}</div>
          <div className="text-xs text-aureon-text/70">Fornecedores cadastrados</div>
        </div>

        <div className="bg-gradient-to-br from-green-400/10 to-aureon-surface border border-green-400/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Produtos Vinculados</span>
            <Package size={24} className="text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">{produtosComFornecedor}</div>
          <div className="text-xs text-aureon-text/70">Produtos com fornecedor</div>
        </div>

        <div className="bg-gradient-to-br from-orange-400/10 to-aureon-surface border border-orange-400/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Sem Fornecedor</span>
            <AlertTriangle size={24} className="text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-orange-400 mb-1">{produtosSemFornecedor}</div>
          <div className="text-xs text-aureon-text/70">Produtos sem vínculo</div>
        </div>
      </div>
      {/* Botões de Ação Rápida */}
      <div className="flex gap-4">
        <button
          onClick={() => setModalItemAberto(true)}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Plus size={24} />
          Cadastrar Novo Item
        </button>
      </div>

      {/* Formulário de Adição de Fornecedor */}
      <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-aureon-gold mb-4">Adicionar Fornecedor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome do Fornecedor *"
            value={novoFornecedor.nome}
            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          />
          <input
            type="text"
            placeholder="Contato (Telefone) *"
            value={novoFornecedor.contato}
            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, contato: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={novoFornecedor.email}
            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, email: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          />
          <input
            type="text"
            placeholder="Empresa"
            value={novoFornecedor.empresa || ''}
            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, empresa: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          />
          <input
            type="text"
            placeholder="Tipo (ex: Óculos, Lentes, Armações)"
            value={novoFornecedor.tipo}
            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, tipo: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          />
          <select
            value={novoFornecedor.origem}
            onChange={(e) => setNovoFornecedor({ ...novoFornecedor, origem: e.target.value })}
            className="px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
          >
            <option value="">Selecione a Origem *</option>
            <option value="Alibaba">🇨🇳 Alibaba</option>
            <option value="Nacional">🇧🇷 Nacional</option>
            <option value="Importado - EUA">🇺🇸 Importado - EUA</option>
            <option value="Importado - Europa">🇪🇺 Importado - Europa</option>
            <option value="Importado - Ásia">🌏 Importado - Ásia</option>
            <option value="Outro">🌍 Outro</option>
          </select>
          
          {/* ✅ Lead Time (COMPRAS pode editar, outros readonly) */}
          <div className="relative">
            <input
              type="number"
              min="1"
              max="90"
              placeholder={`Lead Time (dias) - Padrão: ${leadTimePadrao}`}
              value={novoFornecedor.leadTime || ''}
              onChange={(e) => {
                if (canEditLeadTime) {
                  setNovoFornecedor({ ...novoFornecedor, leadTime: parseInt(e.target.value) || leadTimePadrao });
                }
              }}
              disabled={!canEditLeadTime}
              className={`px-4 py-2 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold ${
                !canEditLeadTime ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            {!canEditLeadTime && (
              <Lock size={16} className="absolute right-3 top-3 text-aureon-text/40" />
            )}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!novoFornecedor.nome || !novoFornecedor.contato || !novoFornecedor.origem}
          className="mt-4 w-full px-6 py-3 bg-aureon-gold text-aureon-bg font-bold rounded-lg hover:bg-aureon-text transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} className="inline mr-2" />
          Adicionar Fornecedor
        </button>
      </div>

      {/* Lista de Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fornecedores.map((fornecedor, idx) => {
          const itensVinculados = (fornecedor.itens || []).map(itemId => 
            itensEstoque.find(item => item.id === itemId)
          ).filter(Boolean);
          
          return (
            <div key={idx} className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="text-lg font-bold text-aureon-gold">{fornecedor.nome}</h4>
                    {fornecedor.origem && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-semibold">
                        📍 {fornecedor.origem}
                      </span>
                    )}
                    {fornecedor.tipo && (
                      <span className="px-2 py-1 bg-aureon-gold/20 text-aureon-gold text-xs rounded-full font-semibold">
                        🏷️ {fornecedor.tipo}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-aureon-text/70">📱 {fornecedor.contato}</p>
                  {fornecedor.empresa && (
                    <p className="text-xs text-aureon-text/50 mt-1">🏢 {fornecedor.empresa}</p>
                  )}
                  {fornecedor.leadTime && (
                    <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                      ⏱️ Lead Time: {fornecedor.leadTime} dias
                      {!canEditLeadTime && <Lock size={10} className="text-aureon-text/40" />}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteFornecedor(idx)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  title="Deletar fornecedor"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              {fornecedor.email && (
                <p className="text-sm text-aureon-text mb-3 pb-3 border-b border-aureon-gold/10">
                  📧 {fornecedor.email}
                </p>
              )}
              
              {/* Botão Vincular Itens */}
              <button
                onClick={() => {
                  setFornecedorSelecionado(idx);
                  setModalVincularAberto(true);
                }}
                className="w-full mb-3 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Package size={16} />
                Vincular Itens
              </button>
              
              {/* Lista de Itens Vinculados */}
              {itensVinculados.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-aureon-text/70 font-semibold mb-2">📦 ITENS VINCULADOS:</p>
                  <div className="space-y-2">
                    {itensVinculados.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between bg-aureon-bg border border-aureon-gold/20 rounded-lg p-2"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-aureon-gold font-bold text-sm">{item.tipo}:</span>
                            <span className="text-aureon-text text-sm">{item.modelo}</span>
                          </div>
                          <span className="text-xs text-aureon-text/50">Qtd: {item.quantidade} • Custo: R$ {item.precoCusto}</span>
                        </div>
                        <button
                          onClick={() => handleDesvincularItem(idx, item.id)}
                          className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-all"
                          title="Desvincular item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-aureon-text/40 mt-2">
                    Total: {itensVinculados.length} {itensVinculados.length === 1 ? 'item' : 'itens'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        {fornecedores.length === 0 && (
          <div className="col-span-2 text-center py-12 text-aureon-text/50">
            Nenhum fornecedor cadastrado
          </div>
        )}
      </div>

      {/* MODAL: Cadastrar Novo Item */}
      {modalItemAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-aureon-surface border-2 border-aureon-gold rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-aureon-gold flex items-center gap-2">
                <Package size={28} />
                Cadastrar Novo Item
              </h2>
              <button
                onClick={() => {
                  setModalItemAberto(false);
                  setNovoItem({ tipo: '', modelo: '', quantidade: '', precoCusto: '', observacoes: '' });
                }}
                className="p-2 text-aureon-text hover:bg-red-400/20 hover:text-red-400 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-aureon-text text-sm font-semibold mb-2">Tipo do Item *</label>
                <input
                  type="text"
                  placeholder="Ex: Óculos, Lentes, Armações"
                  value={novoItem.tipo}
                  onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value })}
                  className="w-full px-4 py-3 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
                />
              </div>

              <div>
                <label className="block text-aureon-text text-sm font-semibold mb-2">Modelo *</label>
                <input
                  type="text"
                  placeholder="Ex: RAY-BAN AVIATOR DOURADO"
                  value={novoItem.modelo}
                  onChange={(e) => setNovoItem({ ...novoItem, modelo: e.target.value })}
                  className="w-full px-4 py-3 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-aureon-text text-sm font-semibold mb-2">Quantidade *</label>
                  <input
                    type="number"
                    placeholder="Ex: 50"
                    value={novoItem.quantidade}
                    onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })}
                    className="w-full px-4 py-3 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
                  />
                </div>

                <div>
                  <label className="block text-aureon-text text-sm font-semibold mb-2">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 120.50"
                    value={novoItem.precoCusto}
                    onChange={(e) => setNovoItem({ ...novoItem, precoCusto: e.target.value })}
                    className="w-full px-4 py-3 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-aureon-text text-sm font-semibold mb-2">Observações</label>
                <textarea
                  placeholder="Informações adicionais sobre o item..."
                  value={novoItem.observacoes}
                  onChange={(e) => setNovoItem({ ...novoItem, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-aureon-bg border border-aureon-gold/20 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setModalItemAberto(false);
                    setNovoItem({ tipo: '', modelo: '', quantidade: '', precoCusto: '', observacoes: '' });
                  }}
                  className="flex-1 px-6 py-3 bg-aureon-bg border border-aureon-gold/20 text-aureon-text font-bold rounded-lg hover:bg-aureon-gold/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddItemEstoque}
                  className="flex-1 px-6 py-3 bg-aureon-gold text-aureon-bg font-bold rounded-lg hover:bg-aureon-text transition-all"
                >
                  <Plus size={20} className="inline mr-2" />
                  Cadastrar Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Vincular Itens ao Fornecedor */}
      {modalVincularAberto && fornecedorSelecionado !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-aureon-surface border-2 border-aureon-gold rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-aureon-gold flex items-center gap-2">
                <Package size={28} />
                Vincular Itens - {fornecedores[fornecedorSelecionado].nome}
              </h2>
              <button
                onClick={() => {
                  setModalVincularAberto(false);
                  setFornecedorSelecionado(null);
                }}
                className="p-2 text-aureon-text hover:bg-red-400/20 hover:text-red-400 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <p className="text-blue-400 text-sm">
                💡 Selecione os itens abaixo para vincular a este fornecedor
              </p>
            </div>

            {itensEstoque.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-aureon-text/30 mb-4" />
                <p className="text-aureon-text/50">Nenhum item cadastrado</p>
                <button
                  onClick={() => {
                    setModalVincularAberto(false);
                    setModalItemAberto(true);
                  }}
                  className="mt-4 px-6 py-2 bg-aureon-gold text-aureon-bg font-bold rounded-lg hover:bg-aureon-text transition-all"
                >
                  Cadastrar Primeiro Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {itensEstoque.map((item) => {
                  const jaVinculado = fornecedores[fornecedorSelecionado].itens?.includes(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${
                        jaVinculado 
                          ? 'bg-green-400/10 border-green-400/30' 
                          : 'bg-aureon-bg border-aureon-gold/20 hover:border-aureon-gold cursor-pointer'
                      }`}
                      onClick={() => !jaVinculado && handleVincularItem(item.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-aureon-gold font-bold text-sm">{item.tipo}</span>
                            {jaVinculado && (
                              <span className="px-2 py-0.5 bg-green-400/20 text-green-400 text-xs rounded-full">
                                ✓ Vinculado
                              </span>
                            )}
                          </div>
                          <p className="text-aureon-text font-semibold">{item.modelo}</p>
                          <div className="flex gap-3 mt-2 text-xs text-aureon-text/60">
                            <span>Qtd: {item.quantidade}</span>
                            <span>Custo: R$ {item.precoCusto}</span>
                          </div>
                        </div>
                        {!jaVinculado && (
                          <Plus size={20} className="text-aureon-gold" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => {
                  setModalVincularAberto(false);
                  setFornecedorSelecionado(null);
                }}
                className="w-full px-6 py-3 bg-aureon-gold text-aureon-bg font-bold rounded-lg hover:bg-aureon-text transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== COMPONENTE: PREVISÃO DE REPOSIÇÃO ==========
function StockPredictionTab() {
  const { produtos, vendas } = useContext(DataContext);

  // Análise inteligente de estoque
  const analiseEstoque = useMemo(() => {
    // Produtos com estoque
    const produtosComEstoque = produtos.filter(p => p.estoque > 0);
    const produtosSemEstoque = produtos.filter(p => p.estoque === 0);
    const produtosCriticos = produtos.filter(p => p.estoque > 0 && p.estoque < 5);
    
    // Análise de vendas por produto
    const vendasPorProduto = {};
    vendas.forEach(v => {
      const produtoNome = v.produto || 'Outros';
      if (!vendasPorProduto[produtoNome]) {
        vendasPorProduto[produtoNome] = { quantidade: 0, receita: 0, lucro: 0 };
      }
      vendasPorProduto[produtoNome].quantidade += 1;
      vendasPorProduto[produtoNome].receita += v.valorVenda || 0;
      vendasPorProduto[produtoNome].lucro += v.lucro || 0;
    });

    // Calcular produtos mais vendidos vs estoque
    const produtosAnalise = produtos.map(p => {
      const vendaDados = vendasPorProduto[p.produto] || { quantidade: 0, receita: 0, lucro: 0 };
      const estoqueEmDias = vendaDados.quantidade > 0 
        ? Math.floor((p.estoque / vendaDados.quantidade) * 30)
        : p.estoque > 0 ? 999 : 0;
      
      const rentabilidade = p.estoque > 0 
        ? (vendaDados.lucro / (p.estoque * p.preco)) * 100
        : 0;

      return {
        ...p,
        vendasRealizadas: vendaDados.quantidade,
        receitaGerada: vendaDados.receita,
        lucroGerado: vendaDados.lucro,
        estoqueEmDias,
        rentabilidade,
        precisaReposicao: estoqueEmDias < 30 && vendaDados.quantidade > 0,
        urgencia: estoqueEmDias === 0 ? 'critica' : estoqueEmDias < 7 ? 'alta' : estoqueEmDias < 30 ? 'media' : 'baixa'
      };
    });

    // Ordenar por urgência e vendas
    const produtosParaRepor = produtosAnalise
      .filter(p => p.precisaReposicao || p.estoque === 0)
      .sort((a, b) => {
        if (a.estoque === 0 && b.estoque > 0) return -1;
        if (b.estoque === 0 && a.estoque > 0) return 1;
        return b.vendasRealizadas - a.vendasRealizadas;
      });

    // Valor investido vs receita potencial
    const valorInvestido = produtos.reduce((acc, p) => acc + (p.estoque * p.preco), 0);
    const receitaPotencial = produtos.reduce((acc, p) => {
      const vendas = vendasPorProduto[p.produto]?.quantidade || 0;
      return acc + (vendas * p.preco);
    }, 0);

    // ROI do estoque
    const roiEstoque = valorInvestido > 0 
      ? ((receitaPotencial - valorInvestido) / valorInvestido) * 100
      : 0;

    return {
      produtosComEstoque: produtosComEstoque.length,
      produtosSemEstoque: produtosSemEstoque.length,
      produtosCriticos: produtosCriticos.length,
      produtosParaRepor,
      valorInvestido,
      receitaPotencial,
      roiEstoque,
      totalProdutos: produtos.length
    };
  }, [produtos, vendas]);

  // Status geral do estoque
  const statusEstoque = () => {
    if (analiseEstoque.totalProdutos === 0) {
      return { tipo: 'vazio', cor: 'blue', mensagem: 'Nenhum produto cadastrado ainda' };
    }
    if (analiseEstoque.produtosSemEstoque === analiseEstoque.totalProdutos) {
      return { tipo: 'vazio', cor: 'red', mensagem: 'Todos os produtos estão sem estoque' };
    }
    if (analiseEstoque.produtosParaRepor.length === 0) {
      return { tipo: 'otimo', cor: 'green', mensagem: 'Estoque está bem dimensionado' };
    }
    if (analiseEstoque.produtosParaRepor.length > analiseEstoque.totalProdutos * 0.5) {
      return { tipo: 'critico', cor: 'red', mensagem: 'Mais de 50% dos produtos precisam reposição' };
    }
    return { tipo: 'atencao', cor: 'yellow', mensagem: 'Alguns produtos precisam atenção' };
  };

  const status = statusEstoque();

  return (
    <div className="space-y-6">
      {/* Status Geral com IA */}
      <div className={`bg-gradient-to-br from-${status.cor}-400/10 to-aureon-surface border border-${status.cor}-400/40 rounded-xl p-6`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 bg-${status.cor}-400/20 rounded-lg`}>
            {status.tipo === 'otimo' ? <CheckCircle size={32} className={`text-${status.cor}-400`} /> : <AlertTriangle size={32} className={`text-${status.cor}-400`} />}
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold text-${status.cor}-400 mb-2`}>
              {status.tipo === 'vazio' && '📊 Análise de Estoque'}
              {status.tipo === 'otimo' && '✅ Estoque Otimizado'}
              {status.tipo === 'atencao' && '⚠️ Atenção Necessária'}
              {status.tipo === 'critico' && '🚨 Situação Crítica'}
            </h3>
            <p className="text-aureon-text text-sm mb-3">{status.mensagem}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-aureon-text/70">Total de Produtos:</span>
                <span className="ml-2 font-bold text-aureon-gold">{analiseEstoque.totalProdutos}</span>
              </div>
              <div>
                <span className="text-aureon-text/70">Com Estoque:</span>
                <span className="ml-2 font-bold text-green-400">{analiseEstoque.produtosComEstoque}</span>
              </div>
              <div>
                <span className="text-aureon-text/70">Sem Estoque:</span>
                <span className="ml-2 font-bold text-red-400">{analiseEstoque.produtosSemEstoque}</span>
              </div>
              <div>
                <span className="text-aureon-text/70">Críticos:</span>
                <span className="ml-2 font-bold text-orange-400">{analiseEstoque.produtosCriticos}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Econômicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[var(--aureon-gold)]/10 to-aureon-surface border border-aureon-gold/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Valor Investido</span>
            <Package size={24} className="text-aureon-gold" />
          </div>
          <div className="text-2xl font-bold text-aureon-gold mb-1">
            R$ {analiseEstoque.valorInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-aureon-text/70">Capital alocado em estoque</div>
        </div>

        <div className="bg-gradient-to-br from-green-400/10 to-aureon-surface border border-green-400/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">Receita Potencial</span>
            <TrendingUp size={24} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            R$ {analiseEstoque.receitaPotencial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-aureon-text/70">Baseado em vendas realizadas</div>
        </div>

        <div className={`bg-gradient-to-br from-${analiseEstoque.roiEstoque >= 0 ? 'blue' : 'red'}-400/10 to-aureon-surface border border-${analiseEstoque.roiEstoque >= 0 ? 'blue' : 'red'}-400/40 rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-aureon-text font-semibold">ROI do Estoque</span>
            <TrendingUp size={24} className={`text-${analiseEstoque.roiEstoque >= 0 ? 'blue' : 'red'}-400`} />
          </div>
          <div className={`text-3xl font-bold text-${analiseEstoque.roiEstoque >= 0 ? 'blue' : 'red'}-400 mb-1`}>
            {analiseEstoque.roiEstoque >= 0 ? '+' : ''}{analiseEstoque.roiEstoque.toFixed(1)}%
          </div>
          <div className="text-xs text-aureon-text/70">Retorno sobre investimento</div>
        </div>
      </div>
      {/* Análise Detalhada de Reposição */}
      {analiseEstoque.produtosParaRepor.length > 0 ? (
        <div className="bg-aureon-surface border border-aureon-gold/40 rounded-xl p-6">
          <h3 className="text-xl font-bold text-aureon-gold mb-4 flex items-center gap-2">
            <Package size={24} />
            Análise de Reposição ({analiseEstoque.produtosParaRepor.length} produtos)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aureon-text/20">
                  <th className="text-left py-2 px-3 text-aureon-text/70">Produto</th>
                  <th className="text-center py-2 px-3 text-aureon-text/70">Estoque</th>
                  <th className="text-center py-2 px-3 text-aureon-text/70">Vendas</th>
                  <th className="text-center py-2 px-3 text-aureon-text/70">Dias</th>
                  <th className="text-center py-2 px-3 text-aureon-text/70">Rentab.</th>
                  <th className="text-right py-2 px-3 text-aureon-text/70">Receita</th>
                  <th className="text-center py-2 px-3 text-aureon-text/70">Urgência</th>
                </tr>
              </thead>
              <tbody>
                {analiseEstoque.produtosParaRepor.map((prod, idx) => (
                  <tr key={idx} className="border-b border-aureon-text/10 hover:bg-aureon-gold/5">
                    <td className="py-2 px-3 text-aureon-text">{prod.produto}</td>
                    <td className="text-center py-2 px-3">
                      <span className={`font-bold ${prod.estoque === 0 ? 'text-red-400' : prod.estoque < 5 ? 'text-orange-400' : 'text-yellow-400'}`}>
                        {prod.estoque}
                      </span>
                    </td>
                    <td className="text-center py-2 px-3 text-aureon-gold font-bold">{prod.vendasRealizadas}</td>
                    <td className="text-center py-2 px-3">
                      <span className={`${prod.estoqueEmDias === 0 ? 'text-red-400' : prod.estoqueEmDias < 7 ? 'text-orange-400' : 'text-yellow-400'}`}>
                        {prod.estoqueEmDias === 999 ? '∞' : prod.estoqueEmDias}
                      </span>
                    </td>
                    <td className="text-center py-2 px-3">
                      <span className={`${prod.rentabilidade > 50 ? 'text-green-400' : prod.rentabilidade > 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {prod.rentabilidade.toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-3 text-aureon-text">
                      R$ {prod.receitaGerada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-center py-2 px-3">
                      {prod.urgencia === 'critica' && <span className="px-2 py-1 bg-red-400/20 text-red-400 rounded-full text-xs font-bold">🚨 URGENTE</span>}
                      {prod.urgencia === 'alta' && <span className="px-2 py-1 bg-orange-400/20 text-orange-400 rounded-full text-xs font-bold">⚠️ ALTA</span>}
                      {prod.urgencia === 'media' && <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-xs font-bold">⏰ MÉDIA</span>}
                      {prod.urgencia === 'baixa' && <span className="px-2 py-1 bg-blue-400/20 text-blue-400 rounded-full text-xs font-bold">📊 BAIXA</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-aureon-gold/5 border border-aureon-gold/20 rounded-lg">
            <p className="text-xs text-aureon-text">
              <strong>💡 Dica:</strong> A tabela mostra produtos que precisam reposição baseado em análise de vendas × estoque. 
              <strong className="text-aureon-gold"> "Dias"</strong> indica quanto tempo o estoque atual durará no ritmo de vendas atual. 
              <strong className="text-green-400"> "Rentab."</strong> mostra o retorno econômico do produto.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-400/50 rounded-xl p-12 text-center">
          <CheckCircle size={64} className="mx-auto mb-4 text-green-400" />
          <h3 className="text-2xl font-bold text-green-400 mb-2">
            {analiseEstoque.totalProdutos === 0 ? '📦 Nenhum Produto Cadastrado' : '✨ Estoque Otimizado!'}
          </h3>
          <p className="text-aureon-text">
            {analiseEstoque.totalProdutos === 0 
              ? 'Cadastre produtos para começar a análise inteligente de estoque.'
              : 'Todos os produtos estão com níveis adequados baseado na análise de vendas × estoque.'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Gestão de Estoque Unificada
 * Combina: Produtos + Fornecedores + Previsão de Reposição
 * Fornecedores são cadastrados manualmente e vinculados aos produtos
 */
export default function UnifiedInventory() {
  const [viewMode, setViewMode] = useState('products'); // 'products' | 'suppliers' | 'prediction'

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header com Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-aureon-gold flex items-center gap-3">
              <Package size={32} />
              Gestão de Estoque
            </h2>
            <p className="text-aureon-text text-sm mt-1">Produtos, fornecedores e previsão de reposição</p>
          </div>
        </div>

        {/* Toggle de Visualização */}
        <div className="flex gap-2 bg-aureon-surface p-1 rounded-lg border border-aureon-gold/20 mb-6 flex-wrap">
          <button
            onClick={() => setViewMode('products')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'products'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'text-aureon-text hover:bg-aureon-gold/10'
            }`}
          >
            <Package size={16} className="inline mr-2" />
            Produtos
          </button>
          <button
            onClick={() => setViewMode('suppliers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'suppliers'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'text-aureon-text hover:bg-aureon-gold/10'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Fornecedores
          </button>
          <button
            onClick={() => setViewMode('prediction')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'prediction'
                ? 'bg-aureon-gold text-aureon-bg'
                : 'text-aureon-text hover:bg-aureon-gold/10'
            }`}
          >
            <AlertTriangle size={16} className="inline mr-2" />
            Previsão & Reposição
          </button>
        </div>

        {/* Conteúdo Condicional */}
        {viewMode === 'products' && <InventoryTab />}
        {viewMode === 'suppliers' && <SuppliersTab />}
        {viewMode === 'prediction' && <StockPredictionTab />}
      </div>
    </div>
  );
}

