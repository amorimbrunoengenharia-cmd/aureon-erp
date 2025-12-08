#!/usr/bin/env node

/**
 * AUREON ERP - Smoke Test Simulator
 * Testa cenários críticos end-to-end com backend ativo
 * 
 * Usage:
 *   npm run simulate:smoke
 *   node scripts/simulate-smoke.js --scenario=venda-completa
 *   node scripts/simulate-smoke.js --scenario=all --report=reports/smoke-TIMESTAMP.json
 */

const API_BASE = process.env.VITE_API_URL || 'http://localhost:5000/api';

// ===== HELPERS =====
const log = {
  success: (msg) => console.log('✅', msg),
  error: (msg) => console.log('❌', msg),
  info: (msg) => console.log('ℹ️ ', msg),
  warn: (msg) => console.log('⚠️ ', msg),
};

async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${data.error || data.message || 'Unknown'}`);
  }

  return data;
}

// ===== SCENARIOS =====
const scenarios = {
  /**
   * SCENARIO 1: Login Flow
   */
  async login() {
    log.info('[SCENARIO] Login Flow');
    
    try {
      const response = await apiCall('/auth/login', 'POST', {
        username: 'admin',
        password: 'admin123'
      });

      if (!response.accessToken) {
        throw new Error('No access token returned');
      }

      if (!response.user || !response.user.role) {
        throw new Error('User data incomplete');
      }

      log.success(`Login successful: ${response.user.username} (${response.user.role})`);
      return { passed: true, token: response.accessToken, user: response.user };
    } catch (error) {
      log.error(`Login failed: ${error.message}`);
      return { passed: false, error: error.message };
    }
  },

  /**
   * SCENARIO 2: Create Product
   */
  async createProduct(token) {
    log.info('[SCENARIO] Create Product');

    try {
      const product = {
        produto: `Test Product ${Date.now()}`,
        sku: `TEST-${Date.now()}`,
        preco_venda: 99.90,
        quantidade_estoque: 50,
        categoria: 'Test',
        tipo: 'produto'
      };

      const response = await apiCall('/products', 'POST', product, token);

      if (!response.data || !response.data.id) {
        throw new Error('Product not created');
      }

      log.success(`Product created: ${response.data.produto} (ID: ${response.data.id})`);
      return { passed: true, productId: response.data.id };
    } catch (error) {
      log.error(`Create product failed: ${error.message}`);
      return { passed: false, error: error.message };
    }
  },

  /**
   * SCENARIO 3: Create Client
   */
  async createClient(token) {
    log.info('[SCENARIO] Create Client');

    try {
      const client = {
        nome: `Test Client ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        cpf_cnpj: `${Math.floor(Math.random() * 100000000000)}`,
        telefone: '11999999999',
        categoria: 'Varejo'
      };

      const response = await apiCall('/clients', 'POST', client, token);

      if (!response.data || !response.data.id) {
        throw new Error('Client not created');
      }

      log.success(`Client created: ${response.data.nome} (ID: ${response.data.id})`);
      return { passed: true, clientId: response.data.id };
    } catch (error) {
      log.error(`Create client failed: ${error.message}`);
      return { passed: false, error: error.message };
    }
  },

  /**
   * SCENARIO 4: Create Sale (End-to-End)
   */
  async createSale(token, productId, clientId) {
    log.info('[SCENARIO] Create Sale (E2E)');

    try {
      const sale = {
        produto: productId,
        produto_id: productId,
        cliente_id: clientId,
        quantidade: 5,
        valor_venda: 499.50,
        data_venda: new Date().toISOString().split('T')[0],
        canal: 'Loja Física',
        status: 'completed'
      };

      const response = await apiCall('/sales', 'POST', sale, token);

      if (!response.data || !response.data.id) {
        throw new Error('Sale not created');
      }

      log.success(`Sale created: R$ ${response.data.valor_venda} (ID: ${response.data.id})`);
      return { passed: true, saleId: response.data.id };
    } catch (error) {
      log.error(`Create sale failed: ${error.message}`);
      return { passed: false, error: error.message };
    }
  },

  /**
   * SCENARIO 5: Audit Log Access (CEO)
   */
  async auditLogAccess(token) {
    log.info('[SCENARIO] Audit Log Access');

    try {
      const response = await apiCall('/audit', 'GET', null, token);

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Audit log data invalid');
      }

      log.success(`Audit log accessible: ${response.data.length} logs retrieved`);
      return { passed: true, logCount: response.data.length };
    } catch (error) {
      log.error(`Audit log access failed: ${error.message}`);
      return { passed: false, error: error.message };
    }
  },

  /**
   * SCENARIO 6: Financial Dashboard
   */
  async financialDashboard(token) {
    log.info('[SCENARIO] Financial Dashboard');

    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const endDate = new Date();

      const response = await apiCall(
        `/financial/dashboard?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
        'GET',
        null,
        token
      );

      if (!response.data || !response.data.dre) {
        throw new Error('Dashboard data incomplete');
      }

      log.success(`Financial dashboard loaded successfully`);
      return { passed: true };
    } catch (error) {
      log.error(`Financial dashboard failed: ${error.message}`);
      return { passed: false, error: error.message };
    }
  }
};

// ===== ORCHESTRATOR =====
async function runSmokeTests(scenarioFilter = 'all') {
  console.log('\n🚀 AUREON ERP - Smoke Test Runner\n');

  const results = {
    timestamp: new Date().toISOString(),
    passed: 0,
    failed: 0,
    scenarios: []
  };

  try {
    // 1. Login
    const loginResult = await scenarios.login();
    results.scenarios.push({ name: 'Login', ...loginResult });
    if (!loginResult.passed) {
      log.error('Login failed - aborting smoke tests');
      return results;
    }
    results.passed++;

    const { token } = loginResult;

    // 2. Create Product
    if (scenarioFilter === 'all' || scenarioFilter === 'venda-completa') {
      const productResult = await scenarios.createProduct(token);
      results.scenarios.push({ name: 'Create Product', ...productResult });
      productResult.passed ? results.passed++ : results.failed++;

      // 3. Create Client
      const clientResult = await scenarios.createClient(token);
      results.scenarios.push({ name: 'Create Client', ...clientResult });
      clientResult.passed ? results.passed++ : results.failed++;

      // 4. Create Sale
      if (productResult.passed && clientResult.passed) {
        const saleResult = await scenarios.createSale(
          token,
          productResult.productId,
          clientResult.clientId
        );
        results.scenarios.push({ name: 'Create Sale', ...saleResult });
        saleResult.passed ? results.passed++ : results.failed++;
      }
    }

    // 5. Audit Log
    const auditResult = await scenarios.auditLogAccess(token);
    results.scenarios.push({ name: 'Audit Log Access', ...auditResult });
    auditResult.passed ? results.passed++ : results.failed++;

    // 6. Financial Dashboard
    const dashboardResult = await scenarios.financialDashboard(token);
    results.scenarios.push({ name: 'Financial Dashboard', ...dashboardResult });
    dashboardResult.passed ? results.passed++ : results.failed++;

  } catch (error) {
    log.error(`Critical error: ${error.message}`);
    results.failed++;
  }

  // Summary
  console.log('\n📊 SUMMARY');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Total: ${results.scenarios.length}`);

  // Save report if requested
  const reportPath = process.argv.find(arg => arg.startsWith('--report='));
  if (reportPath) {
    const fs = require('fs');
    const path = reportPath.split('=')[1].replace('TIMESTAMP', Date.now());
    fs.writeFileSync(path, JSON.stringify(results, null, 2));
    log.success(`Report saved to ${path}`);
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// ===== MAIN =====
const scenarioArg = process.argv.find(arg => arg.startsWith('--scenario='));
const scenario = scenarioArg ? scenarioArg.split('=')[1] : 'all';

runSmokeTests(scenario);
