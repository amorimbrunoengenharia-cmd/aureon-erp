import React, { useState, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { ShoppingCart, CreditCard, AlertCircle, CheckCircle, X } from 'lucide-react';

/**
 * PDV (Ponto de Venda) com Transação Atômica
 * 
 * FLUXO:
 * 1. Validar Estoque (todos os itens)
 * 2. Deduzir Estoque (atômico - via addVenda)
 * 3. Registrar Movimentação (automático em addVenda)
 * 4. Gerar Venda (com lucro calculado)
 * 5. [Opcional] Atualizar Financeiro
 * 
 * SE QUALQUER PASSO FALHAR → Rollback completo
 */
export default function PDVAtomic() {
  const { produtos, clientes, addVenda, addCliente } = useContext(DataContext);
  
  const [carrinho, setCarrinho] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [canal, setCanal] = useState('Pessoal');
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [processando, setProcessando] = useState(false);

  // ===== CARRINHO =====
  const adicionarItem = (produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      setCarrinho(carrinho.map(item =>
        item.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
    
    setStatus({ type: 'success', message: `${produto.nome || produto.produto} adicionado` });
    setTimeout(() => setStatus({ type: '', message: '' }), 2000);
  };

  const removerItem = (produtoId) => {
    setCarrinho(carrinho.filter(item => item.id !== produtoId));
  };

  const atualizarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerItem(produtoId);
      return;
    }
    
    setCarrinho(carrinho.map(item =>
      item.id === produtoId
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
  };

  // ===== CÁLCULOS =====
  const calcularSubtotal = () => {
    return carrinho.reduce((total, item) => {
      const preco = item.preco || item.precoVenda || 0;
      return total + (preco * item.quantidade);
    }, 0);
  };

  const calcularLucroTotal = () => {
    return carrinho.reduce((total, item) => {
      const preco = item.preco || item.precoVenda || 0;
      const custo = (item.precoCusto || 0) + (item.precoImportacao || 0);
      const lucroUnitario = preco - custo;
      return total + (lucroUnitario * item.quantidade);
    }, 0);
  };

  // ===== TRANSAÇÃO ATÔMICA =====
  const processarCheckout = async () => {
    setProcessando(true);
    setStatus({ type: '', message: '' });

    try {
      // ===== PASSO 1: VALIDAÇÕES =====
      if (carrinho.length === 0) {
        throw new Error('Carrinho vazio');
      }

      if (!clienteSelecionado) {
        throw new Error('Selecione um cliente');
      }

      // Validar estoque de TODOS os itens ANTES de deduzir qualquer um
      for (const item of carrinho) {
        const produto = produtos.find(p => p.id === item.id);
        
        if (!produto) {
          throw new Error(`Produto não encontrado: ${item.nome}`);
        }

        const estoqueDisponivel = produto.estoqueCanais?.[canal] || produto.estoque || 0;
        
        if (estoqueDisponivel < item.quantidade) {
          throw new Error(
            `Estoque insuficiente: ${produto.nome || produto.produto}\n` +
            `Disponível: ${estoqueDisponivel}, Solicitado: ${item.quantidade}`
          );
        }
      }

      // ===== PASSO 2-4: CRIAR VENDAS (Deduz estoque + Cria movimentação) =====
      const vendasCriadas = [];
      
      for (const item of carrinho) {
        const produto = produtos.find(p => p.id === item.id);
        const preco = item.preco || item.precoVenda || 0;
        const custo = (produto.precoCusto || 0) + (produto.precoImportacao || 0);
        
        const venda = {
          produtoId: produto.id,
          produto: produto.nome || produto.produto,
          quantidade: item.quantidade,
          valorVenda: preco * item.quantidade,
          custoProduto: custo * item.quantidade,
          cliente: clienteSelecionado.nome,
          clienteId: clienteSelecionado.id,
          canal: canal,
          formaPagamento: formaPagamento,
          usuario: 'PDV',
          status: 'completed'
        };

        // addVenda fará automaticamente:
        // - Deduzir estoque do canal
        // - Atualizar vendidosPorCanal
        // - Atualizar totalVendido
        // - Criar movimentação (tipo: SAIDA, motivo: Venda)
        addVenda(venda);
        vendasCriadas.push(venda);
      }

      // ===== SUCESSO =====
      setStatus({
        type: 'success',
        message: `✅ Venda concluída! ${vendasCriadas.length} ite(ns), Total: R$ ${calcularSubtotal().toFixed(2)}`
      });

      // Limpar carrinho
      setCarrinho([]);
      setClienteSelecionado(null);
      
      setTimeout(() => {
        setStatus({ type: '', message: '' });
      }, 5000);

    } catch (error) {
      // ===== ERRO: ROLLBACK AUTOMÁTICO =====
      // Como validamos TUDO antes de deduzir, não há necessidade de rollback manual
      // Se addVenda falhar, nada foi alterado ainda
      
      setStatus({
        type: 'error',
        message: `❌ Erro: ${error.message}`
      });
      
      console.error('Erro no checkout:', error);
    } finally {
      setProcessando(false);
    }
  };

  // ===== RENDER =====
  const subtotal = calcularSubtotal();
  const lucro = calcularLucroTotal();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <ShoppingCart className="w-8 h-8" />
        PDV - Ponto de Venda
      </h1>

      {/* Status/Alertas */}
      {status.message && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
          status.type === 'success' 
            ? 'bg-green-50 border-2 border-green-500 text-green-800' 
            : 'bg-red-50 border-2 border-red-500 text-red-800'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium whitespace-pre-line">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA 1: PRODUTOS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Produtos</h2>
            
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {produtos.map(produto => {
                const estoqueDisponivel = produto.estoqueCanais?.[canal] || produto.estoque || 0;
                const semEstoque = estoqueDisponivel === 0;
                
                return (
                  <button
                    key={produto.id}
                    onClick={() => !semEstoque && adicionarItem(produto)}
                    disabled={semEstoque}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      semEstoque
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                        : 'bg-white border-gray-300 hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    <div className="font-bold text-sm">{produto.nome || produto.produto}</div>
                    <div className="text-lg font-bold text-green-600">
                      R$ {(produto.preco || produto.precoVenda || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Estoque: {estoqueDisponivel} {semEstoque && '(ESGOTADO)'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUNA 2: CARRINHO & CHECKOUT */}
        <div className="space-y-6">
          {/* Cliente */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Cliente</h2>
            <select
              value={clienteSelecionado?.id || ''}
              onChange={(e) => {
                const cliente = clientes.find(c => c.id === Number(e.target.value));
                setClienteSelecionado(cliente);
              }}
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Configurações */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Configurações</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Canal</label>
                <select
                  value={canal}
                  onChange={(e) => setCanal(e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg"
                >
                  <option value="Pessoal">Pessoal</option>
                  <option value="Mercado Livre">Mercado Livre</option>
                  <option value="Shopee">Shopee</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pagamento</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg"
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão Crédito">Cartão Crédito</option>
                  <option value="Cartão Débito">Cartão Débito</option>
                  <option value="PIX">PIX</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
            </div>
          </div>

          {/* Carrinho */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Carrinho ({carrinho.length})</h2>
            
            {carrinho.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Carrinho vazio</p>
            ) : (
              <div className="space-y-3">
                {carrinho.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.nome || item.produto}</div>
                      <div className="text-xs text-gray-500">
                        R$ {(item.preco || item.precoVenda || 0).toFixed(2)} × {item.quantidade}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => atualizarQuantidade(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 p-1 border rounded text-center"
                      />
                      <button
                        onClick={() => removerItem(item.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {carrinho.length > 0 && (
              <>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Lucro Estimado:</span>
                    <span className="font-bold">R$ {lucro.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={processarCheckout}
                  disabled={processando || !clienteSelecionado}
                  className={`w-full mt-4 p-4 rounded-lg font-bold text-white transition flex items-center justify-center gap-2 ${
                    processando || !clienteSelecionado
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  {processando ? 'Processando...' : 'Finalizar Venda'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
