import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Search, Filter, Download, Eye, AlertTriangle, User, DollarSign, Settings as SettingsIcon, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContextAPI';
import { formatCurrency } from '../utils/productUtils';

/**
 * AUDIT LOG - Rastreabilidade de Alterações (CEO Only)
 * Monitora mudanças críticas: preços, fornecedores, configurações
 */
export default function AuditLog() {
  const { getAuditLog, checkPermission, currentUser, resolveUserName, users } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterUser, setFilterUser] = useState('ALL');
  const [dateRange, setDateRange] = useState('7days');

  // ✅ Verificar permissão CEO
  if (!checkPermission('auditLog', 'read')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-aureon-bg via-aureon-surface to-aureon-bg text-aureon-text p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={64} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Acesso Negado</h2>
          <p className="text-aureon-text/70">Apenas usuários com perfil CEO podem acessar o Audit Log.</p>
        </div>
      </div>
    );
  }

  // Buscar logs
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const filters = {};
        
        // Filtro por data
        if (dateRange !== 'all') {
          const days = parseInt(dateRange.replace('days', ''));
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          filters.startDate = startDate.toISOString();
        }
        
        // Filtro por ação
        if (filterAction !== 'ALL') {
          filters.action = filterAction;
        }
        
        // Filtro por usuário
        if (filterUser !== 'ALL') {
          filters.userId = parseInt(filterUser);
        }
        
        const result = await getAuditLog(filters);
        setAllLogs(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error('Erro ao buscar audit log:', error);
        setAllLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filterAction, filterUser, dateRange, getAuditLog]);

  // Filtrar por search
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return allLogs;
    
    const term = searchTerm.toLowerCase();
    return allLogs.filter(log =>
      log.username?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.tableName?.toLowerCase().includes(term)
    );
  }, [allLogs, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: allLogs.length,
      priceChanges: allLogs.filter(l => l.action === 'PRICE_CHANGE').length,
      configChanges: allLogs.filter(l => l.action === 'CONFIG_CHANGE').length,
      userActions: allLogs.filter(l => l.action.includes('USER')).length
    };
  }, [allLogs]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'PRICE_CHANGE': return <DollarSign size={16} className="text-yellow-400" />;
      case 'CONFIG_CHANGE': return <SettingsIcon size={16} className="text-blue-400" />;
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
      case 'USER_CREATE':
      case 'USER_UPDATE':
      case 'USER_DELETE':
        return <User size={16} className="text-green-400" />;
      default: return <Eye size={16} className="text-aureon-muted" />;
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      'PRICE_CHANGE': 'Mudança de Preço',
      'SUPPLIER_CHANGE': 'Mudança de Fornecedor',
      'CONFIG_CHANGE': 'Configuração Alterada',
      'USER_LOGIN': 'Login',
      'USER_LOGOUT': 'Logout',
      'USER_CREATE': 'Usuário Criado',
      'USER_UPDATE': 'Usuário Atualizado',
      'USER_DELETE': 'Usuário Deletado',
      'ROLE_CHANGE': 'Mudança de Perfil',
      'PERMISSION_CHANGE': 'Permissão Alterada'
    };
    return labels[action] || action;
  };

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return 'text-red-400 bg-red-400/10 border-red-400/30';
    if (action.includes('CREATE')) return 'text-green-400 bg-green-400/10 border-green-400/30';
    if (action.includes('CHANGE') || action.includes('UPDATE')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Usuário', 'Ação', 'Tabela', 'Registro ID', 'Valor Antigo', 'Valor Novo'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('pt-BR'),
      log.username,
      getActionLabel(log.action),
      log.tableName,
      log.recordId,
      log.oldValue || '-',
      log.newValue || '-'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg via-aureon-surface to-aureon-bg text-aureon-text p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-serif text-aureon-gold mb-2 flex items-center gap-3">
                <Shield size={36} />
                Audit Log
              </h1>
              <p className="text-aureon-text/70">Rastreabilidade completa de alterações críticas</p>
            </div>
            <button
              onClick={exportToCSV}
              className="btn-aureon-primary flex items-center gap-2"
            >
              <Download size={20} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Total de Eventos</span>
              <Eye size={20} className="text-aureon-gold" />
            </div>
            <p className="text-3xl font-bold text-aureon-gold">{stats.total}</p>
          </div>

          <div className="bg-aureon-surface border border-yellow-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Mudanças de Preço</span>
              <DollarSign size={20} className="text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.priceChanges}</p>
          </div>

          <div className="bg-aureon-surface border border-blue-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Configurações</span>
              <SettingsIcon size={20} className="text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.configChanges}</p>
          </div>

          <div className="bg-aureon-surface border border-green-400/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-aureon-text/70">Ações de Usuário</span>
              <User size={20} className="text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.userActions}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-aureon-gold/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-aureon-bg border border-aureon-gold/30 rounded-lg pl-10 pr-4 py-3 text-aureon-text placeholder-aureon-text/30 focus:outline-none focus:border-aureon-gold"
              />
            </div>

            {/* Filter Action */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-aureon-bg border border-aureon-gold/30 rounded-lg px-4 py-3 text-aureon-text focus:outline-none focus:border-aureon-gold"
            >
              <option value="ALL">Todas as Ações</option>
              <option value="PRICE_CHANGE">Mudança de Preço</option>
              <option value="CONFIG_CHANGE">Configurações</option>
              <option value="USER_LOGIN">Logins</option>
              <option value="USER_CREATE">Criação de Usuários</option>
            </select>

            {/* Filter Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-aureon-bg border border-aureon-gold/30 rounded-lg px-4 py-3 text-aureon-text focus:outline-none focus:border-aureon-gold"
            >
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
              <option value="all">Todos os períodos</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setFilterAction('ALL');
                setFilterUser('ALL');
                setDateRange('7days');
              }}
              className="bg-aureon-gold/20 border border-aureon-gold/30 rounded-lg px-4 py-3 text-aureon-gold hover:bg-aureon-gold/30 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-aureon-gold mb-6">
            Histórico de Eventos ({filteredLogs.length})
          </h2>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Eye size={64} className="mx-auto text-aureon-text/30 mb-4" />
              <p className="text-aureon-text/70">Nenhum evento encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                let oldValue, newValue;
                try {
                  oldValue = log.oldValue ? JSON.parse(log.oldValue) : null;
                  newValue = log.newValue ? JSON.parse(log.newValue) : null;
                } catch {
                  oldValue = log.oldValue;
                  newValue = log.newValue;
                }

                // ✅ MELHORIA: Formatar valores legíveis
                const formatValue = (value) => {
                  if (!value || typeof value !== 'object') return value;
                  
                  // Se é preço/valor monetário
                  if (value.precoVenda !== undefined) return formatCurrency(value.precoVenda);
                  if (value.precoCusto !== undefined) return formatCurrency(value.precoCusto);
                  if (value.precoImportacao !== undefined) return formatCurrency(value.precoImportacao);
                  
                  // Se é ID de fornecedor, tentar resolver nome (futura implementação)
                  if (value.fornecedorId !== undefined) return `Fornecedor ID: ${value.fornecedorId}`;
                  
                  // Se é role, traduzir
                  if (value.role !== undefined) return value.role;
                  
                  // Fallback: retornar primeiro valor encontrado
                  const firstKey = Object.keys(value)[0];
                  return `${firstKey}: ${value[firstKey]}`;
                };

                return (
                  <div
                    key={log.id}
                    className="bg-aureon-bg border border-aureon-gold/20 rounded-lg p-4 hover:border-aureon-gold/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Icon */}
                        <div className="mt-1">
                          {getActionIcon(log.action)}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getActionColor(log.action)}`}>
                              {getActionLabel(log.action)}
                            </span>
                            <span className="text-xs text-aureon-text/50">
                              {log.tableName}
                            </span>
                            {log.recordId && (
                              <span className="text-xs text-aureon-text/30">
                                ID: {log.recordId}
                              </span>
                            )}
                          </div>

                          {/* ✅ NOVA EXIBIÇÃO: Legível para humanos */}
                          {(oldValue || newValue) && (
                            <div className="flex items-center gap-3 text-sm bg-aureon-surface p-3 rounded-lg border border-aureon-gold/10">
                              {oldValue && (
                                <div className="flex items-center gap-2">
                                  <span className="text-aureon-text/50 text-xs">De:</span>
                                  <span className="text-red-400 font-semibold">
                                    {formatValue(oldValue)}
                                  </span>
                                </div>
                              )}
                              {oldValue && newValue && (
                                <ArrowRight size={16} className="text-aureon-gold" />
                              )}
                              {newValue && (
                                <div className="flex items-center gap-2">
                                  <span className="text-aureon-text/50 text-xs">Para:</span>
                                  <span className="text-green-400 font-semibold">
                                    {formatValue(newValue)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Descrição (se houver) */}
                          {log.description && (
                            <p className="text-xs text-aureon-text/70 mt-2 italic">
                              {log.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="text-right text-xs text-aureon-text/50">
                        <div className="flex items-center gap-2 mb-1">
                          <User size={14} />
                          <span className="font-semibold">
                            {resolveUserName(log.userId) || log.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

