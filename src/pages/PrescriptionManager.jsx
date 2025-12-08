import React, { useState, useEffect } from 'react';
import { usePrescription } from '../context/PrescriptionContext';
import { DataContext } from '../context/DataContext';
import { 
  Eye, 
  FileText, 
  Plus, 
  Upload, 
  Download,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
  User,
  FileCheck,
  Search,
  Filter
} from 'lucide-react';

/**
 * PRESCRIPTION MANAGER
 * Gerenciamento completo de receitas médicas oftalmológicas
 */
export default function PrescriptionManager() {
  const {
    prescriptions,
    stats,
    createPrescription,
    updatePrescription,
    deletePrescription,
    attachToOrder,
    uploadAttachment,
    getPrescriptionsByCliente,
    getAttachments,
    checkExpiredPrescriptions
  } = usePrescription();

  const { clientes = [] } = React.useContext(DataContext);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [prescriptionSelecionada, setPrescriptionSelecionada] = useState(null);
  const [filtro, setFiltro] = useState('todas'); // todas, ativas, expiradas
  const [busca, setBusca] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Formulário de nova receita
  const [form, setForm] = useState({
    cliente_id: '',
    cliente_nome: '',
    od: { esferico: 0, cilindrico: 0, eixo: 0, dnp: 0, adicao: 0 },
    oe: { esferico: 0, cilindrico: 0, eixo: 0, dnp: 0, adicao: 0 },
    medico_nome: '',
    medico_crm: '',
    medico_uf: '',
    tipo_lente: 'Monofocal',
    data_emissao: new Date().toISOString().split('T')[0],
    data_validade: '',
    observacoes: '',
    lgpd_consentimento: false
  });

  // Verificar receitas expiradas ao carregar
  useEffect(() => {
    checkExpiredPrescriptions();
  }, []);

  // Filtrar receitas
  const prescriptionsFiltradas = prescriptions.filter(p => {
    // Filtro por status
    if (filtro === 'ativas' && (p.status !== 'ativa' || isExpired(p))) return false;
    if (filtro === 'expiradas' && p.status !== 'expirada' && !isExpired(p)) return false;
    
    // Busca por nome do cliente
    if (busca && !p.cliente_nome.toLowerCase().includes(busca.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Verificar se receita está expirada
  const isExpired = (prescription) => {
    const validade = new Date(prescription.data_validade);
    const hoje = new Date();
    return validade < hoje;
  };

  // Calcular dias até expirar
  const diasAteExpirar = (prescription) => {
    const validade = new Date(prescription.data_validade);
    const hoje = new Date();
    const diff = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Handler: Criar receita
  const handleCreate = () => {
    if (!form.cliente_id) {
      alert('Selecione um cliente');
      return;
    }

    if (!form.lgpd_consentimento) {
      alert('É necessário o consentimento do cliente (LGPD) para armazenar dados da receita');
      return;
    }

    const result = createPrescription(form);
    
    if (result.success) {
      alert('✅ Receita criada com sucesso!');
      setModalAberto(false);
      resetForm();
    } else {
      alert(`❌ Erro: ${result.error}`);
    }
  };

  // Handler: Selecionar cliente
  const handleSelectCliente = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setForm({
        ...form,
        cliente_id: cliente.id,
        cliente_nome: cliente.nome
      });
    }
  };

  // Handler: Upload de anexo
  const handleFileUpload = (e, prescriptionId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);

    // Converter para base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: event.target.result
      };

      const result = uploadAttachment(prescriptionId, fileData);
      
      if (result.success) {
        alert('✅ Anexo adicionado com sucesso!');
      } else {
        alert(`❌ Erro: ${result.error}`);
      }
      
      setUploadingFile(false);
    };

    reader.onerror = () => {
      alert('❌ Erro ao ler arquivo');
      setUploadingFile(false);
    };

    reader.readAsDataURL(file);
  };

  // Resetar formulário
  const resetForm = () => {
    setForm({
      cliente_id: '',
      cliente_nome: '',
      od: { esferico: 0, cilindrico: 0, eixo: 0, dnp: 0, adicao: 0 },
      oe: { esferico: 0, cilindrico: 0, eixo: 0, dnp: 0, adicao: 0 },
      medico_nome: '',
      medico_crm: '',
      medico_uf: '',
      tipo_lente: 'Monofocal',
      data_emissao: new Date().toISOString().split('T')[0],
      data_validade: '',
      observacoes: '',
      lgpd_consentimento: false
    });
  };

  return (
    <div className="p-6 bg-aureon-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif text-aureon-gold flex items-center gap-3">
            <Eye size={32} />
            Receitas Médicas
          </h1>
          <p className="text-aureon-text/70 mt-1">
            Gerenciamento de prescrições oftalmológicas
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-6 py-3 bg-aureon-gold text-black font-bold rounded-lg hover:bg-aureon-gold/80 transition-colors"
        >
          <Plus size={20} />
          Nova Receita
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-aureon-surface p-4 rounded-lg border border-aureon-gold/20">
          <p className="text-aureon-text/70 text-sm">Total</p>
          <p className="text-2xl font-bold text-aureon-gold">{stats.total || 0}</p>
        </div>
        <div className="bg-aureon-surface p-4 rounded-lg border border-green-400/20">
          <p className="text-aureon-text/70 text-sm">Ativas</p>
          <p className="text-2xl font-bold text-green-400">{stats.ativas || 0}</p>
        </div>
        <div className="bg-aureon-surface p-4 rounded-lg border border-red-400/20">
          <p className="text-aureon-text/70 text-sm">Expiradas</p>
          <p className="text-2xl font-bold text-red-400">{stats.expiradas || 0}</p>
        </div>
        <div className="bg-aureon-surface p-4 rounded-lg border border-blue-400/20">
          <p className="text-aureon-text/70 text-sm">Com Anexos</p>
          <p className="text-2xl font-bold text-blue-400">{stats.com_anexos || 0}</p>
        </div>
        <div className="bg-aureon-surface p-4 rounded-lg border border-yellow-400/20">
          <p className="text-aureon-text/70 text-sm">Expirando (30d)</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.expirando_30_dias || 0}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-aureon-surface p-4 rounded-lg border border-aureon-gold/20 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtro Status */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-aureon-text/70" />
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
            >
              <option value="todas">Todas</option>
              <option value="ativas">Ativas</option>
              <option value="expiradas">Expiradas</option>
            </select>
          </div>

          {/* Busca */}
          <div className="flex-1 flex items-center gap-2">
            <Search size={18} className="text-aureon-text/70" />
            <input
              type="text"
              placeholder="Buscar por nome do cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
            />
          </div>
        </div>
      </div>

      {/* Lista de Receitas */}
      <div className="grid grid-cols-1 gap-4">
        {prescriptionsFiltradas.length === 0 ? (
          <div className="bg-aureon-surface p-12 rounded-lg border border-aureon-gold/20 text-center">
            <FileText size={48} className="mx-auto mb-4 text-aureon-text/30" />
            <p className="text-aureon-text/70">Nenhuma receita encontrada</p>
          </div>
        ) : (
          prescriptionsFiltradas.map((prescription) => {
            const expired = isExpired(prescription);
            const dias = diasAteExpirar(prescription);
            const alertaExpiracao = dias > 0 && dias <= 30;

            return (
              <div
                key={prescription.id}
                className={`bg-aureon-surface p-6 rounded-lg border ${
                  expired
                    ? 'border-red-400/30'
                    : alertaExpiracao
                    ? 'border-yellow-400/30'
                    : 'border-aureon-gold/20'
                } hover:border-aureon-gold/50 transition-colors cursor-pointer`}
                onClick={() => {
                  setPrescriptionSelecionada(prescription);
                  setModalDetalhes(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Cliente */}
                    <div className="flex items-center gap-2 mb-2">
                      <User size={18} className="text-aureon-gold" />
                      <h3 className="text-xl font-semibold text-aureon-text">
                        {prescription.cliente_nome}
                      </h3>
                    </div>

                    {/* Médico */}
                    <p className="text-aureon-text/70 mb-2">
                      Dr(a). {prescription.medico_nome} - CRM: {prescription.medico_crm}
                    </p>

                    {/* Datas */}
                    <div className="flex items-center gap-4 text-sm text-aureon-text/60">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        Emissão: {new Date(prescription.data_emissao).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        Validade: {new Date(prescription.data_validade).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {/* Tipo de lente */}
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        {prescription.tipo_lente}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-end gap-2">
                    {expired ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded">
                        <AlertCircle size={16} />
                        Expirada
                      </div>
                    ) : alertaExpiracao ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                        <AlertCircle size={16} />
                        Expira em {dias} dias
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded">
                        <CheckCircle size={16} />
                        Ativa
                      </div>
                    )}

                    {prescription.anexos.length > 0 && (
                      <div className="flex items-center gap-1 text-aureon-text/70 text-sm">
                        <FileCheck size={14} />
                        {prescription.anexos.length} anexo(s)
                      </div>
                    )}

                    {prescription.pedidos_associados.length > 0 && (
                      <div className="text-aureon-text/70 text-sm">
                        {prescription.pedidos_associados.length} pedido(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Nova Receita */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-aureon-surface rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-aureon-gold/20">
              <h2 className="text-2xl font-serif text-aureon-gold">Nova Receita Médica</h2>
              <button
                onClick={() => {
                  setModalAberto(false);
                  resetForm();
                }}
                className="text-aureon-text/70 hover:text-aureon-text"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div>
                <label className="block text-aureon-text mb-2">
                  Cliente *
                </label>
                <select
                  value={form.cliente_id}
                  onChange={(e) => handleSelectCliente(e.target.value)}
                  className="w-full bg-aureon-bg text-aureon-text px-4 py-2 rounded border border-aureon-gold/20"
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Olho Direito (OD) */}
              <div className="border border-aureon-gold/20 p-4 rounded">
                <h3 className="text-aureon-gold font-semibold mb-3">👁️ Olho Direito (OD)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">Esférico</label>
                    <input
                      type="number"
                      step="0.25"
                      value={form.od.esferico}
                      onChange={(e) => setForm({ ...form, od: { ...form.od, esferico: parseFloat(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">Cilíndrico</label>
                    <input
                      type="number"
                      step="0.25"
                      value={form.od.cilindrico}
                      onChange={(e) => setForm({ ...form, od: { ...form.od, cilindrico: parseFloat(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">Eixo (°)</label>
                    <input
                      type="number"
                      value={form.od.eixo}
                      onChange={(e) => setForm({ ...form, od: { ...form.od, eixo: parseInt(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">DNP (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.od.dnp}
                      onChange={(e) => setForm({ ...form, od: { ...form.od, dnp: parseFloat(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">Adição</label>
                    <input
                      type="number"
                      step="0.25"
                      value={form.od.adicao}
                      onChange={(e) => setForm({ ...form, od: { ...form.od, adicao: parseFloat(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                </div>
              </div>

              {/* Olho Esquerdo (OE) */}
              <div className="border border-aureon-gold/20 p-4 rounded">
                <h3 className="text-aureon-gold font-semibold mb-3">👁️ Olho Esquerdo (OE)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">Esférico</label>
                    <input
                      type="number"
                      step="0.25"
                      value={form.oe.esferico}
                      onChange={(e) => setForm({ ...form, oe: { ...form.oe, esferico: parseFloat(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">Cilíndrico</label>
                    <input
                      type="number"
                      step="0.25"
                      value={form.oe.cilindrico}
                      onChange={(e) => setForm({ ...form, oe: { ...form.oe, cilindrico: parseFloat(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">Eixo (°)</label>
                    <input
                      type="number"
                      value={form.oe.eixo}
                      onChange={(e) => setForm({ ...form, oe: { ...form.oe, eixo: parseInt(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">DNP (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.oe.dnp}
                      onChange={(e) => setForm({ ...form, oe: { ...form.oe, dnp: parseFloat(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                  <div>
                    <label className="block text-aureon-text/70 text-sm mb-1">Adição</label>
                    <input
                      type="number"
                      step="0.25"
                      value={form.oe.adicao}
                      onChange={(e) => setForm({ ...form, oe: { ...form.oe, adicao: parseFloat(e.target.value) } })}
                      className="w-full bg-aureon-bg text-aureon-text px-3 py-2 rounded border border-aureon-gold/20"
                    />
                  </div>
                </div>
              </div>

              {/* Médico */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-aureon-text mb-2">Nome do Médico *</label>
                  <input
                    type="text"
                    value={form.medico_nome}
                    onChange={(e) => setForm({ ...form, medico_nome: e.target.value })}
                    className="w-full bg-aureon-bg text-aureon-text px-4 py-2 rounded border border-aureon-gold/20"
                  />
                </div>
                <div>
                  <label className="block text-aureon-text mb-2">CRM *</label>
                  <input
                    type="text"
                    value={form.medico_crm}
                    onChange={(e) => setForm({ ...form, medico_crm: e.target.value })}
                    className="w-full bg-aureon-bg text-aureon-text px-4 py-2 rounded border border-aureon-gold/20"
                  />
                </div>
                <div>
                  <label className="block text-aureon-text mb-2">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={form.medico_uf}
                    onChange={(e) => setForm({ ...form, medico_uf: e.target.value.toUpperCase() })}
                    className="w-full bg-aureon-bg text-aureon-text px-4 py-2 rounded border border-aureon-gold/20"
                  />
                </div>
              </div>

              {/* Tipo de Lente e Datas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-aureon-text mb-2">Tipo de Lente</label>
                  <select
                    value={form.tipo_lente}
                    onChange={(e) => setForm({ ...form, tipo_lente: e.target.value })}
                    className="w-full bg-aureon-bg text-aureon-text px-4 py-2 rounded border border-aureon-gold/20"
                  >
                    <option value="Monofocal">Monofocal</option>
                    <option value="Bifocal">Bifocal</option>
                    <option value="Multifocal">Multifocal</option>
                    <option value="Progressiva">Progressiva</option>
                  </select>
                </div>
                <div>
                  <label className="block text-aureon-text mb-2">Data de Emissão</label>
                  <input
                    type="date"
                    value={form.data_emissao}
                    onChange={(e) => setForm({ ...form, data_emissao: e.target.value })}
                    className="w-full bg-aureon-bg text-aureon-text px-4 py-2 rounded border border-aureon-gold/20"
                  />
                </div>
                <div>
                  <label className="block text-aureon-text mb-2">Data de Validade</label>
                  <input
                    type="date"
                    value={form.data_validade}
                    onChange={(e) => setForm({ ...form, data_validade: e.target.value })}
                    className="w-full bg-aureon-bg text-aureon-text px-4 py-2 rounded border border-aureon-gold/20"
                  />
                  <p className="text-xs text-aureon-text/50 mt-1">
                    Deixe vazio para 180 dias automático
                  </p>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-aureon-text mb-2">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  className="w-full bg-aureon-bg text-aureon-text px-4 py-2 rounded border border-aureon-gold/20"
                  placeholder="Informações adicionais sobre a receita..."
                />
              </div>

              {/* Consentimento LGPD */}
              <div className="bg-blue-500/10 border border-blue-400/30 p-4 rounded">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.lgpd_consentimento}
                    onChange={(e) => setForm({ ...form, lgpd_consentimento: e.target.checked })}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-aureon-text font-semibold mb-1">
                      Consentimento LGPD *
                    </p>
                    <p className="text-aureon-text/70 text-sm">
                      Declaro que o cliente autorizou o armazenamento de seus dados médicos
                      (receita oftalmológica) conforme Lei Geral de Proteção de Dados (LGPD).
                      Os dados serão usados exclusivamente para processamento de pedidos e
                      armazenados de forma segura e criptografada.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-aureon-gold/20">
              <button
                onClick={() => {
                  setModalAberto(false);
                  resetForm();
                }}
                className="px-6 py-2 text-aureon-text hover:text-aureon-gold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-aureon-gold text-black font-bold rounded hover:bg-aureon-gold/80 transition-colors"
              >
                Criar Receita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes */}
      {modalDetalhes && prescriptionSelecionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-aureon-surface rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-aureon-gold/20">
              <h2 className="text-2xl font-serif text-aureon-gold">Detalhes da Receita</h2>
              <button
                onClick={() => {
                  setModalDetalhes(false);
                  setPrescriptionSelecionada(null);
                }}
                className="text-aureon-text/70 hover:text-aureon-text"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Cliente e Médico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-aureon-gold font-semibold mb-2">Cliente</h3>
                  <p className="text-aureon-text">{prescriptionSelecionada.cliente_nome}</p>
                </div>
                <div>
                  <h3 className="text-aureon-gold font-semibold mb-2">Médico</h3>
                  <p className="text-aureon-text">
                    Dr(a). {prescriptionSelecionada.medico_nome}
                  </p>
                  <p className="text-aureon-text/70 text-sm">
                    CRM: {prescriptionSelecionada.medico_crm}
                  </p>
                </div>
              </div>

              {/* Grau dos Olhos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-aureon-gold/20 p-4 rounded">
                  <h3 className="text-aureon-gold font-semibold mb-3">👁️ Olho Direito (OD)</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-aureon-text/70">Esférico:</span>
                      <span className="text-aureon-text font-medium">
                        {prescriptionSelecionada.od.esferico > 0 ? '+' : ''}
                        {prescriptionSelecionada.od.esferico}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-aureon-text/70">Cilíndrico:</span>
                      <span className="text-aureon-text font-medium">
                        {prescriptionSelecionada.od.cilindrico}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-aureon-text/70">Eixo:</span>
                      <span className="text-aureon-text font-medium">
                        {prescriptionSelecionada.od.eixo}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-aureon-text/70">DNP:</span>
                      <span className="text-aureon-text font-medium">
                        {prescriptionSelecionada.od.dnp}mm
                      </span>
                    </div>
                    {prescriptionSelecionada.od.adicao > 0 && (
                      <div className="flex justify-between">
                        <span className="text-aureon-text/70">Adição:</span>
                        <span className="text-aureon-text font-medium">
                          +{prescriptionSelecionada.od.adicao}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-aureon-gold/20 p-4 rounded">
                  <h3 className="text-aureon-gold font-semibold mb-3">👁️ Olho Esquerdo (OE)</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-aureon-text/70">Esférico:</span>
                      <span className="text-aureon-text font-medium">
                        {prescriptionSelecionada.oe.esferico > 0 ? '+' : ''}
                        {prescriptionSelecionada.oe.esferico}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-aureon-text/70">Cilíndrico:</span>
                      <span className="text-aureon-text font-medium">
                        {prescriptionSelecionada.oe.cilindrico}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-aureon-text/70">Eixo:</span>
                      <span className="text-aureon-text font-medium">
                        {prescriptionSelecionada.oe.eixo}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-aureon-text/70">DNP:</span>
                      <span className="text-aureon-text font-medium">
                        {prescriptionSelecionada.oe.dnp}mm
                      </span>
                    </div>
                    {prescriptionSelecionada.oe.adicao > 0 && (
                      <div className="flex justify-between">
                        <span className="text-aureon-text/70">Adição:</span>
                        <span className="text-aureon-text font-medium">
                          +{prescriptionSelecionada.oe.adicao}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-aureon-text/70">Tipo de Lente:</span>
                  <span className="text-aureon-text font-medium">
                    {prescriptionSelecionada.tipo_lente}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aureon-text/70">Data de Emissão:</span>
                  <span className="text-aureon-text font-medium">
                    {new Date(prescriptionSelecionada.data_emissao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aureon-text/70">Validade:</span>
                  <span className={`font-medium ${
                    isExpired(prescriptionSelecionada) ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {new Date(prescriptionSelecionada.data_validade).toLocaleDateString('pt-BR')}
                    {isExpired(prescriptionSelecionada) 
                      ? ' (Expirada)' 
                      : ` (${diasAteExpirar(prescriptionSelecionada)} dias restantes)`
                    }
                  </span>
                </div>
              </div>

              {/* Observações */}
              {prescriptionSelecionada.observacoes && (
                <div>
                  <h3 className="text-aureon-gold font-semibold mb-2">Observações</h3>
                  <p className="text-aureon-text/70 text-sm">
                    {prescriptionSelecionada.observacoes}
                  </p>
                </div>
              )}

              {/* Anexos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-aureon-gold font-semibold">Anexos</h3>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded cursor-pointer hover:bg-blue-500/30 transition-colors">
                    <Upload size={16} />
                    Adicionar Anexo
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, prescriptionSelecionada.id)}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                  </label>
                </div>
                
                {prescriptionSelecionada.anexos.length === 0 ? (
                  <p className="text-aureon-text/50 text-sm">Nenhum anexo</p>
                ) : (
                  <div className="space-y-2">
                    {getAttachments(prescriptionSelecionada.id).map((anexo) => (
                      <div
                        key={anexo.id}
                        className="flex items-center justify-between p-3 bg-aureon-bg rounded border border-aureon-gold/20"
                      >
                        <div className="flex items-center gap-2">
                          <FileCheck size={16} className="text-aureon-gold" />
                          <span className="text-aureon-text text-sm">{anexo.filename}</span>
                          <span className="text-aureon-text/50 text-xs">
                            ({(anexo.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            // Download anexo (base64)
                            const link = document.createElement('a');
                            link.href = anexo.data;
                            link.download = anexo.filename;
                            link.click();
                          }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pedidos Associados */}
              {prescriptionSelecionada.pedidos_associados.length > 0 && (
                <div>
                  <h3 className="text-aureon-gold font-semibold mb-2">Pedidos Associados</h3>
                  <div className="space-y-2">
                    {prescriptionSelecionada.pedidos_associados.map((orderId) => (
                      <div
                        key={orderId}
                        className="p-3 bg-aureon-bg rounded border border-aureon-gold/20 text-aureon-text text-sm"
                      >
                        Pedido #{orderId}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-aureon-gold/20">
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja cancelar esta receita?')) {
                    deletePrescription(prescriptionSelecionada.id);
                    setModalDetalhes(false);
                    setPrescriptionSelecionada(null);
                  }
                }}
                className="px-6 py-2 text-red-400 hover:text-red-300 transition-colors"
              >
                Cancelar Receita
              </button>
              <button
                onClick={() => {
                  setModalDetalhes(false);
                  setPrescriptionSelecionada(null);
                }}
                className="px-6 py-2 bg-aureon-gold text-black font-bold rounded hover:bg-aureon-gold/80 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
