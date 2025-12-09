# Simulador de Prescrições - Documentação Completa

## Visão Geral

O Simulador de Prescrições é um módulo de teste automatizado que valida o fluxo completo de gestão de prescrições oftalmológicas, incluindo:

- ✅ Criação e atualização de prescrições
- ✅ Upload e parsing OCR de imagens de receitas
- ✅ Rastreabilidade completa via UUID trace_id
- ✅ Histórico de pacientes e progressão
- ✅ Versionamento de prescrições
- ✅ Detecção automática de progressão rápida
- ✅ Integração com AI/ML para recomendações

## Arquitetura

### Componentes Principais

```
simulator/
├── scenarios/          # Cenários de teste (JSON)
│   ├── prescription-create-happy.json
│   └── prescription-parse-extract.json
├── validators/         # Validadores de dados
│   └── prescription-validator.js
├── executors/          # Executores de operações
│   └── prescription-executor.js
├── seeds/              # Dados de exemplo
│   └── prescriptions.sql
└── fixtures/           # Arquivos de teste
    └── sample-prescription.txt
```

### Fluxo de Dados

```
┌─────────────┐
│   Cenário   │ scenario.json define os passos
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Executor   │ prescription-executor.js executa operações
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     API     │ Backend Express + Sequelize
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Validator  │ prescription-validator.js verifica resultados
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Report    │ SimulatorRun armazena métricas
└─────────────┘
```

## Modelos de Dados

### 1. Prescription (Prescrição)
```javascript
{
  id: UUID,                    // ID único da prescrição
  cliente_id: UUID,            // FK para clients
  trace_id: UUID,              // Rastreabilidade
  od: {                        // Olho direito
    esferico: FLOAT,           // -20.0 a +20.0
    cilindrico: FLOAT,         // -6.0 a 0.0
    eixo: INTEGER,             // 0° a 180°
    dnp: INTEGER,              // Distância nasopupilar (mm)
    adicao: FLOAT              // Adição para perto (presbiopia)
  },
  oe: { /* mesmo que od */ },  // Olho esquerdo
  tipo_lente: ENUM,            // Monofocal | Bifocal | Multifocal | Progressiva
  medico_nome: STRING,
  medico_crm: STRING,
  medico_uf: STRING(2),
  data_emissao: DATE,
  data_validade: DATE,
  observacoes: TEXT,
  status: ENUM,                // ativa | expirada | cancelada
  lgpd_consentimento: BOOLEAN,
  metadata: JSONB              // { source, ocr_confidence, ai_recommendations }
}
```

### 2. PrescriptionAttachment (Anexo)
```javascript
{
  id: UUID,
  prescription_id: UUID,
  file_type: STRING,           // PDF, JPEG, PNG, TIFF
  file_url: STRING,
  file_name: STRING,
  file_size: INTEGER,          // bytes
  file_hash: STRING(64),       // SHA-256 para integridade
  parsed_confidence: FLOAT,    // 0.0 a 1.0 (OCR confidence)
  parsed_data: JSONB,          // Dados extraídos pelo OCR
  trace_id: UUID,
  uploaded_by: UUID            // FK para users
}
```

### 3. PatientHistory (Histórico do Paciente)
```javascript
{
  id: UUID,
  patient_id: UUID,            // FK para clients
  event_type: ENUM,            // prescription | purchase | override | recheck | adjustment | consultation
  related_id: UUID,            // prescription_id, sale_id, version_id
  trace_id: UUID,
  metadata: JSONB,             // Dados específicos do evento
  actor_id: UUID,              // Quem executou (user_id)
  occurred_at: TIMESTAMP,
  severity: ENUM,              // low | medium | high | critical
  flags: JSONB                 // ["rapid_progression", "needs_recheck", "high_risk"]
}
```

### 4. PrescriptionVersion (Versionamento)
```javascript
{
  id: UUID,
  prescription_id: UUID,
  version_number: INTEGER,     // Auto-incrementado por prescrição
  reason: ENUM,                // manual_override | progression | recheck | correction | adjustment
  changed_fields: JSONB,       // Diff: { "od.esferico": { old: -2.0, new: -2.5 } }
  previous_data: JSONB,        // Snapshot completo antes
  new_data: JSONB,             // Snapshot completo depois
  changed_by: UUID,
  trace_id: UUID,
  notes: TEXT
}
```

### 5. SimulatorRun (Execução do Simulador)
```javascript
{
  id: UUID,
  scenario_id: STRING,         // "prescription-create-happy"
  scenario_name: STRING,
  status: ENUM,                // pending | running | success | failed | cancelled
  seed: INTEGER,               // Para reprodutibilidade
  start_at: TIMESTAMP,
  end_at: TIMESTAMP,
  duration_ms: INTEGER,
  report_url: STRING,
  created_records: JSONB,      // { prescriptions: 10, events: 20 }
  assertions: JSONB,           // { total: 15, passed: 14, failed: 1 }
  errors: JSONB,               // Array de erros encontrados
  trace_id: UUID,
  config: JSONB,               // Configuração da execução
  executed_by: UUID            // Usuário ou NULL para CI
}
```

## Cenários Disponíveis

### 1. prescription-create-happy.json
**Objetivo**: Testar criação básica de prescrição com correlação de trace_id

**Prioridade**: XS (crítico, <60s)

**Passos**:
1. Criar cliente via POST /api/clients
2. Criar prescrição com od/oe completos
3. Verificar entrada em patient_history
4. Verificar evento 'prescription.created'
5. GET prescrição para confirmar persistência

**Assertions**: 20 verificações
- Status codes (201, 200)
- UUIDs válidos (id, trace_id)
- Integridade de dados (od.esferico, oe.esferico)
- Correlação trace_id entre tabelas

**Uso**:
```bash
npm run simulate:scenario prescription-create-happy
```

### 2. prescription-parse-extract.json
**Objetivo**: Testar OCR, parsing de anexo e auto-fill

**Prioridade**: S (alto, <60s)

**Passos**:
1. Upload de sample-prescription.jpg via multipart/form-data
2. Verificar evento 'prescription.attachment.parsed'
3. Validar confidence > 0.5
4. Criar prescrição a partir dos dados extraídos

**Assertions**: 12 verificações
- Estrutura de resposta OCR
- Confidence score (0.0-1.0)
- Dados extraídos (od, oe, medico_crm)
- Criação de prescrição com metadata.ocr_confidence

**Failure Injections**: 10% chance de timeout 65s para testar resiliência

**Uso**:
```bash
npm run simulate:scenario prescription-parse-extract
```

## Endpoints da API

### POST /api/prescriptions
Cria nova prescrição com trace_id

**Request**:
```json
{
  "cliente_id": "uuid",
  "od": { "esferico": -2.0, "cilindrico": -0.5, "eixo": 90, "dnp": 32 },
  "oe": { "esferico": -2.25, "cilindrico": -0.75, "eixo": 85, "dnp": 32 },
  "tipo_lente": "Monofocal",
  "medico_nome": "Dra. Patricia Oliveira",
  "medico_crm": "12345",
  "medico_uf": "SP",
  "data_emissao": "2024-01-15",
  "data_validade": "2025-01-15",
  "observacoes": "Primeira prescrição",
  "lgpd_consentimento": true
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "trace_id": "uuid",
  "cliente_id": "uuid",
  "status": "ativa",
  "od": { ... },
  "oe": { ... },
  "created_at": "2024-01-15T10:00:00Z"
}
```

### POST /api/prescriptions/parse-attachment
Faz upload e parsing OCR de arquivo

**Request**: multipart/form-data
- `file`: JPEG, PNG, TIFF, PDF (max 10MB)

**Response** (200):
```json
{
  "trace_id": "uuid",
  "confidence": 0.85,
  "parsed": {
    "cliente_nome": "João Silva Santos",
    "medico_nome": "Dr. Roberto Fernandes",
    "medico_crm": "67890",
    "medico_uf": "RJ",
    "data_emissao": "2024-03-10",
    "od": { "esferico": -1.5, "cilindrico": -1.0, "eixo": 180, "dnp": 33, "adicao": 2.0 },
    "oe": { "esferico": -1.75, "cilindrico": -1.25, "eixo": 175, "dnp": 33, "adicao": 2.0 },
    "tipo_lente": "Bifocal"
  },
  "suggestions": [
    { "type": "info", "field": "confidence", "message": "High confidence OCR extraction" }
  ]
}
```

### GET /api/prescriptions/:id/versions
Retorna histórico de versões

**Response** (200):
```json
[
  {
    "version_number": 1,
    "reason": "progression",
    "changed_fields": {
      "od.esferico": { "old": -2.0, "new": -2.75 },
      "oe.esferico": { "old": -2.25, "new": -3.0 }
    },
    "changed_by": "uuid",
    "trace_id": "uuid",
    "notes": "Progressão de 6 meses",
    "created_at": "2024-07-20T14:30:00Z"
  }
]
```

### GET /api/patients/:patientId/history
Retorna histórico clínico do paciente

**Query Params**:
- `page`: número da página (default 1)
- `limit`: itens por página (default 50)
- `event_type`: filtrar por tipo (opcional)

**Response** (200):
```json
{
  "history": [
    {
      "event_type": "prescription",
      "related_id": "uuid",
      "trace_id": "uuid",
      "metadata": { "od": {...}, "oe": {...}, "tipo_lente": "Monofocal" },
      "occurred_at": "2024-01-15T10:00:00Z",
      "severity": "low",
      "flags": []
    },
    {
      "event_type": "prescription",
      "related_id": "uuid",
      "trace_id": "uuid",
      "metadata": {
        "od": {...},
        "oe": {...},
        "progression": { "od_change": -0.75, "oe_change": -0.75, "months_elapsed": 6 }
      },
      "occurred_at": "2024-07-20T14:30:00Z",
      "severity": "high",
      "flags": ["rapid_progression", "needs_recheck"]
    }
  ],
  "count": 2,
  "page": 1,
  "total_pages": 1
}
```

### GET /api/patients/:patientId/progression-check
Verifica progressão rápida de miopia/hipermetropia

**Response** (200):
```json
{
  "flagged": true,
  "reason": "Rapid sphere change detected",
  "od_change": -0.75,
  "oe_change": -0.75,
  "threshold": 0.5,
  "recommendations": [
    "Schedule follow-up consultation within 3 months",
    "Consider additional diagnostic tests"
  ]
}
```

## Validações

### Prescription Validator

**validatePrescriptionCreation(prescriptionId, expectedData)**
- UUID format
- trace_id presence
- Status válido (ativa | expirada | cancelada)
- Tipo de lente válido (Monofocal | Bifocal | Multifocal | Progressiva)
- Ranges de valores:
  - Esférico: -20.0 a +20.0
  - Cilíndrico: -6.0 a 0.0
  - Eixo: 0° a 180°
- Data de validade > data de emissão
- LGPD consentimento = true

**validatePatientHistoryEntry(prescriptionId, clienteId)**
- Entrada existe com event_type='prescription'
- trace_id presente
- metadata completo (od, oe)
- actor_id presente

**validateEventCreation(traceId, expectedEventType)**
- Evento existe com trace_id correto
- Status = 'completed'
- Payload não-vazio

**validateOCRResult(parseResult)**
- Confidence é número entre 0.0 e 1.0
- parsed_data estruturado (od ou oe presente)
- trace_id presente

**validatePrescriptionVersion(prescriptionId, versionNumber)**
- Versão existe
- changed_fields não-vazio
- reason válido
- trace_id presente

## Seeds de Teste

Execute `prescriptions.sql` para popular o banco com dados de exemplo:

```bash
psql -U postgres -d aureon_db -f simulator/seeds/prescriptions.sql
```

**Dados criados**:
- 4 clientes com LGPD consent
- 5 prescrições (vários tipos de lente)
- 5 entradas de patient_history
- 1 prescription_version (progressão)
- 6 eventos com trace_id

**Casos de teste**:
1. **Maria Silva**: Progressão rápida (-0.75D em 6 meses) → flagged
2. **João Santos**: Primeira vez bifocal → observação
3. **Ana Costa**: Progressiva com presbiopia
4. **Carlos Oliveira**: Extraída via OCR (confidence 0.85)

## Configuração

### Variáveis de Ambiente

```env
# Backend API
API_BASE_URL=http://localhost:5000

# Database (Simulator usa DB separado/ephemeral)
SIMULATOR_DB_HOST=localhost
SIMULATOR_DB_PORT=5432
SIMULATOR_DB_NAME=aureon_simulator
SIMULATOR_DB_USER=postgres
SIMULATOR_DB_PASSWORD=postgres

# OCR
TESSERACT_LANG=por
OCR_MAX_FILE_SIZE=10485760  # 10MB

# Simulator
SIMULATOR_SEED=42            # Para reprodutibilidade
SIMULATOR_PARALLEL=1         # Execuções paralelas
SIMULATOR_FAIL_FAST=true     # Parar no primeiro erro
SIMULATOR_INJECT_FAILURES=false
```

### Instalação de Dependências

```bash
cd aureon-backend
npm install tesseract.js sharp multer
```

### Executar Migrações

```bash
cd aureon-backend
npm run migrate
```

Isso executará:
- 004-add-prescription-trace-metadata.sql
- 005-create-prescription-attachments.sql
- 006-create-patient-history.sql
- 007-create-prescription-versions.sql
- 008-create-simulator-runs.sql

## Uso

### Executar Cenário Individual

```bash
npm run simulate:scenario prescription-create-happy
```

### Executar Todos os Cenários de Prescrição

```bash
npm run simulate:prescription
```

### Executar Smoke Tests (CI)

```bash
npm run simulate:smoke
```

### Executar com Seed Específico (Reprodutibilidade)

```bash
SIMULATOR_SEED=12345 npm run simulate:scenario prescription-create-happy
```

### Executar com Failure Injection

```bash
SIMULATOR_INJECT_FAILURES=true npm run simulate:prescription
```

## CI/CD Integration

### GitHub Actions Workflow

`.github/workflows/simulate-prescriptions-smoke.yml`:

```yaml
name: Prescription Simulator - Smoke Tests

on:
  pull_request:
    paths:
      - 'aureon-backend/models/**'
      - 'aureon-backend/services/prescription*.js'
      - 'aureon-backend/routes/prescription*.js'
      - 'aureon-os/simulator/scenarios/prescription-*.json'

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: aureon_simulator
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Backend Dependencies
        run: cd aureon-backend && npm install
      
      - name: Run Migrations
        run: cd aureon-backend && npm run migrate
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: aureon_simulator
      
      - name: Start Backend Server
        run: cd aureon-backend && npm start &
        env:
          PORT: 5000
      
      - name: Wait for Server
        run: npx wait-on http://localhost:5000/health -t 30000
      
      - name: Run Prescription Smoke Tests
        run: npm run simulate:smoke
        env:
          API_BASE_URL: http://localhost:5000
          SIMULATOR_FAIL_FAST: true
      
      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: simulator-results
          path: simulator/results/*.json
```

## Métricas e Relatórios

### SimulatorRun Record

Cada execução cria registro em `simulator_runs`:

```json
{
  "scenario_id": "prescription-create-happy",
  "status": "success",
  "duration_ms": 1542,
  "created_records": {
    "prescriptions": 1,
    "patient_history": 1,
    "events": 1
  },
  "assertions": {
    "total": 20,
    "passed": 20,
    "failed": 0
  },
  "errors": []
}
```

### Consultar Métricas

```sql
-- Últimas 10 execuções
SELECT 
  scenario_name,
  status,
  duration_ms,
  assertions->>'passed' as passed,
  assertions->>'failed' as failed,
  start_at
FROM simulator_runs
ORDER BY start_at DESC
LIMIT 10;

-- Taxa de sucesso por cenário
SELECT 
  scenario_id,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successes,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM simulator_runs
GROUP BY scenario_id
ORDER BY success_rate DESC;
```

## Troubleshooting

### OCR retornando confidence baixo (<0.5)

**Causas**:
- Imagem de baixa qualidade
- Resolução insuficiente (< 300 DPI)
- Texto manuscrito (OCR espera impresso)
- Idioma errado configurado

**Soluções**:
- Aumentar resolução da imagem
- Aplicar pré-processamento (Sharp: grayscale, normalize, sharpen)
- Verificar `TESSERACT_LANG=por`
- Treinar Tesseract com dataset customizado

### Cenário falhando em "verify patient_history"

**Causa**: Timing issue - banco ainda não commitou

**Solução**: Adicionar delay no cenário:
```json
{
  "id": "wait-for-db",
  "type": "delay",
  "duration": 100
}
```

### Trace_id não correlacionando entre tabelas

**Causa**: Transaction não commitada ou erro no service

**Verificação**:
```sql
SELECT 
  'prescriptions' as table_name, trace_id, created_at FROM prescriptions WHERE trace_id = 'uuid'
UNION ALL
SELECT 
  'patient_history', trace_id, created_at FROM patient_history WHERE trace_id = 'uuid'
UNION ALL
SELECT 
  'events', trace_id, created_at FROM events WHERE trace_id = 'uuid';
```

### Migração falhando

**Erro comum**: `relation "prescriptions" does not exist`

**Causa**: Migrações anteriores não executadas

**Solução**:
```bash
cd aureon-backend
npm run migrate:reset  # Rebuild completo
npm run migrate        # Aplicar todas
```

## Próximos Passos

### Features Planejadas

1. **Integração AI/ML**:
   - Análise de histórico para prever progressão
   - Recomendações automáticas de tipo de lente
   - Detecção de anomalias (valores fora do padrão)

2. **OCR Avançado**:
   - Suporte para múltiplos idiomas
   - Extração de diagramas de olho
   - Reconhecimento de assinaturas digitais

3. **Cenários Adicionais**:
   - prescription-update-progression.json
   - prescription-bulk-import.json
   - prescription-expired-cleanup.json
   - prescription-version-rollback.json

4. **Dashboard de Métricas**:
   - Visualização de taxa de sucesso
   - Alertas de regressões
   - Comparação entre versões

## Contribuição

Para adicionar novos cenários:

1. Criar arquivo JSON em `simulator/scenarios/`
2. Seguir estrutura existente (ver prescription-create-happy.json)
3. Adicionar validators em `prescription-validator.js` se necessário
4. Adicionar executors em `prescription-executor.js` se necessário
5. Atualizar documentação
6. Submeter PR com título: `feat(simulator): add [scenario-name]`

## Licença

Propriedade de AUREON ERP © 2024
