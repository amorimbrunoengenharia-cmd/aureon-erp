import React, { useState, useEffect, useMemo } from 'react';
import eventBus from '../services/EventBus';
import { Activity, AlertTriangle, Clock, Database, Play, RefreshCw, Trash2, Filter, Search, Download } from 'lucide-react';

/**
 * EVENT LOG VIEWER
 * Componente de auditoria e monitoramento do sistema de eventos
 * Permite visualizar event log, DLQ, estatísticas e reprocessar eventos falhados
 */
export default function EventLogViewer() {
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // all | sales | finance | inventory | purchase | system
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('stats'); // stats | log | dlq
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Carregar estatísticas do EventBus
  const loadStats = () => {
    const statistics = eventBus.getStats();
    setStats(statistics);
  };

  useEffect(() => {
    loadStats();
    
    // Atualizar estatísticas a cada 5 segundos
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar eventos por domínio
  const filteredEvents = useMemo(() => {
    if (!stats?.eventLog) return [];
    
    let events = [...stats.eventLog];
    
    // Filtro por domínio
    if (filter !== 'all') {
      events = events.filter(e => e.type.startsWith(filter + '.'));
    }
    
    // Filtro por busca
    if (searchTerm) {
      events = events.filter(e => 
        e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(e.payload).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return events.reverse(); // Mais recentes primeiro
  }, [stats, filter, searchTerm]);

  // Replay de evento do DLQ
  const handleReplayEvent = (event) => {
    try {
      eventBus.emit(event.type, event.payload, { ...event.metadata, replayed: true });
      alert('✅ Evento reenviado com sucesso!');
      loadStats();
    } catch (error) {
      alert(`❌ Erro ao reenviar evento: ${error.message}`);
    }
  };

  // Limpar DLQ
  const handleClearDLQ = () => {
    if (confirm('⚠️ Deseja limpar todos os eventos falhados? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('aureon_event_dlq');
      loadStats();
      alert('✅ DLQ limpa com sucesso!');
    }
  };

  // Exportar event log
  const handleExportLog = () => {
    const data = JSON.stringify(stats?.eventLog || [], null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-log-${new Date().toISOString()}.json`;
    a.click();
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface text-aureon-text p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-aureon-gold mx-auto mb-4" size={48} />
          <p className="text-lg">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-aureon-bg to-aureon-surface text-aureon-text p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-serif font-bold text-aureon-gold mb-2 flex items-center gap-3">
            <Activity size={36} />
            Event Log Viewer
          </h1>
          <p className="text-aureon-text/70">Auditoria e monitoramento do sistema de eventos</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-aureon-surface p-1 rounded-lg border border-aureon-gold/20">
          <button
            onClick={() => setView('stats')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              view === 'stats' ? 'bg-aureon-gold text-aureon-bg' : 'text-aureon-text hover:bg-aureon-gold/10'
            }`}
          >
            <Database size={16} />
            Estatísticas
          </button>
          <button
            onClick={() => setView('log')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              view === 'log' ? 'bg-aureon-gold text-aureon-bg' : 'text-aureon-text hover:bg-aureon-gold/10'
            }`}
          >
            <Clock size={16} />
            Event Log ({stats.totalEvents})
          </button>
          <button
            onClick={() => setView('dlq')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              view === 'dlq' ? 'bg-aureon-gold text-aureon-bg' : 'text-aureon-text hover:bg-aureon-gold/10'
            }`}
          >
            <AlertTriangle size={16} />
            Dead Letter Queue ({stats.dlqSize})
          </button>
        </div>

        {/* ESTATÍSTICAS */}
        {view === 'stats' && (
          <div className="space-y-6">
            {/* Cards de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-aureon-text/70 text-sm">Total de Eventos</span>
                  <Activity className="text-aureon-gold" size={20} />
                </div>
                <p className="text-3xl font-bold text-aureon-gold">{stats.totalEvents}</p>
              </div>

              <div className="bg-aureon-surface border border-blue-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-aureon-text/70 text-sm">Listeners Ativos</span>
                  <Play className="text-blue-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-blue-400">{stats.totalListeners}</p>
              </div>

              <div className="bg-aureon-surface border border-red-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-aureon-text/70 text-sm">Falhas (DLQ)</span>
                  <AlertTriangle className="text-red-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-red-400">{stats.dlqSize}</p>
              </div>

              <div className="bg-aureon-surface border border-green-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-aureon-text/70 text-sm">Taxa de Sucesso</span>
                  <Activity className="text-green-400" size={20} />
                </div>
                <p className="text-3xl font-bold text-green-400">
                  {stats.totalEvents > 0 ? ((1 - stats.dlqSize / stats.totalEvents) * 100).toFixed(1) : 100}%
                </p>
              </div>
            </div>

            {/* Top eventos */}
            <div className="bg-aureon-surface border border-aureon-gold/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-aureon-gold mb-4">Top 10 Eventos Mais Frequentes</h3>
              <div className="space-y-3">
                {stats.topEvents.slice(0, 10).map(([eventType, count], idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-aureon-bg/50 rounded-lg border border-aureon-gold/10">
                    <div className="flex items-center gap-3">
                      <span className="text-aureon-gold font-bold">#{idx + 1}</span>
                      <code className="text-sm text-blue-400">{eventType}</code>
                    </div>
                    <span className="px-3 py-1 bg-aureon-gold/20 text-aureon-gold rounded-full text-sm font-semibold">
                      {count} eventos
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EVENT LOG */}
        {view === 'log' && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-aureon-text/50" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-aureon-surface border border-aureon-gold/30 rounded-lg text-aureon-text placeholder-aureon-text/50 focus:outline-none focus:border-aureon-gold"
                  />
                </div>
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 bg-aureon-surface border border-aureon-gold/30 rounded-lg text-aureon-text focus:outline-none focus:border-aureon-gold"
              >
                <option value="all">Todos os Domínios</option>
                <option value="sales">Sales</option>
                <option value="finance">Finance</option>
                <option value="inventory">Inventory</option>
                <option value="purchase">Purchase</option>
                <option value="system">System</option>
              </select>

              <button
                onClick={handleExportLog}
                className="px-4 py-3 bg-aureon-gold text-aureon-bg rounded-lg font-semibold hover:bg-aureon-text transition-all flex items-center gap-2"
              >
                <Download size={18} />
                Exportar
              </button>
            </div>

            {/* Lista de eventos */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredEvents.map((event, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                  className="bg-aureon-surface border border-aureon-gold/20 rounded-lg p-4 hover:border-aureon-gold/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <code className="text-blue-400 font-semibold">{event.type}</code>
                      <p className="text-xs text-aureon-text/50 mt-1">
                        ID: {event.id} • {new Date(event.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      SUCCESS
                    </span>
                  </div>

                  {selectedEvent?.id === event.id && (
                    <div className="mt-4 p-3 bg-aureon-bg/50 rounded border border-aureon-gold/10">
                      <p className="text-xs text-aureon-text/70 mb-2">Payload:</p>
                      <pre className="text-xs text-aureon-text overflow-x-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                      {event.metadata && (
                        <>
                          <p className="text-xs text-aureon-text/70 mb-2 mt-4">Metadata:</p>
                          <pre className="text-xs text-aureon-text overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEAD LETTER QUEUE */}
        {view === 'dlq' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-aureon-text/70">
                {stats.dlqSize} evento(s) falhado(s) aguardando reprocessamento
              </p>
              {stats.dlqSize > 0 && (
                <button
                  onClick={handleClearDLQ}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-400/30 rounded-lg font-semibold hover:bg-red-500/30 transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Limpar DLQ
                </button>
              )}
            </div>

            {stats.dlq.length === 0 ? (
              <div className="bg-aureon-surface border border-green-400/30 rounded-xl p-8 text-center">
                <Activity className="text-green-400 mx-auto mb-4" size={48} />
                <p className="text-green-400 font-semibold">✅ Nenhum evento falhado!</p>
                <p className="text-aureon-text/70 text-sm mt-2">Todos os eventos foram processados com sucesso.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.dlq.map((item, idx) => (
                  <div key={idx} className="bg-aureon-surface border border-red-400/30 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <code className="text-red-400 font-semibold">{item.event.type}</code>
                        <p className="text-xs text-aureon-text/50 mt-1">
                          Falhou {item.event.retryCount || 0} vez(es) • {new Date(item.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleReplayEvent(item.event)}
                        className="px-3 py-1.5 bg-aureon-gold text-aureon-bg rounded-lg text-sm font-semibold hover:bg-aureon-text transition-all flex items-center gap-2"
                      >
                        <RefreshCw size={14} />
                        Reprocessar
                      </button>
                    </div>

                    <div className="p-3 bg-red-500/10 rounded border border-red-400/20">
                      <p className="text-xs text-red-400 font-semibold mb-2">Erro:</p>
                      <p className="text-xs text-aureon-text">{item.error.message}</p>
                    </div>

                    <div className="mt-3 p-3 bg-aureon-bg/50 rounded border border-aureon-gold/10">
                      <p className="text-xs text-aureon-text/70 mb-2">Payload:</p>
                      <pre className="text-xs text-aureon-text overflow-x-auto max-h-40">
                        {JSON.stringify(item.event.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

