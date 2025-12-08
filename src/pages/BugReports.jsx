import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import ApiService from '../services/ApiService';

const BugReports = () => {
  const [bugReports, setBugReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    priority: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState(null);

  useEffect(() => {
    fetchBugReports();
    fetchStats();
  }, [filters]);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.priority) params.append('priority', filters.priority);

      const response = await ApiService.get(`/api/it/bug-reports?${params.toString()}`);
      setBugReports(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erro ao carregar bugs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ApiService.get('/api/it/bug-reports/stats');
      setStats(response.stats);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const handleViewDetails = async (bugId) => {
    try {
      const response = await ApiService.get(`/api/it/bug-reports/${bugId}`);
      setSelectedBug(response.bugReport);
      setShowModal(true);
    } catch (err) {
      alert(err.message || 'Erro ao carregar detalhes');
    }
  };

  const handleUpdateStatus = async (bugId, newStatus) => {
    try {
      await ApiService.patch(`/api/it/bug-reports/${bugId}`, { status: newStatus });
      fetchBugReports();
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  const handleResolve = async (bugId) => {
    const resolutionNotes = prompt('Descreva a solução (mínimo 10 caracteres):');
    if (!resolutionNotes || resolutionNotes.length < 10) {
      alert('Notas de resolução inválidas');
      return;
    }

    try {
      await ApiService.post(`/api/it/bug-reports/${bugId}/resolve`, { resolution_notes: resolutionNotes });
      fetchBugReports();
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Erro ao resolver bug');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-green-100 text-green-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      wont_fix: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Aberto',
      in_progress: 'Em Progresso',
      resolved: 'Resolvido',
      closed: 'Fechado',
      wont_fix: 'Não Será Corrigido'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Bug Reports</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Abertos</p>
              <p className="text-3xl font-bold text-blue-600">{stats.byStatus.open || 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Em Progresso</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.byStatus.in_progress || 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Críticos</p>
              <p className="text-3xl font-bold text-red-600">{stats.bySeverity.critical || 0}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="open">Aberto</option>
              <option value="in_progress">Em Progresso</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
              <option value="wont_fix">Não Será Corrigido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severidade
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Todas</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridade
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Todas</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bug Reports Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reportado Por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bugReports.map((bug) => (
                <tr key={bug.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{bug.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-md">
                      {bug.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(bug.severity)}`}>
                      {bug.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(bug.priority)}`}>
                      {bug.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bug.status)}`}>
                      {getStatusLabel(bug.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bug.reporter?.username || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bug.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(bug.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bugReports.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum bug report encontrado</p>
            </div>
          )}
        </div>
      </Card>

      {/* Details Modal */}
      {showModal && selectedBug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedBug.title}</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Severidade</p>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(selectedBug.severity)}`}>
                  {selectedBug.severity}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prioridade</p>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedBug.priority)}`}>
                  {selectedBug.priority}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedBug.status)}`}>
                  {getStatusLabel(selectedBug.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reportado Por</p>
                <p className="font-medium">{selectedBug.reporter?.username}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-gray-700">{selectedBug.description}</p>
              </div>

              {selectedBug.error_message && (
                <div>
                  <h3 className="font-semibold mb-2">Mensagem de Erro</h3>
                  <p className="text-red-600 text-sm font-mono bg-red-50 p-3 rounded">
                    {selectedBug.error_message}
                  </p>
                </div>
              )}

              {selectedBug.error_stack && (
                <div>
                  <h3 className="font-semibold mb-2">Stack Trace</h3>
                  <pre className="text-xs font-mono bg-gray-50 p-3 rounded overflow-x-auto">
                    {selectedBug.error_stack}
                  </pre>
                </div>
              )}

              {selectedBug.resolution_notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notas de Resolução</h3>
                  <p className="text-gray-700 bg-green-50 p-3 rounded">
                    {selectedBug.resolution_notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              {selectedBug.status !== 'resolved' && selectedBug.status !== 'closed' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedBug.id, 'in_progress')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Marcar Em Progresso
                  </button>
                  <button
                    onClick={() => handleResolve(selectedBug.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Resolver
                  </button>
                </>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugReports;
