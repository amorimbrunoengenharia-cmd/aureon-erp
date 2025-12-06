import express from 'express';
import backupService from '../services/backupService.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * POST /api/backup/create
 * Cria backup completo do banco de dados
 * Requer role CEO
 */
router.post('/create', authorize('CEO'), async (req, res) => {
  try {
    logger.info('📦 Iniciando criação de backup', { user: req.user.username });

    const result = await backupService.createFullBackup();

    res.json({
      message: 'Backup criado com sucesso',
      ...result
    });
  } catch (error) {
    logger.error('Erro em POST /api/backup/create:', error);
    res.status(500).json({ error: 'Erro ao criar backup' });
  }
});

/**
 * POST /api/backup/restore/:filename
 * Restaura backup do banco de dados
 * Requer role CEO
 */
router.post('/restore/:filename', authorize('CEO'), async (req, res) => {
  try {
    const { filename } = req.params;
    const { clearExisting = true, ignoreDuplicates = false, continueOnError = false } = req.body;

    logger.warn('⚠️ Iniciando restore de backup', {
      user: req.user.username,
      filename,
      clearExisting
    });

    const result = await backupService.restoreFullBackup(filename, {
      clearExisting,
      ignoreDuplicates,
      continueOnError
    });

    res.json({
      message: 'Backup restaurado com sucesso',
      ...result
    });
  } catch (error) {
    logger.error('Erro em POST /api/backup/restore:', error);
    res.status(500).json({ error: error.message || 'Erro ao restaurar backup' });
  }
});

/**
 * GET /api/backup/list
 * Lista todos os backups disponíveis
 * Requer role CEO
 */
router.get('/list', authorize('CEO'), async (req, res) => {
  try {
    const backups = await backupService.listBackups();

    res.json({
      count: backups.length,
      backups
    });
  } catch (error) {
    logger.error('Erro em GET /api/backup/list:', error);
    res.status(500).json({ error: 'Erro ao listar backups' });
  }
});

/**
 * DELETE /api/backup/:filename
 * Remove um backup específico
 * Requer role CEO
 */
router.delete('/:filename', authorize('CEO'), async (req, res) => {
  try {
    const { filename } = req.params;

    logger.warn('🗑️ Removendo backup', {
      user: req.user.username,
      filename
    });

    const result = await backupService.deleteBackup(filename);

    res.json({
      message: 'Backup removido com sucesso',
      ...result
    });
  } catch (error) {
    logger.error('Erro em DELETE /api/backup:', error);
    res.status(500).json({ error: error.message || 'Erro ao remover backup' });
  }
});

/**
 * POST /api/backup/cleanup
 * Remove backups antigos (mantém apenas os N mais recentes)
 * Requer role CEO
 */
router.post('/cleanup', authorize('CEO'), async (req, res) => {
  try {
    const { keepCount = 10 } = req.body;

    logger.info('🧹 Limpando backups antigos', {
      user: req.user.username,
      keepCount
    });

    const result = await backupService.cleanupOldBackups(keepCount);

    res.json({
      message: `${result.removed} backups removidos, ${result.kept} mantidos`,
      ...result
    });
  } catch (error) {
    logger.error('Erro em POST /api/backup/cleanup:', error);
    res.status(500).json({ error: 'Erro ao limpar backups' });
  }
});

/**
 * POST /api/backup/incremental
 * Cria backup incremental desde uma data específica
 * Requer role CEO
 */
router.post('/incremental', authorize('CEO'), async (req, res) => {
  try {
    const { since } = req.body;

    if (!since) {
      return res.status(400).json({ error: 'Parâmetro "since" é obrigatório' });
    }

    logger.info('📦 Criando backup incremental', {
      user: req.user.username,
      since
    });

    const result = await backupService.createIncrementalBackup(since);

    res.json({
      message: 'Backup incremental criado com sucesso',
      ...result
    });
  } catch (error) {
    logger.error('Erro em POST /api/backup/incremental:', error);
    res.status(500).json({ error: 'Erro ao criar backup incremental' });
  }
});

/**
 * GET /api/backup/download/:filename
 * Faz download de um backup
 * Requer role CEO
 */
router.get('/download/:filename', authorize('CEO'), async (req, res) => {
  try {
    const { filename } = req.params;
    const backups = await backupService.listBackups();
    const backup = backups.find(b => b.filename === filename);

    if (!backup) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    logger.info('⬇️ Download de backup', {
      user: req.user.username,
      filename
    });

    res.download(backup.filepath, filename);
  } catch (error) {
    logger.error('Erro em GET /api/backup/download:', error);
    res.status(500).json({ error: 'Erro ao fazer download do backup' });
  }
});

export default router;
