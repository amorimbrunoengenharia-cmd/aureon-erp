import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader } from 'lucide-react';

/**
 * PRESCRIPTION ATTACHMENT UPLOAD COMPONENT
 * Upload and OCR parsing of prescription files with confidence indicators
 */
export default function PrescriptionAttachmentUpload({ onParseComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Formato de arquivo não suportado. Use JPEG, PNG, TIFF ou PDF.');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    
    // Auto-upload and parse
    await uploadAndParse(selectedFile);
  };

  const uploadAndParse = async (fileToUpload) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch('/api/prescriptions/parse-attachment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar arquivo');
      }

      const result = await response.json();
      setParseResult(result.data);

      // Notify parent component
      if (onParseComplete) {
        onParseComplete(result.data);
      }
    } catch (err) {
      setError(err.message || 'Erro ao processar arquivo');
      setParseResult(null);
    } finally {
      setUploading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) return { text: 'Alta', color: 'bg-green-100 text-green-800' };
    if (confidence >= 0.6) return { text: 'Média', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Baixa', color: 'bg-red-100 text-red-800' };
  };

  const formatFieldName = (field) => {
    const names = {
      'cliente_nome': 'Nome do Paciente',
      'medico_nome': 'Nome do Médico',
      'medico_crm': 'CRM',
      'medico_uf': 'UF',
      'data_emissao': 'Data de Emissão',
      'od.esferico': 'OD Esférico',
      'od.cilindrico': 'OD Cilíndrico',
      'od.eixo': 'OD Eixo',
      'od.dnp': 'OD DNP',
      'od.adicao': 'OD Adição',
      'oe.esferico': 'OE Esférico',
      'oe.cilindrico': 'OE Cilíndrico',
      'oe.eixo': 'OE Eixo',
      'oe.dnp': 'OE DNP',
      'oe.adicao': 'OE Adição',
      'tipo_lente': 'Tipo de Lente'
    };
    return names[field] || field;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="prescription-upload"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <label
          htmlFor="prescription-upload"
          className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
        >
          <div className="flex flex-col items-center space-y-2">
            {uploading ? (
              <Loader className="w-12 h-12 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {uploading ? 'Processando...' : 'Clique para fazer upload'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, JPEG, PNG ou TIFF (máx. 10MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erro</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Parse Result Preview */}
      {parseResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Dados Extraídos</h3>
              <p className="text-sm text-gray-500 mt-1">
                Arquivo: {file?.name}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceBadge(parseResult.confidence).color}`}>
                Confiança {getConfidenceBadge(parseResult.confidence).text} ({Math.round(parseResult.confidence * 100)}%)
              </span>
            </div>
          </div>

          {/* Parsed Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Patient Info */}
            {parseResult.parsed.cliente_nome && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 uppercase">Paciente</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{parseResult.parsed.cliente_nome}</p>
              </div>
            )}

            {/* Doctor Info */}
            {parseResult.parsed.medico_nome && (
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Médico</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{parseResult.parsed.medico_nome}</p>
              </div>
            )}
            {parseResult.parsed.medico_crm && (
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">CRM</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {parseResult.parsed.medico_crm}
                  {parseResult.parsed.medico_uf && ` / ${parseResult.parsed.medico_uf}`}
                </p>
              </div>
            )}

            {/* Date */}
            {parseResult.parsed.data_emissao && (
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Data de Emissão</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {new Date(parseResult.parsed.data_emissao).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {/* Lens Type */}
            {parseResult.parsed.tipo_lente && (
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Tipo de Lente</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{parseResult.parsed.tipo_lente}</p>
              </div>
            )}
          </div>

          {/* Eye Data */}
          <div className="grid grid-cols-2 gap-4">
            {/* OD */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">OD (Olho Direito)</h4>
              <div className="space-y-2 text-xs">
                {parseResult.parsed.od.esferico !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Esférico:</span>
                    <span className="font-medium text-gray-900">{parseResult.parsed.od.esferico}</span>
                  </div>
                )}
                {parseResult.parsed.od.cilindrico !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cilíndrico:</span>
                    <span className="font-medium text-gray-900">{parseResult.parsed.od.cilindrico}</span>
                  </div>
                )}
                {parseResult.parsed.od.eixo !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Eixo:</span>
                    <span className="font-medium text-gray-900">{parseResult.parsed.od.eixo}°</span>
                  </div>
                )}
                {parseResult.parsed.od.dnp !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">DNP:</span>
                    <span className="font-medium text-gray-900">{parseResult.parsed.od.dnp}mm</span>
                  </div>
                )}
                {parseResult.parsed.od.adicao !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adição:</span>
                    <span className="font-medium text-gray-900">+{parseResult.parsed.od.adicao}</span>
                  </div>
                )}
              </div>
            </div>

            {/* OE */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-3">OE (Olho Esquerdo)</h4>
              <div className="space-y-2 text-xs">
                {parseResult.parsed.oe.esferico !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Esférico:</span>
                    <span className="font-medium text-gray-900">{parseResult.parsed.oe.esferico}</span>
                  </div>
                )}
                {parseResult.parsed.oe.cilindrico !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cilíndrico:</span>
                    <span className="font-medium text-gray-900">{parseResult.parsed.oe.cilindrico}</span>
                  </div>
                )}
                {parseResult.parsed.oe.eixo !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Eixo:</span>
                    <span className="font-medium text-gray-900">{parseResult.parsed.oe.eixo}°</span>
                  </div>
                )}
                {parseResult.parsed.oe.dnp !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">DNP:</span>
                    <span className="font-medium text-gray-900">{parseResult.parsed.oe.dnp}mm</span>
                  </div>
                )}
                {parseResult.parsed.oe.adicao !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adição:</span>
                    <span className="font-medium text-gray-900">+{parseResult.parsed.oe.adicao}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {parseResult.suggestions && parseResult.suggestions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Sugestões e Alertas
              </h4>
              <ul className="space-y-2">
                {parseResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-yellow-800 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={() => {
                setFile(null);
                setParseResult(null);
                setError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reprocessar
            </button>
            <div className="flex space-x-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  // Parent component will handle this via onParseComplete
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aceitar e Preencher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
