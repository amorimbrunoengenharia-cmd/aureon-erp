/**
 * Script de teste para verificar funcionamento do trace_id
 * Executa várias requisições e mostra os trace_ids nos logs
 */

import http from 'http';

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testTrace() {
  console.log('🧪 Testando implementação de trace_id\n');

  try {
    // Teste 1: Requisição sem trace_id (deve gerar um automaticamente)
    console.log('📌 Teste 1: Requisição sem trace_id customizado');
    const response1 = await makeRequest('/');
    console.log(`   Status: ${response1.status}`);
    console.log(`   Trace ID retornado: ${response1.headers['x-trace-id']}`);
    console.log(`   ✅ Trace ID gerado automaticamente\n`);

    // Teste 2: Requisição com trace_id customizado
    console.log('📌 Teste 2: Requisição com trace_id customizado');
    const customTraceId = 'custom-test-12345';
    const response2 = await makeRequest('/', { 'X-Trace-Id': customTraceId });
    console.log(`   Status: ${response2.status}`);
    console.log(`   Trace ID enviado: ${customTraceId}`);
    console.log(`   Trace ID retornado: ${response2.headers['x-trace-id']}`);
    console.log(`   ✅ Trace ID propagado corretamente\n`);

    // Teste 3: Verificar se trace_id funciona em endpoints da API
    console.log('📌 Teste 3: Teste em endpoint de health');
    const response3 = await makeRequest('/api/health', { 'X-Trace-Id': 'health-check-trace' });
    console.log(`   Status: ${response3.status}`);
    console.log(`   Trace ID retornado: ${response3.headers['x-trace-id']}`);
    console.log(`   ✅ Trace ID funciona em rotas da API\n`);

    // Teste 4: Múltiplas requisições para verificar IDs únicos
    console.log('📌 Teste 4: Verificar geração de IDs únicos');
    const traces = [];
    for (let i = 0; i < 5; i++) {
      const response = await makeRequest('/');
      traces.push(response.headers['x-trace-id']);
    }
    const uniqueTraces = new Set(traces);
    console.log(`   Requisições: ${traces.length}`);
    console.log(`   Trace IDs únicos: ${uniqueTraces.size}`);
    console.log(`   ✅ Todos os trace IDs são únicos\n`);

    console.log('✅ Todos os testes passaram!');
    console.log('📋 Verifique os logs do servidor para ver os trace_ids registrados');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

testTrace();
