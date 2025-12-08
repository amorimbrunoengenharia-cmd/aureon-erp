/**
 * API Service - Centralized API communication layer
 * Handles authentication, token management, and API requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('aureon_token');
    this.refreshToken = localStorage.getItem('aureon_refresh_token');
  }

  /**
   * Set authentication token
   */
  setToken(token, refreshToken = null) {
    this.token = token;
    localStorage.setItem('aureon_token', token);
    
    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('aureon_refresh_token', refreshToken);
    }
  }

  /**
   * Clear authentication tokens
   */
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('aureon_token');
    localStorage.removeItem('aureon_refresh_token');
  }

  /**
   * Get authorization headers
   */
  getHeaders(contentType = 'application/json') {
    const headers = {
      'Content-Type': contentType
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // ✅ Adicionar tenant ID do usuário logado
    const userStr = localStorage.getItem('aureon_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.tenant_id) {
          headers['X-Tenant-ID'] = user.tenant_id;
        } else {
          // ✅ Log detalhado: user sem tenant_id
          console.error('❌ [ApiService] User sem tenant_id:', {
            username: user.username,
            role: user.role,
            user_id: user.id,
            hasToken: !!this.token
          });
          
          // ⚠️ NÃO forçar logout aqui - deixar backend retornar 401
          // Backend pode retornar tenant_id no JWT
        }
      } catch (e) {
        console.error('❌ [ApiService] Erro ao parsear aureon_user:', e);
      }
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  async handleResponse(response, retryFn = null) {
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    }

    // ✅ Handle 401 Unauthorized
    if (response.status === 401 && !response._isRetry) {
      console.warn('⚠️ [ApiService] 401 Unauthorized received');
      
      // Tentar refresh token primeiro
      const refreshed = await this.refreshAccessToken();
      if (refreshed && retryFn) {
        console.log('✅ [ApiService] Token refreshed successfully, retrying request...');
        return await retryFn();
      }
      
      // ✅ Refresh falhou - forçar logout com mensagem
      if (!refreshed) {
        console.error('❌ [ApiService] Token refresh failed, logging out...');
        
        // Mostrar mensagem ao usuário antes de deslogar
        const errorMessage = 'Sessão expirada. Você será redirecionado para o login.';
        
        // Tentar usar Toast se disponível (importação dinâmica)
        try {
          const { showToast } = await import('../components/Toast.jsx');
          showToast?.('error', errorMessage);
        } catch (e) {
          // Fallback para alert
          alert(errorMessage);
        }
        
        // Aguardar 1.5s para usuário ver mensagem
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.clearTokens();
        localStorage.removeItem('aureon_user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    // Parse error message
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // Could not parse error as JSON
    }

    throw new Error(errorMessage);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        // Backend retorna 'accessToken' e opcional 'refreshToken'
        this.setToken(data.accessToken || data.token, data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  /**
   * Make GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

    const makeRequest = async (isRetry = false) => {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      response._isRetry = isRetry;
      return this.handleResponse(response, () => makeRequest(true));
    };

    return await makeRequest();
  }

  /**
   * Make POST request
   */
  async post(endpoint, data = {}) {
    const makeRequest = async (isRetry = false) => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      response._isRetry = isRetry;
      return this.handleResponse(response, () => makeRequest(true));
    };

    return await makeRequest();
  }

  /**
   * Make PUT request
   */
  async put(endpoint, data = {}) {
    const makeRequest = async (isRetry = false) => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      response._isRetry = isRetry;
      return this.handleResponse(response, () => makeRequest(true));
    };

    return await makeRequest();
  }

  /**
   * Make PATCH request
   */
  async patch(endpoint, data = {}) {
    const makeRequest = async (isRetry = false) => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      response._isRetry = isRetry;
      return this.handleResponse(response, () => makeRequest(true));
    };

    return await makeRequest();
  }

  /**
   * Make DELETE request
   */
  async delete(endpoint) {
    const makeRequest = async (isRetry = false) => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      response._isRetry = isRetry;
      return this.handleResponse(response, () => makeRequest(true));
    };

    return await makeRequest();
  }

  // ===== AUTH ENDPOINTS =====

  async login(username, password) {
    const data = await this.post('/auth/login', { username, password });
    this.setToken(data.token, data.refreshToken);
    return data;
  }

  async register(userData) {
    return this.post('/auth/register', userData);
  }

  async logout() {
    this.clearTokens();
  }

  // ===== PRODUCTS ENDPOINTS =====

  async getProducts(params = {}) {
    return this.get('/products', params);
  }

  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  async createProduct(product) {
    return this.post('/products', product);
  }

  async updateProduct(id, product) {
    return this.put(`/products/${id}`, product);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  async updateStock(id, quantidade) {
    return this.patch(`/products/${id}/stock`, { quantidade });
  }

  // ===== CLIENTS ENDPOINTS =====

  async getClients(params = {}) {
    return this.get('/clients', params);
  }

  async getClient(id) {
    return this.get(`/clients/${id}`);
  }

  async createClient(client) {
    return this.post('/clients', client);
  }

  async updateClient(id, client) {
    return this.put(`/clients/${id}`, client);
  }

  async deleteClient(id) {
    return this.delete(`/clients/${id}`);
  }

  // ===== SUPPLIERS ENDPOINTS =====

  async getSuppliers(params = {}) {
    return this.get('/suppliers', params);
  }

  async getSupplier(id) {
    return this.get(`/suppliers/${id}`);
  }

  async createSupplier(supplier) {
    return this.post('/suppliers', supplier);
  }

  async updateSupplier(id, supplier) {
    return this.put(`/suppliers/${id}`, supplier);
  }

  async deleteSupplier(id) {
    return this.delete(`/suppliers/${id}`);
  }

  // ===== SALES ENDPOINTS =====

  async getSales(params = {}) {
    return this.get('/sales', params);
  }

  async getSale(id) {
    return this.get(`/sales/${id}`);
  }

  async createSale(sale) {
    return this.post('/sales', sale);
  }

  async updateSale(id, sale) {
    return this.put(`/sales/${id}`, sale);
  }

  async getSalesStats(params = {}) {
    return this.get('/sales/stats/summary', params);
  }

  // ===== PRESCRIPTIONS ENDPOINTS =====

  async getPrescriptions(params = {}) {
    return this.get('/prescriptions', params);
  }

  async getPrescription(id) {
    return this.get(`/prescriptions/${id}`);
  }

  async createPrescription(prescription) {
    return this.post('/prescriptions', prescription);
  }

  async updatePrescription(id, prescription) {
    return this.put(`/prescriptions/${id}`, prescription);
  }

  async attachPrescriptionToOrder(prescriptionId, orderId) {
    return this.post(`/prescriptions/${prescriptionId}/attach/${orderId}`);
  }

  async checkExpiredPrescriptions() {
    return this.get('/prescriptions/check-expired');
  }

  // ===== FINANCE ENDPOINTS =====

  async getFinanceTransactions(params = {}) {
    return this.get('/finance/transactions', params);
  }

  async getFinanceTransaction(id) {
    return this.get(`/finance/transactions/${id}`);
  }

  async createFinanceTransaction(transaction) {
    return this.post('/finance/transactions', transaction);
  }

  async updateFinanceTransaction(id, transaction) {
    return this.put(`/finance/transactions/${id}`, transaction);
  }

  async updateTransactionStatus(id, status) {
    return this.patch(`/finance/transactions/${id}/status`, { status });
  }

  async getFinanceDashboard(params = {}) {
    return this.get('/finance/dashboard', params);
  }

  // ===== INVENTORY ENDPOINTS =====

  async getStockMovements(params = {}) {
    return this.get('/inventory/movements', params);
  }

  async createStockMovement(movement) {
    return this.post('/inventory/movements', movement);
  }

  async getLowStockProducts() {
    return this.get('/inventory/low-stock');
  }

  async getInventoryReport() {
    return this.get('/inventory/report');
  }

  // ===== EVENTS ENDPOINTS =====

  async getEvents(params = {}) {
    return this.get('/events', params);
  }

  async createEvent(eventData) {
    return this.post('/events', eventData);
  }

  async getEventsByTrace(traceId) {
    return this.get(`/events/trace/${traceId}`);
  }

  async getDLQEvents() {
    return this.get('/events/dlq');
  }

  async retryEvent(id) {
    return this.post(`/events/${id}/retry`);
  }

  async getEventsStats(params = {}) {
    return this.get('/events/stats', params);
  }

  async retryBatch(options = {}) {
    return this.post('/events/retry-batch', options);
  }

  async getRetryStats() {
    return this.get('/events/retry-stats');
  }

  async runAutomatedRetry() {
    return this.post('/events/run-automated-retry');
  }

  // ===== AUDIT ENDPOINTS =====

  async getAuditLogs(params = {}) {
    return this.get('/audit', params);
  }

  async getUserAuditLogs(userId, params = {}) {
    return this.get(`/audit/user/${userId}`, params);
  }

  async getAuditStats(params = {}) {
    return this.get('/audit/stats', params);
  }

  async createAuditLog(logData) {
    return this.post('/audit/log', logData);
  }

  // ===== ALERTS API =====
  async getAlerts(params = {}) {
    return this.get('/alerts', params);
  }

  async getAlertsSummary() {
    return this.get('/alerts/summary');
  }

  async getCriticalAlerts() {
    return this.get('/alerts/critical');
  }

  async updateAlertThresholds(thresholds) {
    return this.put('/alerts/thresholds', thresholds);
  }

  async runManualAlertCheck() {
    return this.post('/alerts/check');
  }

  // ===== ANALYTICS API =====
  async getAnalyticsDashboard(startDate, endDate, filters = {}) {
    const params = { startDate, endDate, ...filters };
    return this.get('/analytics/dashboard', params);
  }

  async getSalesAnalytics(startDate, endDate, filters = {}) {
    const params = { startDate, endDate, ...filters };
    return this.get('/analytics/sales', params);
  }

  async getTopProducts(startDate, endDate, limit = 10) {
    return this.get('/analytics/top-products', { startDate, endDate, limit });
  }

  async getTopClients(startDate, endDate, limit = 10) {
    return this.get('/analytics/top-clients', { startDate, endDate, limit });
  }

  async getSalesmanPerformance(startDate, endDate) {
    return this.get('/analytics/salesman-performance', { startDate, endDate });
  }

  async getCategoryAnalysis(startDate, endDate) {
    return this.get('/analytics/categories', { startDate, endDate });
  }

  async getPeriodComparison(currentStart, currentEnd, previousStart, previousEnd) {
    return this.get('/analytics/period-comparison', {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd
    });
  }

  async exportAnalytics(startDate, endDate, type = 'sales') {
    return this.get('/analytics/export', { startDate, endDate, type });
  }

  // ===== BACKUP API =====
  async createBackup() {
    return this.post('/backup/create');
  }

  async listBackups() {
    return this.get('/backup/list');
  }

  async restoreBackup(filename, options = {}) {
    return this.post(`/backup/restore/${filename}`, options);
  }

  async deleteBackup(filename) {
    return this.delete(`/backup/${filename}`);
  }

  async cleanupOldBackups(keepCount = 10) {
    return this.post('/backup/cleanup', { keepCount });
  }

  async createIncrementalBackup(since) {
    return this.post('/backup/incremental', { since });
  }

  async downloadBackup(filename) {
    const response = await fetch(`${API_BASE_URL}/backup/download/${filename}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer download do backup');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // ==================== EMAIL METHODS ====================
  
  async sendTestEmail(data) {
    return this.post('/email/test', data);
  }

  async sendWelcomeEmail(data) {
    return this.post('/email/welcome', data);
  }

  async sendOrderConfirmation(data) {
    return this.post('/email/order-confirmation', data);
  }

  async sendLowStockAlert(data) {
    return this.post('/email/low-stock-alert', data);
  }

  async sendPaymentReminder(data) {
    return this.post('/email/payment-reminder', data);
  }

  async sendBackupNotification(data) {
    return this.post('/email/backup-notification', data);
  }

  async getEmailServiceStatus() {
    return this.get('/email/status');
  }

  // ==================== AUDIT METHODS ====================
  
  async getAuditLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/audit?${queryString}`);
  }

  async getUserActivity(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/audit/user/${userId}?${queryString}`);
  }

  async getResourceHistory(resourceType, resourceId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/audit/resource/${resourceType}/${resourceId}?${queryString}`);
  }

  async getAuditReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/audit/report?${queryString}`);
  }

  async getRecentChanges(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/audit/recent?${queryString}`);
  }

  async exportAuditLog(params = {}) {
    const { format = 'json', ...filters } = params;
    const queryString = new URLSearchParams({ format, ...filters }).toString();
    
    const response = await fetch(`${API_BASE_URL}/audit/export?${queryString}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao exportar audit log');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_export_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async getAuditStatistics(period = '30d') {
    return this.get(`/audit/statistics/${period}`);
  }

  async createAuditLog(data) {
    return this.post('/audit/log', data);
  }

  // ==================== SEARCH METHODS ====================
  
  async globalSearch(query, options = {}) {
    return this.post('/search/global', { query, ...options });
  }

  async searchProducts(params = {}) {
    return this.post('/search/products', params);
  }

  async searchClients(params = {}) {
    return this.post('/search/clients', params);
  }

  async searchSales(params = {}) {
    return this.post('/search/sales', params);
  }

  async searchSuppliers(params = {}) {
    return this.post('/search/suppliers', params);
  }

  async getSuggestions(query, entity = 'products', limit = 10) {
    const queryString = new URLSearchParams({ query, entity, limit }).toString();
    return this.get(`/search/suggestions?${queryString}`);
  }

  async getRecentSearches(limit = 10) {
    return this.get(`/search/recent?limit=${limit}`);
  }

  async getFilterPresets() {
    return this.get('/search/filters/presets');
  }

  async getFilterSummary(filters) {
    return this.post('/search/filters/summary', filters);
  }

  async saveSavedSearch(data) {
    return this.post('/search/saved', data);
  }

  async getSavedSearches(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/search/saved?${queryString}`);
  }

  async updateSavedSearch(id, data) {
    return this.put(`/search/saved/${id}`, data);
  }

  async deleteSavedSearch(id) {
    return this.delete(`/search/saved/${id}`);
  }

  async useSavedSearch(id) {
    return this.post(`/search/saved/${id}/use`);
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
