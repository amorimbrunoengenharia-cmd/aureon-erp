# Integração do PrescriptionAttachmentUpload

## Visão Geral

O componente `PrescriptionAttachmentUpload.jsx` foi criado para adicionar funcionalidade de OCR ao gerenciador de prescrições. Este guia mostra como integrá-lo ao `PrescriptionManager.jsx` existente.

## Localização

- **Componente**: `aureon-os/src/components/PrescriptionAttachmentUpload.jsx`
- **Integrar em**: `aureon-os/src/pages/PrescriptionManager.jsx`

## Passo 1: Importar o Componente

No início de `PrescriptionManager.jsx`, adicione:

```javascript
import PrescriptionAttachmentUpload from '../components/PrescriptionAttachmentUpload';
```

## Passo 2: Adicionar Estado para OCR

Adicione novos estados ao componente:

```javascript
const [showOCRUpload, setShowOCRUpload] = useState(false);
const [ocrData, setOcrData] = useState(null);
```

## Passo 3: Adicionar Botão de Upload

No modal de criação/edição de prescrição, adicione um botão para ativar o OCR:

```jsx
{/* Dentro do modal de prescrição */}
<div className="ocr-upload-section">
  <button
    type="button"
    onClick={() => setShowOCRUpload(true)}
    className="btn-ocr-upload"
  >
    📷 Escanear Receita
  </button>
  
  {showOCRUpload && (
    <PrescriptionAttachmentUpload
      onParseComplete={(result) => {
        setOcrData(result);
        autofillFormWithOCR(result.parsed);
        setShowOCRUpload(false);
      }}
      onCancel={() => setShowOCRUpload(false)}
    />
  )}
</div>
```

## Passo 4: Implementar Auto-fill

Crie função para preencher formulário com dados OCR:

```javascript
const autofillFormWithOCR = (parsedData) => {
  // Atualizar cliente
  if (parsedData.cliente_nome) {
    // Buscar ou criar cliente com este nome
    // Você pode implementar busca automática ou sugerir criação
    console.log('Cliente extraído:', parsedData.cliente_nome);
  }
  
  // Preencher médico
  setFormData(prev => ({
    ...prev,
    medico_nome: parsedData.medico_nome || prev.medico_nome,
    medico_crm: parsedData.medico_crm || prev.medico_crm,
    medico_uf: parsedData.medico_uf || prev.medico_uf,
  }));
  
  // Preencher OD (Olho Direito)
  if (parsedData.od) {
    setFormData(prev => ({
      ...prev,
      od: {
        esferico: parsedData.od.esferico ?? prev.od?.esferico,
        cilindrico: parsedData.od.cilindrico ?? prev.od?.cilindrico,
        eixo: parsedData.od.eixo ?? prev.od?.eixo,
        dnp: parsedData.od.dnp ?? prev.od?.dnp,
        adicao: parsedData.od.adicao ?? prev.od?.adicao,
      }
    }));
  }
  
  // Preencher OE (Olho Esquerdo)
  if (parsedData.oe) {
    setFormData(prev => ({
      ...prev,
      oe: {
        esferico: parsedData.oe.esferico ?? prev.oe?.esferico,
        cilindrico: parsedData.oe.cilindrico ?? prev.oe?.cilindrico,
        eixo: parsedData.oe.eixo ?? prev.oe?.eixo,
        dnp: parsedData.oe.dnp ?? prev.oe?.dnp,
        adicao: parsedData.oe.adicao ?? prev.oe?.adicao,
      }
    }));
  }
  
  // Preencher tipo de lente
  if (parsedData.tipo_lente) {
    setFormData(prev => ({
      ...prev,
      tipo_lente: parsedData.tipo_lente
    }));
  }
  
  // Preencher datas
  if (parsedData.data_emissao) {
    setFormData(prev => ({
      ...prev,
      data_emissao: parsedData.data_emissao
    }));
  }
  
  // Adicionar observação sobre OCR
  setFormData(prev => ({
    ...prev,
    observacoes: (prev.observacoes || '') + 
      `\n[OCR] Confidence: ${(ocrData.confidence * 100).toFixed(1)}%`
  }));
  
  // Mostrar notificação de sucesso
  alert('Dados extraídos com sucesso! Verifique os campos antes de salvar.');
};
```

## Passo 5: Adicionar Estilos

Adicione ao seu CSS:

```css
.ocr-upload-section {
  margin: 20px 0;
  padding: 15px;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
}

.btn-ocr-upload {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-ocr-upload:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.btn-ocr-upload:active {
  transform: translateY(0);
}
```

## Passo 6: Atualizar Backend Service

Se você estiver usando `PrescriptionService.js` (localStorage), atualize para usar a API backend:

```javascript
// Trocar de:
const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');

// Para:
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

class PrescriptionService {
  async getAll() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/prescriptions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
  
  async create(data) {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/prescriptions`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
  
  async update(id, data) {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_BASE_URL}/prescriptions/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
  
  async getPatientHistory(patientId, page = 1, limit = 50) {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_BASE_URL}/patients/${patientId}/history?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
  
  async checkRapidProgression(patientId) {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_BASE_URL}/patients/${patientId}/progression-check`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
}

export default new PrescriptionService();
```

## Passo 7: Adicionar Validação de Confidence

Implemente avisos visuais baseados na confiança do OCR:

```jsx
{ocrData && (
  <div className={`ocr-confidence-banner ${
    ocrData.confidence >= 0.8 ? 'high' : 
    ocrData.confidence >= 0.6 ? 'medium' : 'low'
  }`}>
    <strong>OCR Confidence: {(ocrData.confidence * 100).toFixed(1)}%</strong>
    {ocrData.confidence < 0.7 && (
      <p>⚠️ Confiança baixa. Verifique todos os campos manualmente.</p>
    )}
  </div>
)}
```

Adicione estilos:

```css
.ocr-confidence-banner {
  padding: 12px;
  margin: 10px 0;
  border-radius: 6px;
  font-size: 14px;
}

.ocr-confidence-banner.high {
  background-color: #d1fae5;
  border-left: 4px solid #10b981;
  color: #065f46;
}

.ocr-confidence-banner.medium {
  background-color: #fef3c7;
  border-left: 4px solid #f59e0b;
  color: #92400e;
}

.ocr-confidence-banner.low {
  background-color: #fee2e2;
  border-left: 4px solid #ef4444;
  color: #991b1b;
}
```

## Passo 8: Adicionar Histórico do Paciente

Crie um botão para visualizar o histórico completo:

```jsx
<button
  type="button"
  onClick={() => viewPatientHistory(formData.cliente_id)}
  disabled={!formData.cliente_id}
  className="btn-view-history"
>
  📋 Ver Histórico do Paciente
</button>
```

Implemente a função:

```javascript
const viewPatientHistory = async (patientId) => {
  try {
    const historyData = await PrescriptionService.getPatientHistory(patientId);
    
    // Verificar progressão rápida
    const progressionCheck = await PrescriptionService.checkRapidProgression(patientId);
    
    if (progressionCheck.flagged) {
      alert(`⚠️ ALERTA: ${progressionCheck.reason}\n` +
            `Mudança OD: ${progressionCheck.od_change}D\n` +
            `Mudança OE: ${progressionCheck.oe_change}D`);
    }
    
    // Mostrar modal com histórico
    setPatientHistoryData(historyData);
    setShowHistoryModal(true);
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    alert('Erro ao carregar histórico do paciente');
  }
};
```

## Exemplo Completo de Integração

```jsx
import React, { useState, useEffect } from 'react';
import PrescriptionAttachmentUpload from '../components/PrescriptionAttachmentUpload';
import PrescriptionService from '../services/PrescriptionService';

function PrescriptionManager() {
  const [showOCRUpload, setShowOCRUpload] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [formData, setFormData] = useState({
    cliente_id: '',
    od: { esferico: 0, cilindrico: 0, eixo: 0, dnp: 0, adicao: 0 },
    oe: { esferico: 0, cilindrico: 0, eixo: 0, dnp: 0, adicao: 0 },
    tipo_lente: 'Monofocal',
    medico_nome: '',
    medico_crm: '',
    medico_uf: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_validade: '',
    observacoes: '',
    lgpd_consentimento: false
  });

  const autofillFormWithOCR = (parsedData) => {
    setFormData(prev => ({
      ...prev,
      medico_nome: parsedData.medico_nome || prev.medico_nome,
      medico_crm: parsedData.medico_crm || prev.medico_crm,
      medico_uf: parsedData.medico_uf || prev.medico_uf,
      od: parsedData.od || prev.od,
      oe: parsedData.oe || prev.oe,
      tipo_lente: parsedData.tipo_lente || prev.tipo_lente,
      data_emissao: parsedData.data_emissao || prev.data_emissao,
      observacoes: (prev.observacoes || '') + 
        `\n[OCR] Confidence: ${(ocrData.confidence * 100).toFixed(1)}%`
    }));
    
    alert('Dados extraídos! Verifique os campos antes de salvar.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (formData.id) {
        await PrescriptionService.update(formData.id, formData);
      } else {
        await PrescriptionService.create(formData);
      }
      
      alert('Prescrição salva com sucesso!');
      // Recarregar lista de prescrições
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar prescrição');
    }
  };

  return (
    <div className="prescription-manager">
      <form onSubmit={handleSubmit}>
        
        {/* Seção de OCR */}
        <div className="ocr-upload-section">
          <button
            type="button"
            onClick={() => setShowOCRUpload(true)}
            className="btn-ocr-upload"
          >
            📷 Escanear Receita
          </button>
          
          {showOCRUpload && (
            <PrescriptionAttachmentUpload
              onParseComplete={(result) => {
                setOcrData(result);
                autofillFormWithOCR(result.parsed);
                setShowOCRUpload(false);
              }}
              onCancel={() => setShowOCRUpload(false)}
            />
          )}
        </div>

        {/* Banner de confiança OCR */}
        {ocrData && (
          <div className={`ocr-confidence-banner ${
            ocrData.confidence >= 0.8 ? 'high' : 
            ocrData.confidence >= 0.6 ? 'medium' : 'low'
          }`}>
            <strong>OCR Confidence: {(ocrData.confidence * 100).toFixed(1)}%</strong>
            {ocrData.confidence < 0.7 && (
              <p>⚠️ Confiança baixa. Verifique todos os campos.</p>
            )}
          </div>
        )}

        {/* Resto do formulário existente */}
        {/* ... campos de médico, OD, OE, etc ... */}

        <button type="submit">Salvar Prescrição</button>
      </form>
    </div>
  );
}

export default PrescriptionManager;
```

## Testes

### 1. Teste Manual
```bash
# Iniciar backend
cd aureon-backend
npm start

# Iniciar frontend
cd aureon-os
npm run dev
```

1. Abrir http://localhost:3000/prescriptions
2. Clicar em "Escanear Receita"
3. Fazer upload de imagem de prescrição
4. Verificar auto-fill dos campos
5. Salvar prescrição

### 2. Teste de Confidence
- Upload de imagem boa qualidade → confidence ≥ 0.8 (verde)
- Upload de imagem média → confidence ≥ 0.6 (amarelo)
- Upload de imagem ruim → confidence < 0.6 (vermelho)

### 3. Teste de Trace ID
```sql
-- Verificar correlação após criar prescrição via OCR
SELECT 
  'prescriptions' as table_name, id, trace_id 
FROM prescriptions 
WHERE metadata->>'source' = 'ocr'
ORDER BY created_at DESC LIMIT 1;

SELECT 
  'events' as table_name, event_type, trace_id 
FROM events 
WHERE trace_id = '<trace_id_from_above>'
ORDER BY created_at;
```

## Troubleshooting

### Erro: "Cannot read property 'parsed' of undefined"
**Causa**: API retornou erro ou timeout  
**Solução**: Verificar console do backend, aumentar timeout

### Erro: "CORS policy: No 'Access-Control-Allow-Origin'"
**Causa**: CORS não configurado no backend  
**Solução**: Adicionar em `aureon-backend/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### OCR não extraindo dados
**Causa**: Imagem incompatível ou Tesseract não instalado  
**Solução**: 
```bash
cd aureon-backend
npm install tesseract.js sharp
```

## Próximos Passos

1. **Integração com Context API**: Mover estado para `PrescriptionContext.jsx`
2. **Histórico Visual**: Componente timeline de prescrições
3. **Alertas de Progressão**: Notificações in-app
4. **Busca de Cliente**: Auto-complete no campo cliente
5. **Preview de Imagem**: Mostrar imagem ao lado do formulário

## Referências

- [Tesseract.js Docs](https://tesseract.projectnaptha.com/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Sequelize ORM](https://sequelize.org/)
- [UUID RFC4122](https://datatracker.ietf.org/doc/html/rfc4122)
