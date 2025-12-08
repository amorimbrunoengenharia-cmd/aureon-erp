import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Search, Filter, Download, Upload, Calendar, DollarSign, AlertCircle, Check, X, Edit2, Trash2, FileText } from 'lucide-react';

/**
 * Gerenciador de Contas a Pagar (Despesas)
 * CRUD completo + Upload de boletos + Filtros
 */
export default function ExpensesManager() {
  const {
    despesas,
    addDespesa,
    updateDespesa,
    deleteDespesa,
    pagarDespesa
  } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todas'); // todas | pendente | pago | vencido
  const [filterCategoria, setFilterCategoria] = useState('todas');
  const [sortBy, setSortBy] = useState('vencimento'); // vencimento | valor | categoria
  const [showBoletoViewer, setShowBoletoViewer] = useState(false);
  const [boletoToView, setBoletoToView] = useState(null);
  const [processingIA, setProcessingIA] = useState(false);
  const [iaFillMode, setIaFillMode] = useState(true); // true = IA ativo, false = manual

  const [formData, setFormData] = useState({
    categoria: '',
    descricao: '',
    valor: '',
    tipo: 'Fixo', // Fixo | Variável | Pontual
    centroCusto: '',
    dataVencimento: '',
    recorrencia: 'mensal', // mensal | trimestral | semestral | anual | unico
    fornecedor: '',
    observacoes: '',
    boleto: null
  });

  // ============================================
  // CATEGORIAS PADRÃO
  // ============================================
  
  const categorias = [
    'Aluguel',
    'Salários',
    'Encargos',
    'Fornecedores',
    'Energia',
    'Água',
    'Internet',
    'Telefone',
    'Marketing',
    'Impostos',
    'Manutenção',
    'Seguros',
    'Outros'
  ];

  // ============================================
  // FILTROS E ORDENAÇÃO
  // ============================================
  
  const despesasFiltradas = useMemo(() => {
    let resultado = [...despesas];

    // Busca por texto
    if (searchTerm) {
      resultado = resultado.filter(d =>
        d.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (filterStatus !== 'todas') {
      if (filterStatus === 'vencido') {
        resultado = resultado.filter(d => {
          if (d.status !== 'pendente') return false;
          const hoje = new Date();
          const vencimento = new Date(d.dataVencimento + 'T00:00:00');
          return vencimento < hoje;
        });
      } else {
        resultado = resultado.filter(d => d.status === filterStatus);
      }
    }

    // Filtro por categoria
    if (filterCategoria !== 'todas') {
      resultado = resultado.filter(d => d.categoria === filterCategoria);
    }

    // Ordenação
    resultado.sort((a, b) => {
      if (sortBy === 'vencimento') {
        return new Date(a.dataVencimento) - new Date(b.dataVencimento);
      } else if (sortBy === 'valor') {
        return b.valor - a.valor;
      } else if (sortBy === 'categoria') {
        return a.categoria.localeCompare(b.categoria);
      }
      return 0;
    });

    return resultado;
  }, [despesas, searchTerm, filterStatus, filterCategoria, sortBy]);

  // ============================================
  // ESTATÍSTICAS
  // ============================================
  
  const stats = useMemo(() => {
    const hoje = new Date();
    
    const totalPendente = despesas
      .filter(d => d.status === 'pendente')
      .reduce((sum, d) => sum + d.valor, 0);
    
    const totalPago = despesas
      .filter(d => d.status === 'pago')
      .reduce((sum, d) => sum + d.valor, 0);
    
    const vencidas = despesas.filter(d => {
      if (d.status !== 'pendente') return false;
      const vencimento = new Date(d.dataVencimento + 'T00:00:00');
      return vencimento < hoje;
    });
    
    const vencendoEm7Dias = despesas.filter(d => {
      if (d.status !== 'pendente') return false;
      const vencimento = new Date(d.dataVencimento + 'T00:00:00');
      const em7Dias = new Date(hoje);
      em7Dias.setDate(em7Dias.getDate() + 7);
      return vencimento >= hoje && vencimento <= em7Dias;
    });

    return {
      totalPendente,
      totalPago,
      vencidas: vencidas.length,
      totalVencidas: vencidas.reduce((sum, d) => sum + d.valor, 0),
      vencendoEm7Dias: vencendoEm7Dias.length,
      totalVencendo7Dias: vencendoEm7Dias.reduce((sum, d) => sum + d.valor, 0)
    };
  }, [despesas]);

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleSubmit = (e) => {
    e.preventDefault();

    const despesa = {
      categoria: formData.categoria,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      tipo: formData.tipo,
      centroCusto: formData.centroCusto || 'Geral',
      dataVencimento: formData.dataVencimento,
      recorrencia: formData.recorrencia,
      fornecedor: formData.fornecedor || '',
      observacoes: formData.observacoes || '',
      boleto: formData.boleto,
      status: 'pendente'
    };

    if (editingId) {
      updateDespesa(editingId, despesa);
    } else {
      addDespesa(despesa);
    }

    resetForm();
  };

  const handleEdit = (despesa) => {
    setEditingId(despesa.id);
    setFormData({
      categoria: despesa.categoria,
      descricao: despesa.descricao,
      valor: despesa.valor.toString(),
      tipo: despesa.tipo,
      centroCusto: despesa.centroCusto,
      dataVencimento: despesa.dataVencimento,
      recorrencia: despesa.recorrencia,
      fornecedor: despesa.fornecedor || '',
      observacoes: despesa.observacoes || '',
      boleto: despesa.boleto
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      deleteDespesa(id);
    }
  };

  const handlePagar = (id) => {
    const contaBancariaId = prompt('ID da conta bancária para débito (deixe vazio se não tiver):');
    pagarDespesa(id, contaBancariaId ? parseInt(contaBancariaId) : null);
  };

  const handleBoletoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      setFormData(prev => ({ ...prev, boleto: base64Data }));

      // Se modo IA está ativo, processar o boleto
      if (iaFillMode) {
        setProcessingIA(true);
        try {
          const extractedData = await extractBoletoDataWithIA(base64Data, file.type);
          setFormData(prev => ({
            ...prev,
            ...extractedData,
            boleto: base64Data
          }));
        } catch (error) {
          console.error('Erro ao processar boleto com IA:', error);
          alert('Não foi possível extrair dados automaticamente. Preencha manualmente.');
        } finally {
          setProcessingIA(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Função de extração de dados com IA usando OpenAI GPT-4o
  const extractBoletoDataWithIA = async (base64Data, fileType) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        console.warn('VITE_OPENAI_API_KEY não configurada. Usando dados simulados.');
        // Fallback para simulação se API key não existir
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          descricao: 'Boleto (modo simulação - configure VITE_OPENAI_API_KEY)',
          valor: (Math.random() * 1000 + 100).toFixed(2),
          dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          fornecedor: 'Fornecedor Exemplo',
          categoria: 'Fornecedores',
          observacoes: 'Configure a API key da OpenAI para extração real'
        };
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analise este boleto bancário brasileiro e extraia as seguintes informações em formato JSON puro (sem markdown, sem texto adicional):

{
  "descricao": "descrição do serviço ou produto (ex: Conta de Energia, Aluguel, Fornecedor XYZ)",
  "valor": "valor em reais como string numérica (ex: '1234.56')",
  "dataVencimento": "data de vencimento no formato YYYY-MM-DD",
  "fornecedor": "nome do beneficiário/cedente/empresa",
  "categoria": "categoria apropriada: escolha entre (Aluguel, Salários, Encargos, Fornecedores, Energia, Água, Internet, Telefone, Marketing, Impostos, Manutenção, Seguros, Outros)",
  "observacoes": "informações adicionais relevantes do boleto"
}

IMPORTANTE:
- Retorne APENAS o JSON, sem formatação markdown
- Use vírgula como separador decimal no valor
- Data sempre no formato YYYY-MM-DD
- Se não encontrar algum campo, use valores padrão razoáveis`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Data,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const jsonText = data.choices[0].message.content.trim();
      
      // Remover possíveis marcações de código markdown
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const extractedData = JSON.parse(cleanJson);
      
      // Validar e normalizar dados extraídos
      return {
        descricao: extractedData.descricao || 'Boleto extraído via IA',
        valor: extractedData.valor?.toString() || '0',
        dataVencimento: extractedData.dataVencimento || new Date().toISOString().split('T')[0],
        fornecedor: extractedData.fornecedor || '',
        categoria: extractedData.categoria || 'Outros',
        observacoes: (extractedData.observacoes || '') + '\n\n✓ Extraído automaticamente via IA (GPT-4o)'
      };
      
    } catch (error) {
      console.error('Erro ao processar boleto com OpenAI:', error);
      throw new Error(`Falha na extração: ${error.message}`);
    }
  };

  const handleViewBoleto = (boleto) => {
    setBoletoToView(boleto);
    setShowBoletoViewer(true);
  };

  const resetForm = () => {
    setFormData({
      categoria: '',
      descricao: '',
      valor: '',
      tipo: 'Fixo',
      centroCusto: '',
      dataVencimento: '',
      recorrencia: 'mensal',
      fornecedor: '',
      observacoes: '',
      boleto: null
    });
    setEditingId(null);
    setShowModal(false);
  };

  // ============================================
  // FORMATADORES
  // ============================================
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (despesa) => {
    if (despesa.status === 'pago') {
      return <span className="px-2 py-1 bg-green-400/20 text-green-400 text-xs rounded-full">Pago</span>;
    }
    
    const hoje = new Date();
    const vencimento = new Date(despesa.dataVencimento + 'T00:00:00');
    
    if (vencimento < hoje) {
      return <span className="px-2 py-1 bg-red-400/20 text-red-400 text-xs rounded-full">Vencido</span>;
    }
    
    return <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 text-xs rounded-full">Pendente</span>;
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="p-6 bg-aureon-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-aureon-purple mb-2">Contas a Pagar</h1>
          <p className="text-aureon-text/70">Gerenciamento de despesas e boletos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-[#8B5CF6]/30 transition-all"
        >
          <Plus size={20} />
          Nova Despesa
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-aureon-surface border border-yellow-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Total Pendente</span>
            <AlertCircle size={18} className="text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(stats.totalPendente)}</p>
        </div>

        <div className="bg-aureon-surface border border-green-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Total Pago</span>
            <Check size={18} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalPago)}</p>
        </div>

        <div className="bg-aureon-surface border border-red-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Vencidas</span>
            <X size={18} className="text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">
            {stats.vencidas} ({formatCurrency(stats.totalVencidas)})
          </p>
        </div>

        <div className="bg-aureon-surface border border-orange-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Vence em 7 dias</span>
            <Calendar size={18} className="text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-400">
            {stats.vencendoEm7Dias} ({formatCurrency(stats.totalVencendo7Dias)})
          </p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-aureon-text/50" />
            <input
              type="text"
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-aureon-bg border border-aureon-purple/20 rounded-lg pl-10 pr-4 py-2 text-aureon-text placeholder-aureon-text/30 focus:outline-none focus:border-aureon-purple"
            />
          </div>

          {/* Filtro Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-aureon-bg border border-aureon-purple/20 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
          >
            <option value="todas">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="vencido">Vencido</option>
          </select>

          {/* Filtro Categoria */}
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="bg-aureon-bg border border-aureon-purple/20 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-aureon-bg border border-aureon-purple/20 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
          >
            <option value="vencimento">Ordenar por Vencimento</option>
            <option value="valor">Ordenar por Valor</option>
            <option value="categoria">Ordenar por Categoria</option>
          </select>
        </div>
      </div>

      {/* Tabela de Despesas */}
      <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-aureon-purple/10 border-b border-aureon-purple/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-aureon-purple">Vencimento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-aureon-purple">Categoria</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-aureon-purple">Descrição</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-aureon-purple">Fornecedor</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-aureon-purple">Valor</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-aureon-purple">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-aureon-purple">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B5CF6]/10">
              {despesasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-aureon-text/50">
                    Nenhuma despesa encontrada
                  </td>
                </tr>
              ) : (
                despesasFiltradas.map(despesa => (
                  <tr key={despesa.id} className="hover:bg-aureon-purple/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-aureon-text">{formatDate(despesa.dataVencimento)}</td>
                    <td className="px-4 py-3 text-sm text-aureon-text">
                      <span className="px-2 py-1 bg-aureon-purple/20 rounded text-xs">{despesa.categoria}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-aureon-text">
                      <div className="flex items-center gap-2">
                        {despesa.descricao}
                        {despesa.boleto && (
                          <button
                            onClick={() => handleViewBoleto(despesa.boleto)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Visualizar boleto"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-aureon-text/70">{despesa.fornecedor || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-aureon-text">
                      {formatCurrency(despesa.valor)}
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(despesa)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {despesa.status === 'pendente' && (
                          <button
                            onClick={() => handlePagar(despesa.id)}
                            className="p-2 bg-green-400/10 hover:bg-green-400/20 text-green-400 rounded-lg transition-colors"
                            title="Marcar como pago"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(despesa)}
                          className="p-2 bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(despesa.id)}
                          className="p-2 bg-red-400/10 hover:bg-red-400/20 text-red-400 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-aureon-bg/90 flex items-center justify-center z-50 p-4">
          <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-aureon-purple mb-6">
              {editingId ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categoria */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  >
                    <option value="Fixo">Fixo</option>
                    <option value="Variável">Variável</option>
                    <option value="Pontual">Pontual</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">Descrição *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Valor */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  />
                </div>

                {/* Vencimento */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Data Vencimento *</label>
                  <input
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataVencimento: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Centro de Custo */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Centro de Custo</label>
                  <input
                    type="text"
                    value={formData.centroCusto}
                    onChange={(e) => setFormData(prev => ({ ...prev, centroCusto: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                    placeholder="Geral"
                  />
                </div>

                {/* Recorrência */}
                <div>
                  <label className="block text-sm text-aureon-text/70 mb-2">Recorrência</label>
                  <select
                    value={formData.recorrencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, recorrencia: e.target.value }))}
                    className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                  >
                    <option value="unico">Único</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">Fornecedor</label>
                <input
                  type="text"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm text-aureon-text/70 mb-2">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
                  rows="3"
                />
              </div>

              {/* Upload Boleto */}
              <div className="border-2 border-dashed border-aureon-purple/30 rounded-xl p-4 bg-aureon-purple/5">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-aureon-text font-semibold">
                    Anexar Boleto (PDF/Imagem) *
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={iaFillMode}
                        onChange={(e) => setIaFillMode(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-xs text-aureon-text/70">Preenchimento automático (IA)</span>
                    </label>
                  </div>
                </div>

                {processingIA && (
                  <div className="bg-blue-400/10 border border-blue-400/30 rounded-lg p-3 mb-3 flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
                    <span className="text-sm text-blue-400">Processando boleto com IA...</span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 bg-aureon-purple/10 hover:bg-aureon-purple/20 border border-aureon-purple/30 rounded-lg px-4 py-2 cursor-pointer transition-colors">
                    <Upload size={18} className="text-aureon-purple" />
                    <span className="text-sm text-aureon-text">Escolher arquivo</span>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleBoletoUpload}
                      className="hidden"
                      required={!editingId}
                    />
                  </label>
                  {formData.boleto && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-400">✓ Arquivo anexado</span>
                      <button
                        type="button"
                        onClick={() => handleViewBoleto(formData.boleto)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Visualizar
                      </button>
                    </div>
                  )}
                </div>

                {iaFillMode && (
                  <p className="text-xs text-aureon-text/60 mt-2">
                    💡 A IA irá extrair automaticamente: valor, vencimento, fornecedor e descrição
                  </p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-aureon-bg border border-aureon-purple/30 text-aureon-text px-6 py-3 rounded-lg hover:bg-aureon-purple/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-[#8B5CF6]/30 transition-all"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Boleto */}
      {showBoletoViewer && boletoToView && (
        <div className="fixed inset-0 bg-aureon-bg/90 flex items-center justify-center z-50 p-4">
          <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-aureon-purple">Visualizar Boleto</h2>
              <button
                onClick={() => {
                  setShowBoletoViewer(false);
                  setBoletoToView(null);
                }}
                className="p-2 bg-red-400/10 hover:bg-red-400/20 text-red-400 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-aureon-bg rounded-lg p-4">
              {boletoToView.startsWith('data:application/pdf') ? (
                <iframe
                  src={boletoToView}
                  className="w-full h-full min-h-[600px]"
                  title="Boleto PDF"
                />
              ) : (
                <img
                  src={boletoToView}
                  alt="Boleto"
                  className="max-w-full h-auto mx-auto"
                />
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={boletoToView}
                download="boleto"
                className="flex-1 bg-aureon-purple/10 hover:bg-aureon-purple/20 border border-aureon-purple/30 text-aureon-purple px-4 py-2 rounded-lg transition-colors text-center flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Baixar Boleto
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
