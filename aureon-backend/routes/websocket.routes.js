/**
 * WebSocket Stats & Control Routes
 */

import express from 'express';
import wsService from '../services/websocket.service.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';

const router = express.Router();

/**
 * GET /api/ws/stats
 * Estatísticas de conexões WebSocket
 */
router.get('/stats', authenticate, authorize(['admin', 'gerente']), (req, res) => {
  try {
    const stats = wsService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ws/broadcast/tenant
 * Broadcast para tenant específico
 */
router.post('/broadcast/tenant', authenticate, authorize(['admin']), (req, res) => {
  try {
    const { tenantId, event, data } = req.body;
    
    if (!tenantId || !event || !data) {
      return res.status(400).json({
        success: false,
        error: 'tenantId, event, and data are required'
      });
    }

    wsService.broadcastToTenant(tenantId, event, data);
    
    res.json({
      success: true,
      message: `Broadcast sent to tenant ${tenantId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ws/send/user
 * Enviar mensagem para usuário específico
 */
router.post('/send/user', authenticate, authorize(['admin']), (req, res) => {
  try {
    const { userId, event, data } = req.body;
    
    if (!userId || !event || !data) {
      return res.status(400).json({
        success: false,
        error: 'userId, event, and data are required'
      });
    }

    wsService.sendToUser(userId, event, data);
    
    res.json({
      success: true,
      message: `Message sent to user ${userId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ws/disconnect/user
 * Desconectar usuário específico
 */
router.post('/disconnect/user', authenticate, authorize(['admin']), (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    wsService.disconnectUser(userId, reason || 'Admin disconnect');
    
    res.json({
      success: true,
      message: `User ${userId} disconnected`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
