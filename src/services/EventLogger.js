/**
 * EventLogger - Sistema de logging persistente para eventos
 * Armazena logs no localStorage com rotação automática
 */

const MAX_LOGS = 1000; // Máximo de logs armazenados
const STORAGE_KEY = 'aureon_event_logs';

class EventLogger {
  constructor() {
    this.logs = this.loadLogs();
  }

  /**
   * Carrega logs do localStorage
   */
  loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar logs:', error);
      return [];
    }
  }

  /**
   * Salva logs no localStorage
   */
  saveLogs() {
    try {
      // Manter apenas os últimos MAX_LOGS
      if (this.logs.length > MAX_LOGS) {
        this.logs = this.logs.slice(-MAX_LOGS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('❌ Erro ao salvar logs:', error);
    }
  }

  /**
   * Registra um log de evento
   */
  log(level, message, data = {}) {
    const logEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level, // 'info', 'warn', 'error', 'debug'
      message,
      data,
      trace_id: data.trace_id || null,
      event_type: data.event_type || null
    };

    this.logs.push(logEntry);
    this.saveLogs();

    // Console output com emoji baseado no level
    const emoji = {
      info: '📘',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      success: '✅'
    }[level] || '📝';

    // Em produção, apenas mostrar warn, error e success
    // Em desenvolvimento, mostrar tudo exceto debug excessivo
    const shouldLog = import.meta.env.DEV 
      ? true 
      : (level === 'warn' || level === 'error' || level === 'success');
    
    if (shouldLog) {
      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, data);
    }

    return logEntry;
  }

  /**
   * Log de informação
   */
  info(message, data = {}) {
    return this.log('info', message, data);
  }

  /**
   * Log de aviso
   */
  warn(message, data = {}) {
    return this.log('warn', message, data);
  }

  /**
   * Log de erro
   */
  error(message, data = {}) {
    return this.log('error', message, data);
  }

  /**
   * Log de debug
   */
  debug(message, data = {}) {
    return this.log('debug', message, data);
  }

  /**
   * Log de sucesso
   */
  success(message, data = {}) {
    return this.log('success', message, data);
  }

  /**
   * Busca logs por filtros
   */
  search(filters = {}) {
    let results = [...this.logs];

    if (filters.level) {
      results = results.filter(log => log.level === filters.level);
    }

    if (filters.trace_id) {
      results = results.filter(log => log.trace_id === filters.trace_id);
    }

    if (filters.event_type) {
      results = results.filter(log => log.event_type === filters.event_type);
    }

    if (filters.startDate) {
      results = results.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      results = results.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }

    return results;
  }

  /**
   * Retorna todos os logs de um trace_id específico
   */
  getTraceHistory(trace_id) {
    return this.logs.filter(log => log.trace_id === trace_id);
  }

  /**
   * Limpa logs antigos
   */
  clearOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const before = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.timestamp) >= cutoffDate);
    const removed = before - this.logs.length;

    this.saveLogs();
    return removed;
  }

  /**
   * Limpa todos os logs
   */
  clearAll() {
    this.logs = [];
    this.saveLogs();
  }

  /**
   * Exporta logs como JSON
   */
  exportLogs(filters = {}) {
    const logs = filters ? this.search(filters) : this.logs;
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileName = `aureon_event_logs_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  }

  /**
   * Retorna estatísticas dos logs
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      byEventType: {},
      recentErrors: []
    };

    this.logs.forEach(log => {
      // Contagem por level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

      // Contagem por tipo de evento
      if (log.event_type) {
        stats.byEventType[log.event_type] = (stats.byEventType[log.event_type] || 0) + 1;
      }

      // Últimos erros (últimas 24h)
      if (log.level === 'error') {
        const logTime = new Date(log.timestamp);
        const now = new Date();
        const hoursDiff = (now - logTime) / (1000 * 60 * 60);
        if (hoursDiff <= 24) {
          stats.recentErrors.push(log);
        }
      }
    });

    return stats;
  }
}

// Singleton instance
const eventLogger = new EventLogger();

export default eventLogger;
