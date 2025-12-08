/**
 * User Settings & LocalStorage Migration Routes
 */

import express from 'express';
import localStorageService from '../services/localStorage.service.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * GET /api/settings
 * Retorna configurações do usuário autenticado
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const settings = await localStorageService.getUserSettings(req.user.id);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/settings
 * Salva configurações do usuário
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const settings = await localStorageService.saveUserSettings(req.user.id, req.body);
    
    res.json({
      success: true,
      message: 'Settings saved successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings
 * Atualiza configurações (mesmo que POST)
 */
router.put('/', authenticate, async (req, res, next) => {
  try {
    const settings = await localStorageService.saveUserSettings(req.user.id, req.body);
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/settings/migrate
 * Migra dados de localStorage para o banco
 */
router.post('/migrate', authenticate, async (req, res, next) => {
  try {
    const { localStorageData } = req.body;
    
    if (!localStorageData) {
      return res.status(400).json({
        success: false,
        error: 'localStorageData is required'
      });
    }

    const results = await localStorageService.migrateUserData(req.user.id, localStorageData);
    
    res.json({
      success: true,
      message: 'Data migrated successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
});

export default router;
