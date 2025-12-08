import React, { useState, useEffect } from 'react';
import ApiService from '../services/ApiService';

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const data = await ApiService.listBackups();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      showMessage('Erro ao carregar lista de backups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!confirm('Deseja criar um backup completo do banco de dados?')) {
      return;
    }

    setCreating(true);
    try {
      const result = await ApiService.createBackup();
      showMessage(
        `Backup criado com sucesso! ${result.metadata.total_records} registros (${result.size_mb} MB)`,
        'success'
      );
      loadBackups();
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      showMessage('Erro ao criar backup', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async (filename) => {
    if (!confirm(
      `⚠️ ATENÇÃO: Esta ação irá SUBSTITUIR TODOS OS DADOS atuais pelo backup "${filename}".\n\n` +
      'Esta operação NÃO pode ser desfeita!\n\n' +
      'Deseja continuar?'
    )) {
      return;
    }

    // Segunda confirmação
    const confirmText = prompt(
      'Digite "CONFIRMAR" (em maiúsculas) para prosseguir com o restore:'
    );

    if (confirmText !== 'CONFIRMAR') {
      showMessage('Restore cancelado', 'info');
      return;
    }

    setLoading(true);
    try {
      const result = await ApiService.restoreBackup(filename, {
        clearExisting: true,
        ignoreDuplicates: false,
        continueOnError: false
      });
      
      showMessage(
        `Backup restaurado com sucesso! ${result.total_imported} registros importados`,
        'success'
      );
      
      // Recarregar página após restore
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      showMessage(error.message || 'Erro ao restaurar backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async (filename) => {
    try {
      await ApiService.downloadBackup(filename);
      showMessage(`Download de ${filename} iniciado`, 'success');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      showMessage('Erro ao fazer download do backup', 'error');
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!confirm(`Deseja realmente remover o backup "${filename}"?`)) {
      return;
    }

    try {
      await ApiService.deleteBackup(filename);
      showMessage('Backup removido com sucesso', 'success');
      loadBackups();
    } catch (error) {
      console.error('Erro ao remover backup:', error);
      showMessage('Erro ao remover backup', 'error');
    }
  };

  const handleCleanupOld = async () => {
    const keepCount = prompt('Quantos backups deseja manter? (padrão: 10)', '10');
    
    if (!keepCount) return;

    try {
      const result = await ApiService.cleanupOldBackups(parseInt(keepCount));
      showMessage(
        `${result.removed} backups removidos, ${result.kept} mantidos`,
        'success'
      );
      loadBackups();
    } catch (error) {
      console.error('Erro ao limpar backups:', error);
      showMessage('Erro ao limpar backups antigos', 'error');
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const formatBytes = (bytes) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">💾 Gerenciamento de Backups</h1>
        <p className="text-gray-600">Crie, restaure e gerencie backups do banco de dados</p>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
          message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Ações */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Ações</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creating ? (
              <>
                <span className="animate-spin">⏳</span>
                Criando Backup...
              </>
            ) : (
              <>
                📦 Criar Backup Completo
              </>
            )}
          </button>

          <button
            onClick={loadBackups}
            disabled={loading}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:bg-gray-400"
          >
            🔄 Atualizar Lista
          </button>

          <button
            onClick={handleCleanupOld}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            🧹 Limpar Backups Antigos
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Aviso:</strong> O backup completo pode levar alguns segundos dependendo do tamanho do banco de dados.
            Backups são salvos localmente no servidor em <code className="bg-yellow-100 px-1 rounded">aureon-backend/backups/</code>
          </p>
        </div>
      </div>

      {/* Lista de Backups */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Backups Disponíveis ({backups.length})
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-600">
            Carregando backups...
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum backup encontrado. Crie o primeiro backup!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nome do Arquivo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Criado em</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Tamanho</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Registros</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backups.map((backup, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{backup.filename}</div>
                      {backup.metadata && (
                        <div className="text-xs text-gray-500">
                          {backup.metadata.tables} tabelas • {backup.metadata.database_type}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(backup.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {backup.size_mb} MB
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {backup.metadata?.total_records?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleDownloadBackup(backup.filename)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                          title="Download"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => handleRestoreBackup(backup.filename)}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
                          title="Restaurar"
                        >
                          ♻️
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.filename)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                          title="Remover"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="mt-6 bg-blue-50 border border-blue-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">ℹ️ Informações Importantes</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ <strong>Backup Completo:</strong> Exporta TODOS os dados do banco (usuários, produtos, vendas, etc)</li>
          <li>✓ <strong>Restore:</strong> SUBSTITUI todos os dados atuais - use com cautela!</li>
          <li>✓ <strong>Download:</strong> Salve backups localmente para maior segurança</li>
          <li>✓ <strong>Automação:</strong> Configure backups automáticos via cron no servidor</li>
          <li>⚠️ <strong>Atenção:</strong> Backups salvos no servidor podem ser perdidos se o servidor for resetado</li>
        </ul>
      </div>
    </div>
  );
};

export default BackupManager;
