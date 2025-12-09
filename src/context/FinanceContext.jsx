import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContextAPI';
import { useSimulation } from './SimulationContext';
import eventBus from '../services/EventBus';
import { EVENTS, createFinanceReceivablePayload, createFinanceExpensePayload, createEventMetadata, propagateTraceId } from '../services/EventTypes';
import eventLogger from '../services/EventLogger';
import { generateUniqueId } from '../utils/idGenerator';

export const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const { user: currentUser } = useAuth();
  const simulation = useSimulation();
  
  // Prefixo do banco de dados (produção ou simulação)
  const dbPrefix = simulation?.getPrefix() || 'aureon_';

  const safeLoad = (key, def) => {
    try {
      const fullKey = `${dbPrefix}${key}`;
      const item = localStorage.getItem(fullKey);
      return item ? JSON.parse(item) : def;
    } catch (e) { return def; }
  };

  // ============================================
  // ESTADO FINANCEIRO
  // ============================================
  const [despesas, setDespesas] = useState(() => safeLoad('despesas', []));
  const [contasReceber, setContasReceber] = useState(() => safeLoad('contasReceber', []));
  const [contasBancarias, setContasBancarias] = useState(() => safeLoad('contasBancarias', []));
  const [lancamentosBancarios, setLancamentosBancarios] = useState(() => safeLoad('lancamentosBancarios', []));
  const [impostos, setImpostos] = useState(() => safeLoad('impostos', []));

  // Persistir no localStorage
  useEffect(() => localStorage.setItem(`${dbPrefix}despesas`, JSON.stringify(despesas)), [despesas, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}contasReceber`, JSON.stringify(contasReceber)), [contasReceber, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}contasBancarias`, JSON.stringify(contasBancarias)), [contasBancarias, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}lancamentosBancarios`, JSON.stringify(lancamentosBancarios)), [lancamentosBancarios, dbPrefix]);
  useEffect(() => localStorage.setItem(`${dbPrefix}impostos`, JSON.stringify(impostos)), [impostos, dbPrefix]);

  // ============================================
  // ✅ EVENT-DRIVEN AUTOMATIONS (P0 CRITICAL)
  // ============================================
  
  useEffect(() => {
    // ✅ AUTOMAÇÃO: Venda paga → Criar conta a receber automaticamente
    const handleSalesOrderPaid = (event) => {
      const trace_id = propagateTraceId(event);
      eventLogger.info('Processando venda paga - criando receivable', {
        trace_id,
        order_id: event.payload.orderId,
        total: event.payload.total
      });
      
      const { orderId, customerId, customerName, total, paymentMethod } = event.payload;
      
      // Verificar se já existe conta a receber para essa venda
      const existingReceivable = contasReceber.find(c => c.vendaId === orderId);
      if (existingReceivable) {
        eventLogger.warn('Conta a receber já existe para venda', {
          trace_id,
          order_id: orderId,
          receivable_id: existingReceivable.id
        });
        return;
      }
      
      // Criar conta a receber automática
      const novaConta = {
        vendaId: orderId,
        clienteId: customerId,
        clienteNome: customerName || 'Cliente não identificado',
        valorTotal: total,
        valorRecebido: total, // Já está pago
        valorPendente: 0,
        parcelas: [{
          id: generateUniqueId(),
          numero: 1,
          valor: total,
          dataVencimento: new Date().toISOString().split('T')[0],
          dataPagamento: new Date().toISOString().split('T')[0],
          status: 'recebido',
          formaPagamento: paymentMethod
        }],
        statusGeral: 'recebido',
        antecipado: false
      };
      
      const created = addContaReceber(novaConta, trace_id);
      
      eventLogger.success('Conta a receber criada automaticamente', {
        trace_id,
        receivable_id: created.id,
        order_id: orderId,
        amount: total
      });
      
      // Emitir evento de receivable criado
      eventBus.emit(
        EVENTS.FINANCE.RECEIVABLE_CREATED,
        {
          receivableId: created.id,
          orderId,
          customerId,
          amount: total,
          status: 'recebido',
          createdAt: new Date().toISOString()
        },
        createEventMetadata({ trace_id, source: 'FinanceContext.autoCreateReceivable', triggeredBy: 'SALES.ORDER_PAID' })
      );
    };
    
    // ✅ AUTOMAÇÃO: Pedido de compra aprovado → Criar despesa automaticamente
    const handlePurchaseOrderApproved = (event) => {
      const trace_id = propagateTraceId(event);
      eventLogger.info('Processando pedido aprovado - criando despesa', {
        trace_id,
        order_id: event.payload.orderId,
        total: event.payload.totalCost
      });
      
      const { orderId, supplierId, supplierName, totalCost, dueDate } = event.payload;
      
      // Verificar se já existe despesa para esse pedido
      const existingExpense = despesas.find(d => d.pedidoId === orderId);
      if (existingExpense) {
        eventLogger.warn('Despesa já existe para pedido', {
          trace_id,
          order_id: orderId,
          expense_id: existingExpense.id
        });
        return;
      }
      
      // Criar despesa automática
      const novaDespesa = {
        pedidoId: orderId,
        categoria: 'Compras',
        descricao: `Pedido #${orderId} - ${supplierName}`,
        valor: totalCost,
        tipo: 'Pontual',
        centroCusto: 'Compras',
        status: 'pendente',
        dataVencimento: dueDate || new Date().toISOString().split('T')[0],
        fornecedor: supplierName,
        observacoes: `Criado automaticamente pelo sistema ao aprovar pedido de compra`
      };
      
      const created = addDespesa(novaDespesa, trace_id);
      
      eventLogger.success('Despesa criada automaticamente', {
        trace_id,
        expense_id: created.id,
        order_id: orderId,
        amount: totalCost
      });
      
      // Emitir evento de expense criado
      eventBus.emit(
        EVENTS.FINANCE.EXPENSE_CREATED,
        {
          expenseId: created.id,
          purchaseOrderId: orderId,
          supplierId,
          amount: totalCost,
          category: 'Compras',
          status: 'pendente',
          createdAt: new Date().toISOString()
        },
        createEventMetadata({ trace_id, source: 'FinanceContext.autoCreateExpense', triggeredBy: 'PURCHASE.ORDER_APPROVED' })
      );
    };
    
    // ✅ AUTOMAÇÃO: Nota fiscal de compra recebida → Linkar com despesa
    const handlePurchaseInvoiceReceived = (event) => {
      console.log('🔔 [FinanceContext] Nota fiscal recebida:', event);
      
      const { purchaseOrderId, invoiceNumber, invoiceDate, totalAmount } = event.payload;
      
      // Buscar despesa relacionada ao pedido
      const despesa = despesas.find(d => d.pedidoId === purchaseOrderId);
      if (despesa) {
        updateDespesa(despesa.id, {
          notaFiscal: invoiceNumber,
          dataNotaFiscal: invoiceDate,
          observacoes: `${despesa.observacoes || ''}\nNota Fiscal: ${invoiceNumber} recebida em ${invoiceDate}`
        });
        console.log('✅ [FinanceContext] Despesa atualizada com nota fiscal:', despesa.id);
      }
    };
    
    // ✅ AUTOMAÇÃO: Reconciliar pagamentos automaticamente
    const handlePaymentReconciliation = (event) => {
      const trace_id = propagateTraceId(event);
      const { bankAccountId, amount, type } = event.payload; // type: 'inflow' | 'outflow'
      
      eventLogger.info('Reconciliando pagamento', {
        trace_id,
        bank_account_id: bankAccountId,
        amount,
        type
      });
      
      try {
        if (bankAccountId) {
          const conta = contasBancarias.find(c => c.id === bankAccountId);
          if (conta) {
            const ajuste = type === 'inflow' ? amount : -amount;
            updateSaldoConta(bankAccountId, ajuste);
            
            eventLogger.success('Saldo bancário atualizado', {
              trace_id,
              bank_account_id: bankAccountId,
              previous_balance: conta.saldoAtual,
              adjustment: ajuste,
              new_balance: conta.saldoAtual + ajuste
            });
          } else {
            eventLogger.warn('Conta bancária não encontrada', {
              trace_id,
              bank_account_id: bankAccountId
            });
          }
        }
      } catch (error) {
        eventLogger.error('Erro ao reconciliar pagamento', {
          trace_id,
          error: error.message,
          bank_account_id: bankAccountId
        });
      }
    };
    
    // Registrar listeners
    eventBus.on(EVENTS.SALES.ORDER_PAID, handleSalesOrderPaid);
    eventBus.on(EVENTS.PURCHASE.ORDER_APPROVED, handlePurchaseOrderApproved);
    eventBus.on(EVENTS.PURCHASE.INVOICE_RECEIVED, handlePurchaseInvoiceReceived);
    eventBus.on(EVENTS.FINANCE.PAYMENT_RECEIVED, handlePaymentReconciliation);
    eventBus.on(EVENTS.FINANCE.PAYMENT_MADE, handlePaymentReconciliation);
    
    if (import.meta.env.DEV) {
      eventLogger.debug('FinanceContext: Event listeners registrados (5 eventos)');
    }
    
    // Cleanup na desmontagem (garantir todos os 5 listeners)
    return () => {
      eventBus.off(EVENTS.SALES.ORDER_PAID, handleSalesOrderPaid);
      eventBus.off(EVENTS.PURCHASE.ORDER_APPROVED, handlePurchaseOrderApproved);
      eventBus.off(EVENTS.PURCHASE.INVOICE_RECEIVED, handlePurchaseInvoiceReceived);
      eventBus.off(EVENTS.FINANCE.PAYMENT_RECEIVED, handlePaymentReconciliation);
      eventBus.off(EVENTS.FINANCE.PAYMENT_MADE, handlePaymentReconciliation);
    };
  }, []); // ✅ Registrar apenas 1x no mount (handlers usam closure)

  // ============================================
  // DESPESAS (CONTAS A PAGAR)
  // ============================================
  
  const addDespesa = (despesa, trace_id = null) => {
    const novaDespesa = {
      id: generateUniqueId(),
      categoria: despesa.categoria || 'Outros',
      descricao: despesa.descricao || '',
      valor: Number(despesa.valor) || 0,
      tipo: despesa.tipo || 'Pontual', // Fixo | Variável | Pontual
      centroCusto: despesa.centroCusto || 'Administrativo',
      status: despesa.status || 'pendente',
      dataVencimento: despesa.dataVencimento || new Date().toISOString().split('T')[0],
      dataPagamento: despesa.dataPagamento || null,
      formaPagamento: despesa.formaPagamento || 'Transferência',
      contaBancariaId: despesa.contaBancariaId || null,
      recorrente: despesa.recorrente || false,
      frequencia: despesa.frequencia || 'Único',
      proximoVencimento: despesa.proximoVencimento || null,
      boleto: despesa.boleto || null,
      fornecedor: despesa.fornecedor || '',
      observacoes: despesa.observacoes || '',
      dataCriacao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      usuarioCriacao: currentUser?.email || 'sistema'
    };
    
    setDespesas(prev => [...prev, novaDespesa]);
    
    // ✅ EVENT-DRIVEN: Emitir evento de despesa criada
    const final_trace_id = trace_id || crypto.randomUUID();
    eventBus.emit(
      EVENTS.FINANCE.EXPENSE_CREATED,
      {
        expenseId: novaDespesa.id,
        category: novaDespesa.categoria,
        amount: novaDespesa.valor,
        dueDate: novaDespesa.dataVencimento,
        status: novaDespesa.status,
        supplier: novaDespesa.fornecedor,
        createdAt: novaDespesa.dataCriacao
      },
      createEventMetadata({ trace_id: final_trace_id, source: 'FinanceContext.addDespesa', userId: currentUser?.email || 'sistema' })
    );
    
    eventLogger.info('Despesa criada', {
      trace_id: final_trace_id,
      expense_id: novaDespesa.id,
      amount: novaDespesa.valor,
      category: novaDespesa.categoria
    });
    
    return novaDespesa;
  };

  const updateDespesa = (id, updates, trace_id = null) => {
    setDespesas(prev => prev.map(d => 
      d.id === id 
        ? { ...d, ...updates, ultimaAtualizacao: new Date().toISOString() }
        : d
    ));
  };

  const deleteDespesa = (id) => {
    setDespesas(prev => prev.filter(d => d.id !== id));
  };

  const pagarDespesa = (id, formaPagamento, contaBancariaId) => {
    const despesa = despesas.find(d => d.id === id);
    if (!despesa) return;

    updateDespesa(id, {
      status: 'pago',
      dataPagamento: new Date().toISOString().split('T')[0],
      formaPagamento,
      contaBancariaId
    });

    // Registrar lançamento bancário
    if (contaBancariaId) {
      addLancamentoBancario({
        contaBancariaId,
        tipo: 'saida',
        valor: despesa.valor,
        data: new Date().toISOString().split('T')[0],
        descricao: `Pagamento: ${despesa.descricao}`,
        categoria: 'Despesas',
        conciliado: true,
        despesaId: id
      });

      // Atualizar saldo da conta
      updateSaldoConta(contaBancariaId, -despesa.valor);
    }
    
    // ✅ EVENT-DRIVEN: Emitir evento de pagamento realizado
    const payment_trace_id = crypto.randomUUID();
    eventBus.emit(
      EVENTS.FINANCE.PAYMENT_MADE,
      {
        expenseId: id,
        amount: despesa.valor,
        paymentMethod: formaPagamento,
        bankAccountId: contaBancariaId,
        paidAt: new Date().toISOString()
      },
      createEventMetadata({ trace_id: payment_trace_id, source: 'FinanceContext.pagarDespesa', userId: currentUser?.email || 'sistema' })
    );
    
    eventLogger.success('Pagamento de despesa realizado', {
      trace_id: payment_trace_id,
      expense_id: id,
      amount: despesa.valor,
      payment_method: formaPagamento,
      bank_account_id: contaBancariaId
    });
  };

  // ============================================
  // CONTAS A RECEBER
  // ============================================
  
  const addContaReceber = (conta, trace_id = null) => {
    const novaConta = {
      id: generateUniqueId(),
      vendaId: conta.vendaId,
      clienteId: conta.clienteId,
      clienteNome: conta.clienteNome,
      valorTotal: Number(conta.valorTotal) || 0,
      valorRecebido: Number(conta.valorRecebido) || 0,
      valorPendente: Number(conta.valorPendente) || Number(conta.valorTotal),
      parcelas: conta.parcelas || [],
      statusGeral: conta.statusGeral || 'pendente',
      antecipado: conta.antecipado || false,
      valorAntecipacao: conta.valorAntecipacao || 0,
      taxaAntecipacao: conta.taxaAntecipacao || 0,
      dataAntecipacao: conta.dataAntecipacao || null,
      dataCriacao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString()
    };
    
    setContasReceber(prev => [...prev, novaConta]);
    
    // ✅ EVENT-DRIVEN: Emitir evento de conta a receber criada
    const final_trace_id = trace_id || crypto.randomUUID();
    eventBus.emit(
      EVENTS.FINANCE.RECEIVABLE_CREATED,
      {
        receivableId: novaConta.id,
        orderId: novaConta.vendaId,
        customerId: novaConta.clienteId,
        customerName: novaConta.clienteNome,
        amount: novaConta.valorTotal,
        status: novaConta.statusGeral,
        installments: novaConta.parcelas.length,
        createdAt: novaConta.dataCriacao
      },
      createEventMetadata({ trace_id: final_trace_id, source: 'FinanceContext.addContaReceber', userId: currentUser?.email || 'sistema' })
    );
    
    eventLogger.info('Conta a receber criada', {
      trace_id: final_trace_id,
      receivable_id: novaConta.id,
      amount: novaConta.valorTotal,
      customer: novaConta.clienteNome
    });
    
    return novaConta;
  };

  const updateContaReceber = (id, updates, trace_id = null) => {
    setContasReceber(prev => prev.map(c => 
      c.id === id 
        ? { ...c, ...updates, ultimaAtualizacao: new Date().toISOString() }
        : c
    ));
  };

  const receberParcela = (contaId, parcelaNumero, formaPagamento, contaBancariaId) => {
    const conta = contasReceber.find(c => c.id === contaId);
    if (!conta) return;

    const parcelas = conta.parcelas.map(p => {
      if (p.numero === parcelaNumero && p.status === 'pendente') {
        return {
          ...p,
          status: 'recebido',
          dataPagamento: new Date().toISOString().split('T')[0],
          formaPagamento
        };
      }
      return p;
    });

    const valorRecebido = parcelas.filter(p => p.status === 'recebido').reduce((acc, p) => acc + p.valor, 0);
    const valorPendente = conta.valorTotal - valorRecebido;
    const statusGeral = valorPendente === 0 ? 'recebido' : valorPendente < conta.valorTotal ? 'parcial' : 'pendente';

    updateContaReceber(contaId, {
      parcelas,
      valorRecebido,
      valorPendente,
      statusGeral
    });

    // Registrar lançamento bancário
    if (contaBancariaId) {
      const parcela = conta.parcelas.find(p => p.numero === parcelaNumero);
      addLancamentoBancario({
        contaBancariaId,
        tipo: 'entrada',
        valor: parcela.valor,
        data: new Date().toISOString().split('T')[0],
        descricao: `Recebimento parcela ${parcelaNumero}/${conta.parcelas.length} - ${conta.clienteNome}`,
        categoria: 'Vendas',
        conciliado: true,
        contaReceberId: contaId
      });

      // Atualizar saldo da conta
      updateSaldoConta(contaBancariaId, parcela.valor);
    }
    
    // ✅ EVENT-DRIVEN: Emitir evento de pagamento recebido
    const parcela = conta.parcelas.find(p => p.numero === parcelaNumero);
    const payment_trace_id = crypto.randomUUID();
    eventBus.emit(
      EVENTS.FINANCE.PAYMENT_RECEIVED,
      {
        receivableId: contaId,
        orderId: conta.vendaId,
        customerId: conta.clienteId,
        installmentNumber: parcelaNumero,
        amount: parcela.valor,
        paymentMethod: formaPagamento,
        bankAccountId: contaBancariaId,
        receivedAt: new Date().toISOString()
      },
      createEventMetadata({ trace_id: payment_trace_id, source: 'FinanceContext.receberParcela', userId: currentUser?.email || 'sistema' })
    );
    
    eventLogger.success('Pagamento recebido', {
      trace_id: payment_trace_id,
      receivable_id: contaId,
      order_id: conta.vendaId,
      installment: parcelaNumero,
      amount: parcela.valor,
      payment_method: formaPagamento
    });
  };

  // ============================================
  // CONTAS BANCÁRIAS
  // ============================================
  
  const addContaBancaria = (conta) => {
    const novaConta = {
      id: generateUniqueId(),
      banco: conta.banco,
      codigoBanco: conta.codigoBanco || '',
      agencia: conta.agencia,
      conta: conta.conta,
      tipo: conta.tipo || 'Corrente',
      saldoInicial: Number(conta.saldoInicial) || 0,
      saldoAtual: Number(conta.saldoInicial) || 0,
      ativo: conta.ativo !== false,
      dataCadastro: new Date().toISOString()
    };
    
    setContasBancarias(prev => [...prev, novaConta]);
    return novaConta;
  };

  const updateContaBancaria = (id, updates) => {
    setContasBancarias(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const updateSaldoConta = (id, valor) => {
    setContasBancarias(prev => prev.map(c => 
      c.id === id ? { ...c, saldoAtual: c.saldoAtual + valor } : c
    ));
  };

  const setSaldoConta = (id, novoSaldo) => {
    setContasBancarias(prev => prev.map(c => 
      c.id === id ? { ...c, saldoAtual: Number(novoSaldo) || 0 } : c
    ));
  };

  // ============================================
  // LANÇAMENTOS BANCÁRIOS
  // ============================================
  
  const addLancamentoBancario = (lancamento) => {
    const novoLancamento = {
      id: generateUniqueId(),
      contaBancariaId: lancamento.contaBancariaId,
      tipo: lancamento.tipo, // entrada | saida
      valor: Number(lancamento.valor) || 0,
      data: lancamento.data || new Date().toISOString().split('T')[0],
      descricao: lancamento.descricao || '',
      categoria: lancamento.categoria || 'Outros',
      conciliado: lancamento.conciliado || false,
      vendaId: lancamento.vendaId || null,
      despesaId: lancamento.despesaId || null,
      contaReceberId: lancamento.contaReceberId || null,
      origem: lancamento.origem || 'manual',
      arquivoImportacao: lancamento.arquivoImportacao || null,
      dataCriacao: new Date().toISOString()
    };
    
    setLancamentosBancarios(prev => [...prev, novoLancamento]);
    return novoLancamento;
  };

  // ============================================
  // IMPOSTOS
  // ============================================
  
  const addImposto = (imposto) => {
    const novoImposto = {
      id: generateUniqueId(),
      mes: imposto.mes,
      regime: imposto.regime || 'Simples Nacional',
      faixa: imposto.faixa || 1,
      aliquota: Number(imposto.aliquota) || 7.65,
      faturamentoBruto: Number(imposto.faturamentoBruto) || 0,
      baseCalculo: Number(imposto.baseCalculo) || Number(imposto.faturamentoBruto),
      valorImposto: Number(imposto.valorImposto) || 0,
      status: imposto.status || 'pendente',
      dataVencimento: imposto.dataVencimento,
      dataPagamento: imposto.dataPagamento || null,
      valorPago: imposto.valorPago || 0,
      multa: imposto.multa || 0,
      juros: imposto.juros || 0,
      detalhamento: imposto.detalhamento || {},
      dataCriacao: new Date().toISOString()
    };
    
    setImpostos(prev => [...prev, novoImposto]);
    return novoImposto;
  };

  const updateImposto = (id, updates) => {
    setImpostos(prev => prev.map(i => 
      i.id === id ? { ...i, ...updates } : i
    ));
  };

  // ============================================
  // CÁLCULOS E ANÁLISES
  // ============================================
  
  const calcularSaldoTotal = () => {
    return contasBancarias
      .filter(c => c.ativo)
      .reduce((total, c) => total + c.saldoAtual, 0);
  };

  const calcularDespesasPendentes = () => {
    return despesas
      .filter(d => d.status === 'pendente' || d.status === 'vencido')
      .reduce((total, d) => total + d.valor, 0);
  };

  const calcularRecebivesPendentes = () => {
    return contasReceber
      .filter(c => c.statusGeral !== 'recebido')
      .reduce((total, c) => total + c.valorPendente, 0);
  };

  const getDespesasVencendo = (dias = 7) => {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);

    return despesas.filter(d => {
      if (d.status !== 'pendente') return false;
      const vencimento = new Date(d.dataVencimento);
      return vencimento >= hoje && vencimento <= limite;
    });
  };

  const getRecebiveisPendentes = (dias = 30) => {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);

    return contasReceber
      .filter(c => c.statusGeral !== 'recebido')
      .flatMap(c => 
        c.parcelas
          .filter(p => p.status === 'pendente')
          .map(p => ({
            ...p,
            contaId: c.id,
            clienteNome: c.clienteNome,
            vendaId: c.vendaId
          }))
      )
      .filter(p => {
        const vencimento = new Date(p.dataVencimento);
        return vencimento >= hoje && vencimento <= limite;
      });
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value = {
    // Estado
    despesas,
    contasReceber,
    contasBancarias,
    lancamentosBancarios,
    impostos,
    
    // Despesas
    addDespesa,
    updateDespesa,
    deleteDespesa,
    pagarDespesa,
    
    // Contas a Receber
    addContaReceber,
    updateContaReceber,
    receberParcela,
    
    // Contas Bancárias
    addContaBancaria,
    updateContaBancaria,
    updateSaldoConta,
    setSaldoConta,
    
    // Lançamentos
    addLancamentoBancario,
    
    // Impostos
    addImposto,
    updateImposto,
    
    // Cálculos
    calcularSaldoTotal,
    calcularDespesasPendentes,
    calcularRecebivesPendentes,
    getDespesasVencendo,
    getRecebiveisPendentes
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
};
