import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContextAPI';
import { useSimulation } from './SimulationContext';
import { calcularLucro, validateProduct, gerarNomeProduto } from '../utils/productUtils';
import eventBus from '../services/EventBus';
import { EVENTS, createSalesOrderPayload, createInventoryReservationPayload, createEventMetadata, propagateTraceId } from '../services/EventTypes';
import eventLogger from '../services/EventLogger';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // ✅ RBAC: Importar métodos de auditoria (se AuthContext disponível)
  let createAuditLog = null;
  try {
    const auth = useAuth();
    createAuditLog = auth?.createAuditLog || null;
  } catch (e) {
    // AuthContext ainda não está disponível (inicialização)
  }

  // ✅ SIMULATION MODE: Importar prefixo dinâmico
  let dbPrefix = 'aureon_';
  try {
    const simulation = useSimulation();
    dbPrefix = simulation?.getPrefix() || 'aureon_';
  } catch (e) {
    // SimulationContext ainda não está disponível (inicialização)
  }

  const safeLoad = (key, def) => {
    try {
      const fullKey = `${dbPrefix}${key}`;
      const item = localStorage.getItem(fullKey);
      return item ? JSON.parse(item) : def;
    } catch (e) { return def; }
  };

  // --- TIPOS DE ÓCULOS E CANAIS ---
  const tiposOculos = ['Óculos de Sol', 'Proteção Individual', 'Esportivos', 'Vintage', 'Polarizados'];
  const canaisVenda = ['Pessoal', 'Instagram', 'WhatsApp', 'Mercado Livre', 'Shopee', 'Amazon', 'Shein'];
  
  // --- BANCO DE DADOS COMPLETO ---
  const [config, setConfig] = useState(() => safeLoad('config', { 
    meta: 10000,
    imposto: 7.65,
    margemMinima: 30,
    metaCrescimento: 20, // ✅ Meta de crescimento do CEO em % (ex: 20%)
    fatorSeguranca: 3,   // ✅ Fator de segurança em dias (ex: 3 dias)
    despesasMensais: {} // { '2024-12': 5000, '2025-01': 5500, ... }
  }));
  
  const [produtos, setProdutos] = useState(() => safeLoad('produtos', []));
  const [vendas, setVendas] = useState(() => safeLoad('vendas', []));
  const [despesas, setDespesas] = useState(() => safeLoad('despesas', []));
  const [clientes, setClientes] = useState(() => safeLoad('clientes', []));
  const [fornecedores, setFornecedores] = useState(() => safeLoad('fornecedores', []));
  const [itensEstoque, setItensEstoque] = useState(() => safeLoad('itensEstoque', []));
  const [movimentacoes, setMovimentacoes] = useState(() => safeLoad('movimentacoes', []));
  const [tarefas, setTarefas] = useState(() => safeLoad('tarefas', []));
  const [metasPorCanal, setMetasPorCanal] = useState(() => safeLoad('metasPorCanal', {}));
  const [devolucoes, setDevolucoes] = useState(() => safeLoad('devolucoes', []));
  useEffect(() => localStorage.setItem(`${dbPrefix}produtos`, JSON.stringify(produtos)), [produtos, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}vendas`, JSON.stringify(vendas)), [vendas, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}despesas`, JSON.stringify(despesas)), [despesas, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}clientes`, JSON.stringify(clientes)), [clientes, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}fornecedores`, JSON.stringify(fornecedores)), [fornecedores, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}itensEstoque`, JSON.stringify(itensEstoque)), [itensEstoque, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}movimentacoes`, JSON.stringify(movimentacoes)), [movimentacoes, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}tarefas`, JSON.stringify(tarefas)), [tarefas, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}config`, JSON.stringify(config)), [config, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}metasPorCanal`, JSON.stringify(metasPorCanal)), [metasPorCanal, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}devolucoes`, JSON.stringify(devolucoes)), [devolucoes, dbPrefix]);

  // ============================================
  // ✅ EVENT-DRIVEN AUTOMATIONS: INVENTORY RESERVATION
  // ============================================
  
  useEffect(() => {
    // ✅ AUTOMAÇÃO: Venda criada → Reservar estoque automaticamente (prevenir oversell)
    const handleSalesOrderCreated = (event) => {
      const trace_id = propagateTraceId(event);
      eventLogger.info('Processando venda criada - reservando estoque', {
        trace_id,
        order_id: event.payload.orderId,
        items_count: event.payload.items?.length
      });
      
      const { orderId, items } = event.payload;
      
      // Reservar estoque para cada item da venda
      items.forEach(item => {
        try {
          reserveStock(item.productId, item.quantity, orderId, trace_id);
          eventLogger.success('Estoque reservado', {
            trace_id,
            product_id: item.productId,
            quantity: item.quantity
          });
        } catch (error) {
          eventLogger.error('Erro ao reservar estoque', {
            trace_id,
            product_id: item.productId,
            error: error.message
          });
          
          // Emitir evento de falha na reserva
          eventBus.emit(
            EVENTS.INVENTORY.ALERT_LOW_STOCK,
            {
              productId: item.productId,
              productName: item.productName,
              requestedQuantity: item.quantity,
              availableStock: 0,
              orderId,
              alertedAt: new Date().toISOString()
            },
            createEventMetadata({ trace_id, source: 'DataContext.handleSalesOrderCreated', priority: 'critical' })
          );
        }
      });
    };
    
    // ✅ AUTOMAÇÃO: Venda cancelada → Liberar reserva de estoque
    const handleSalesOrderCancelled = (event) => {
      const trace_id = propagateTraceId(event);
      eventLogger.info('Processando venda cancelada - liberando reserva', {
        trace_id,
        order_id: event.payload.orderId
      });
      
      const { orderId } = event.payload;
      
      // Encontrar venda cancelada
      const venda = vendas.find(v => v.id === orderId);
      if (venda) {
        // Liberar reserva do produto
        try {
          releaseReservation(venda.produtoId, venda.quantidade || 1, orderId, trace_id);
          eventLogger.success('Reserva liberada', {
            trace_id,
            product_id: venda.produtoId,
            quantity: venda.quantidade || 1
          });
        } catch (error) {
          eventLogger.error('Erro ao liberar reserva', {
            trace_id,
            error: error.message
          });
        }
      }
    };
    
    // ✅ AUTOMAÇÃO: Venda paga → Converter reserva em venda definitiva (já foi feito saída no addVenda)
    const handleSalesOrderPaid = (event) => {
      const trace_id = propagateTraceId(event);
      eventLogger.info('Venda paga - reserva convertida', {
        trace_id,
        order_id: event.payload.orderId,
        total: event.payload.total
      });
      // Nota: A movimentação de saída já foi criada no addVenda()
      // A reserva permanece até a entrega/baixa definitiva
    };
    
    // ✅ AUTOMAÇÃO: Envio despachado → Baixa física no estoque
    const handleShipmentDispatched = (event) => {
      const trace_id = propagateTraceId(event);
      const { orderId, items } = event.payload;
      
      eventLogger.info('Processando envio despachado - baixa física de estoque', {
        trace_id,
        order_id: orderId,
        items_count: items?.length
      });
      
      // Encontrar venda
      const venda = vendas.find(v => v.id === orderId);
      if (!venda) {
        eventLogger.warn('Venda não encontrada para baixa de estoque', {
          trace_id,
          order_id: orderId
        });
        return;
      }
      
      // Realizar baixa física e liberar reserva
      try {
        const produto = produtos.find(p => p.id === venda.produtoId);
        if (produto) {
          // Liberar reserva definitivamente
          releaseReservation(venda.produtoId, venda.quantidade || 1, orderId, trace_id);
          
          eventLogger.success('Baixa física realizada após envio', {
            trace_id,
            order_id: orderId,
            product_id: venda.produtoId,
            quantity: venda.quantidade || 1
          });
        }
      } catch (error) {
        eventLogger.error('Erro ao realizar baixa física', {
          trace_id,
          order_id: orderId,
          error: error.message
        });
      }
    };
    
    // Registrar listeners
    eventBus.on(EVENTS.SALES.ORDER_CREATED, handleSalesOrderCreated);
    eventBus.on(EVENTS.SALES.ORDER_CANCELLED, handleSalesOrderCancelled);
    eventBus.on(EVENTS.SALES.ORDER_PAID, handleSalesOrderPaid);
    eventBus.on(EVENTS.SALES.SHIPMENT_DISPATCHED, handleShipmentDispatched);
    
    if (import.meta.env.DEV) {
      eventLogger.debug('DataContext: Event listeners registrados (4 eventos)');
    }
    
    // Cleanup
    return () => {
      eventBus.off(EVENTS.SALES.ORDER_CREATED, handleSalesOrderCreated);
      eventBus.off(EVENTS.SALES.ORDER_CANCELLED, handleSalesOrderCancelled);
      eventBus.off(EVENTS.SALES.ORDER_PAID, handleSalesOrderPaid);
      eventBus.off(EVENTS.SALES.SHIPMENT_DISPATCHED, handleShipmentDispatched);
    };
  }, []); // ✅ Registrar apenas 1x no mount (handlers usam closure para acessar state)

  // --- AÇÕES ---
  
  // ✅ Produtos - Single Source of Truth
  // Criação via Fornecedores > Cadastrar Novo Item (ESPECIFICAÇÃO 2)
  const addProduto = (prod) => {
    // ✅ Validação de campos obrigatórios
    const validation = validateProduct(prod);
    if (!validation.valid) {
      const errorMsg = validation.errors.join('\n');
      throw new Error(`Validação falhou:\n${errorMsg}`);
    }

    const novoProduto = { 
      ...prod, 
      id: Date.now() + Math.floor(Math.random() * 1000000),
      // ✅ Nome gerado automaticamente (IMUTÁVEL)
      nome: prod.nome || gerarNomeProduto(prod.tipo, prod.modelo),
      tipo: prod.tipo, // Obrigatório
      modelo: prod.modelo, // Obrigatório
      
      // ✅ Custos (Obrigatórios)
      precoCusto: Number(prod.precoCusto) || Number(prod.valorCompra) || 0,
      precoImportacao: Number(prod.precoImportacao) || 0,
      
      // ✅ Preço de Venda
      precoVenda: Number(prod.precoVenda) || Number(prod.valorVenda) || Number(prod.preco) || 0,
      
      // ✅ Quantidades
      estoque: Number(prod.estoque) || 0, // Quantidade física (ESTOQUE edita)
      reserved: Number(prod.reserved) || 0, // ✅ Quantidade reservada (Sistema de Reserva)
      quantidadeComprada: Number(prod.quantidadeComprada) || Number(prod.quantidade) || 0, // Entrada original (COMPRAS edita)
      
      // Relacionamentos
      fornecedorId: prod.fornecedorId, // Obrigatório
      
      // Opcional
      observacoes: prod.observacoes || '',
      
      // ✅ CAMPO VIRTUAL: Lucro calculado
      lucro: 0, // Será calculado abaixo
      
      // Metadados
      estoqueCanais: prod.estoqueCanais || {},
      vendidosPorCanal: prod.vendidosPorCanal || {},
      totalVendido: 0,
      createdAt: new Date().toISOString(),
      historicoPrecos: [{
        data: new Date().toLocaleDateString('pt-BR'),
        preco: Number(prod.precoVenda) || Number(prod.valorVenda) || 0,
        motivo: 'Cadastro inicial'
      }]
    };

    // ✅ Calcular lucro
    novoProduto.lucro = calcularLucro(novoProduto);

    setProdutos(prev => [...prev, novoProduto]);
    return novoProduto;
  };
  
  const updateProduto = (id, data) => {
    setProdutos(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...data };
        
        // ✅ AUDIT LOG: Registrar mudança de preço
        if (data.precoVenda && data.precoVenda !== p.precoVenda) {
          updated.historicoPrecos = [...(p.historicoPrecos || []), { 
            data: new Date().toLocaleDateString('pt-BR'), 
            precoAntigo: p.precoVenda, 
            precoNovo: data.precoVenda, 
            motivo: data.motivoAlteracao || 'Ajuste manual' 
          }];
          
          // Registrar no Audit Log
          if (createAuditLog) {
            createAuditLog(
              'PRICE_CHANGE',
              'produtos',
              id,
              { precoVenda: p.precoVenda },
              { precoVenda: data.precoVenda },
              data.motivoAlteracao || 'Ajuste manual de preço'
            ).catch(err => console.error('Erro ao criar audit log:', err));
          }
        }

        // ✅ AUDIT LOG: Registrar mudança de fornecedor
        if (data.fornecedorId && data.fornecedorId !== p.fornecedorId) {
          if (createAuditLog) {
            createAuditLog(
              'SUPPLIER_CHANGE',
              'produtos',
              id,
              { fornecedorId: p.fornecedorId },
              { fornecedorId: data.fornecedorId },
              'Fornecedor alterado'
            ).catch(err => console.error('Erro ao criar audit log:', err));
          }
        }

        // ✅ BUSINESS RULE: Recalcular lucro quando preços mudarem
        if (data.precoVenda !== undefined || data.precoCusto !== undefined || data.precoImportacao !== undefined) {
          updated.lucro = calcularLucro(updated);
        }
        
        return updated;
      }
      return p;
    }));
  };

  const deleteProduto = (id) => setProdutos(prev => prev.filter(p => p.id !== id));
  
  // ✅ INVENTORY RESERVATION SYSTEM - Prevenir Oversell
  const reserveStock = (productId, quantity, orderId, trace_id = null) => {
    const produto = produtos.find(p => p.id === productId);
    if (!produto) {
      throw new Error(`Produto ID ${productId} não encontrado`);
    }
    
    const availableStock = (produto.estoque || 0) - (produto.reserved || 0);
    if (availableStock < quantity) {
      throw new Error(`Estoque insuficiente para reserva. Disponível: ${availableStock}, Solicitado: ${quantity}`);
    }
    
    updateProduto(productId, {
      reserved: (produto.reserved || 0) + quantity
    });
    
    // ✅ EVENT-DRIVEN: Emitir evento de reserva
    eventBus.emit(
      EVENTS.INVENTORY.STOCK_RESERVED,
      {
        productId,
        productName: produto.nome || produto.produto,
        quantity,
        orderId,
        newReservedLevel: (produto.reserved || 0) + quantity,
        availableStock: availableStock - quantity,
        reservedAt: new Date().toISOString()
      },
      createEventMetadata({ trace_id, source: 'DataContext.reserveStock' })
    );
    
    return true;
  };
  
  const releaseReservation = (productId, quantity, orderId, trace_id = null) => {
    const produto = produtos.find(p => p.id === productId);
    if (!produto) {
      throw new Error(`Produto ID ${productId} não encontrado`);
    }
    
    updateProduto(productId, {
      reserved: Math.max(0, (produto.reserved || 0) - quantity)
    });
    
    // ✅ EVENT-DRIVEN: Emitir evento de liberação
    eventBus.emit(
      EVENTS.INVENTORY.STOCK_RELEASED,
      {
        productId,
        productName: produto.nome || produto.produto,
        quantity,
        orderId,
        newReservedLevel: Math.max(0, (produto.reserved || 0) - quantity),
        availableStock: (produto.estoque || 0) - Math.max(0, (produto.reserved || 0) - quantity),
        releasedAt: new Date().toISOString()
      },
      createEventMetadata({ trace_id, source: 'DataContext.releaseReservation' })
    );
    
    return true;
  };
  
  // Vendas por Canal - ✅ COM MOVIMENTAÇÃO AUTOMÁTICA E EVENT-DRIVEN
  const addVenda = (venda) => {
    const vendaCompleta = {
      ...venda,
      id: Date.now() + Math.floor(Math.random() * 1000000),
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR'),
      lucro: (venda.valorVenda || 0) - (venda.custoProduto || 0),
      status: venda.status || 'completed', // completed, canceled, returned
      idExterno: venda.idExterno || null, // ID do marketplace (ML, etc)
      feedback: venda.feedback || null // Rating e comentário
    };
    setVendas(prev => [vendaCompleta, ...prev]);
    
    // Atualizar estoque do canal e contabilizar vendas
    const prod = produtos.find(p => p.id === venda.produtoId);
    if (prod && venda.status !== 'canceled') {
      const canal = venda.canal || 'Pessoal';
      const quantidade = venda.quantidade || 1;
      
      // Atualizar produto
      updateProduto(prod.id, {
        estoqueCanais: { ...prod.estoqueCanais, [canal]: Math.max(0, (prod.estoqueCanais?.[canal] || 0) - quantidade) },
        vendidosPorCanal: { ...prod.vendidosPorCanal, [canal]: (prod.vendidosPorCanal?.[canal] || 0) + quantidade },
        totalVendido: (prod.totalVendido || 0) + quantidade
      });
      
      // ✅ FIX: Criar movimentação automática (Histórico de Estoque)
      addMovimentacao({
        produtoId: prod.id,
        produtoNome: prod.nome || prod.produto,
        tipo: 'SAIDA',
        quantidade: quantidade,
        motivo: 'Venda',
        canal: canal,
        vendaId: vendaCompleta.id,
        usuario: venda.usuario || 'Sistema',
        observacao: `Venda #${vendaCompleta.id} - ${venda.cliente || 'Cliente não identificado'}`
      });
      
      // ✅ EVENT-DRIVEN: Emitir evento de venda criada
      const cliente = clientes.find(c => c.id === venda.clienteId || c.nome === venda.cliente);
      const trace_id = crypto.randomUUID();
      
      eventBus.emit(
        EVENTS.SALES.ORDER_CREATED,
        createSalesOrderPayload(vendaCompleta, cliente, [prod]),
        createEventMetadata({ trace_id, source: 'DataContext.addVenda', userId: venda.usuario || 'Sistema' })
      );
      
      eventLogger.info('Venda criada', {
        trace_id,
        order_id: vendaCompleta.id,
        customer: venda.cliente,
        total: venda.valorVenda
      });
      
      // ✅ EVENT-DRIVEN: Se venda já está paga, emitir evento de pagamento
      if (vendaCompleta.status === 'completed' || venda.pago) {
        eventBus.emit(
          EVENTS.SALES.ORDER_PAID,
          {
            orderId: vendaCompleta.id,
            customerId: cliente?.id || null,
            customerName: cliente?.nome || venda.cliente,
            total: venda.valorVenda || 0,
            paymentMethod: venda.formaPagamento || 'Dinheiro',
            paidAt: new Date().toISOString()
          },
          createEventMetadata({ trace_id, source: 'DataContext.addVenda', userId: venda.usuario || 'Sistema' })
        );
      }
    }
    
    return vendaCompleta;
  };

  const updateVenda = (id, data) => {
    const vendaAnterior = vendas.find(v => v.id === id);
    
    setVendas(prev => prev.map(v => {
      if (v.id === id) {
        const updated = { ...v, ...data };
        
        // ✅ EVENT-DRIVEN: Detectar cancelamento de venda
        if (data.status === 'canceled' && vendaAnterior?.status !== 'canceled') {
          const trace_id = crypto.randomUUID();
          eventBus.emit(
            EVENTS.SALES.ORDER_CANCELLED,
            {
              orderId: id,
              customerId: v.clienteId,
              reason: data.motivoCancelamento || 'Não informado',
              cancelledAt: new Date().toISOString()
            },
            createEventMetadata({ trace_id, source: 'DataContext.updateVenda' })
          );
          eventLogger.warn('Venda cancelada', { trace_id, order_id: id });
        }
        
        // ✅ EVENT-DRIVEN: Detectar pagamento de venda
        if (data.status === 'completed' && vendaAnterior?.status === 'pending') {
          const trace_id = crypto.randomUUID();
          const cliente = clientes.find(c => c.id === v.clienteId);
          eventBus.emit(
            EVENTS.SALES.ORDER_PAID,
            {
              orderId: id,
              customerId: cliente?.id || null,
              customerName: cliente?.nome || v.cliente,
              total: v.valorVenda || 0,
              paymentMethod: data.formaPagamento || 'Não informado',
              paidAt: new Date().toISOString()
            },
            createEventMetadata({ trace_id, source: 'DataContext.updateVenda' })
          );
          eventLogger.success('Venda paga', { trace_id, order_id: id, total: v.valorVenda });
        }
        
        return updated;
      }
      return v;
    }));
  };

  // Devoluções
  const addDevolucao = (devolucao) => {
    const devolucaoCompleta = {
      ...devolucao,
      id: Date.now(),
      dataDevolucao: new Date().toLocaleDateString('pt-BR'),
      horaDevolucao: new Date().toLocaleTimeString('pt-BR'),
      status: devolucao.status || 'pending' // pending, approved, rejected, completed
    };
    setDevolucoes(prev => [devolucaoCompleta, ...prev]);
    
    // Atualizar status da venda se vinculada
    if (devolucao.vendaId) {
      updateVenda(devolucao.vendaId, { status: 'returned' });
    }
    
    // Restaurar estoque se devolução aprovada
    if (devolucao.status === 'approved' && devolucao.produtoId) {
      const prod = produtos.find(p => p.id === devolucao.produtoId);
      if (prod) {
        const canal = devolucao.canal || 'Pessoal';
        updateProduto(prod.id, {
          estoqueCanais: { ...prod.estoqueCanais, [canal]: (prod.estoqueCanais?.[canal] || 0) + 1 }
        });
      }
    }
  };

  const updateDevolucao = (id, data) => {
    setDevolucoes(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, ...data };
        
        // Se status mudou para approved, restaurar estoque
        if (data.status === 'approved' && d.status !== 'approved' && d.produtoId) {
          const prod = produtos.find(p => p.id === d.produtoId);
          if (prod) {
            const canal = d.canal || 'Pessoal';
            updateProduto(prod.id, {
              estoqueCanais: { ...prod.estoqueCanais, [canal]: (prod.estoqueCanais?.[canal] || 0) + 1 }
            });
          }
        }
        
        return updated;
      }
      return d;
    }));
  };

  // CRM & Rede
  const addCliente = (cli) => setClientes(prev => [...prev, { 
    ...cli, 
    id: Date.now(), 
    dataCadastro: new Date().toLocaleDateString('pt-BR'), 
    compras: 0,
    totalGasto: 0
  }]);
  const updateCliente = (id, data) => setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteCliente = (id) => setClientes(prev => prev.filter(c => c.id !== id));
  
  const addFornecedor = (forn) => {
    // ✅ VALIDAÇÃO: Campos obrigatórios
    if (!forn.nome || !forn.contato) {
      throw new Error('Fornecedor deve ter nome e contato');
    }
    
    setFornecedores(prev => [...prev, { 
      ...forn, 
      id: Date.now(), 
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
      ativo: true,
      leadTime: forn.leadTime || 7, // ✅ Lead time em dias (padrão: 7)
      itens: forn.itens || [] // Array de IDs de itens vinculados
    }]);
  };
  const updateFornecedor = (idx, data) => setFornecedores(prev => prev.map((f, i) => i === idx ? { ...f, ...data } : f));
  const deleteFornecedor = (idx) => setFornecedores(prev => prev.filter((_, i) => i !== idx));

  // Itens de Estoque
  const addItemEstoque = (item) => setItensEstoque(prev => [...prev, {
    ...item,
    id: Date.now(),
    dataCadastro: new Date().toLocaleDateString('pt-BR')
  }]);
  const updateItemEstoque = (id, data) => setItensEstoque(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
  const deleteItemEstoque = (id) => setItensEstoque(prev => prev.filter(item => item.id !== id));

  // Movimentações de Estoque - ✅ COM EVENT-DRIVEN
  const addMovimentacao = (mov) => {
    // ✅ REGRA CRÍTICA: Validação de Integridade Referencial
    const produto = produtos.find(p => p.id === parseInt(mov.produtoId));
    if (!produto) {
      throw new Error(`Produto ID ${mov.produtoId} não encontrado`);
    }

    // ✅ CONSTRAINT: fornecedor_id obrigatório para movimentações de entrada
    if (mov.tipo === 'entrada' && !mov.fornecedorId) {
      throw new Error('Movimentação de ENTRADA requer um fornecedor válido (Foreign Key obrigatória)');
    }

    // ✅ Validar se fornecedor existe (Foreign Key Constraint)
    if (mov.fornecedorId) {
      const fornecedor = fornecedores.find(f => 
        f.id === parseInt(mov.fornecedorId) || f.id === mov.fornecedorId
      );
      if (!fornecedor) {
        throw new Error(`Fornecedor ID ${mov.fornecedorId} não encontrado. Violação de Foreign Key`);
      }
    }

    // Atualizar estoque do produto
    if (mov.tipo === 'entrada') {
      updateProduto(parseInt(mov.produtoId), { estoque: produto.estoque + mov.quantidade });
    } else if (mov.tipo === 'saida') {
      updateProduto(parseInt(mov.produtoId), { estoque: Math.max(0, produto.estoque - mov.quantidade) });
    }

    // Registrar movimentação
    const novaMovimentacao = {
      ...mov,
      id: Date.now() + Math.floor(Math.random() * 1000000),
      produtoNome: produto.produto || produto.nome,
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR'),
      usuario: mov.usuario || 'Admin'
    };
    
    setMovimentacoes(prev => [...prev, novaMovimentacao]);
    
    // ✅ EVENT-DRIVEN: Emitir eventos de estoque
    const trace_id = crypto.randomUUID();
    
    if (mov.tipo === 'entrada') {
      eventBus.emit(
        EVENTS.INVENTORY.STOCK_RECEIVED,
        {
          productId: produto.id,
          productName: produto.nome || produto.produto,
          quantity: mov.quantidade,
          supplierId: mov.fornecedorId,
          newStockLevel: produto.estoque + mov.quantidade,
          receivedAt: new Date().toISOString()
        },
        createEventMetadata({ trace_id, source: 'DataContext.addMovimentacao', userId: mov.usuario || 'Admin' })
      );
      eventLogger.info('Estoque recebido', { trace_id, product_id: produto.id, quantity: mov.quantidade });
    } else if (mov.tipo === 'saida') {
      eventBus.emit(
        EVENTS.INVENTORY.STOCK_SHIPPED,
        {
          productId: produto.id,
          productName: produto.nome || produto.produto,
          quantity: mov.quantidade,
          orderId: mov.vendaId || null,
          newStockLevel: Math.max(0, produto.estoque - mov.quantidade),
          shippedAt: new Date().toISOString()
        },
        createEventMetadata({ trace_id, source: 'DataContext.addMovimentacao', userId: mov.usuario || 'Admin' })
      );
      eventLogger.info('Estoque expedido', { trace_id, product_id: produto.id, quantity: mov.quantidade });
      
      // ✅ ALERTA: Estoque baixo
      const newStock = Math.max(0, produto.estoque - mov.quantidade);
      if (newStock <= 10) { // Threshold configurável
        eventBus.emit(
          EVENTS.INVENTORY.ALERT_LOW_STOCK,
          {
            productId: produto.id,
            productName: produto.nome || produto.produto,
            currentStock: newStock,
            threshold: 10,
            alertedAt: new Date().toISOString()
          },
          createEventMetadata({ trace_id, source: 'DataContext.addMovimentacao', priority: 'high' })
        );
        eventLogger.warn('Alerta: estoque baixo após saída', { trace_id, product_id: produto.id, stock: newStock });
      }
    }
    
    return novaMovimentacao;
  };

  // Tarefas
  const addTarefa = (texto) => setTarefas(prev => [...prev, { id: Date.now(), texto, feita: false, data: new Date().toLocaleDateString('pt-BR') }]);
  const toggleTarefa = (id) => setTarefas(prev => prev.map(t => t.id === id ? { ...t, feita: !t.feita } : t));
  const limparTarefas = () => setTarefas(prev => prev.filter(t => !t.feita));

  // Backup
  const exportarBackup = () => {
    const dados = { produtos, vendas, despesas, clientes, fornecedores, tarefas, config, version: '1.0' };
    const blob = new Blob([JSON.stringify(dados)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `backup_aureon_${new Date().toISOString().slice(0,10)}.json`; 
    a.click();
  };

  return (
    <DataContext.Provider value={{
      // Configurações
      config, setConfig, tiposOculos, canaisVenda,
      
      // Produtos
      produtos, addProduto, updateProduto, deleteProduto,
      
      // Inventory Reservation (Prevenir Oversell)
      reserveStock, releaseReservation,
      
      // Vendas
      vendas, addVenda, updateVenda,

      // Movimentações
      movimentacoes, addMovimentacao,
      
      // Devoluções
      devolucoes, addDevolucao, updateDevolucao,
      
      // Clientes
      clientes, addCliente, updateCliente, deleteCliente,
      
      // Fornecedores
      fornecedores, addFornecedor, updateFornecedor, deleteFornecedor,
      
      // Itens de Estoque
      itensEstoque, addItemEstoque, updateItemEstoque, deleteItemEstoque,
      
      // Tarefas
      tarefas, addTarefa, toggleTarefa, limparTarefas,
      
      // Backup
      exportarBackup
    }}>
      {children}
    </DataContext.Provider>
  );
};