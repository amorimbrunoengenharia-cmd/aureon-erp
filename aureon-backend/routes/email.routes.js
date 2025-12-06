import express from 'express';
import emailService from '../services/emailService.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * POST /api/email/test
 * Envia email de teste
 * Requer role CEO
 */
router.post('/test', authorize('CEO'), async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const html = `
      <h1>Email de Teste - AUREON ERP</h1>
      <p>${message || 'Este é um email de teste do sistema AUREON ERP.'}</p>
      <p><strong>Enviado por:</strong> ${req.user.username}</p>
      <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    `;

    const result = await emailService.sendEmail({
      to,
      subject: subject || 'Teste - AUREON ERP',
      html
    });

    res.json({
      message: 'Test email sent',
      ...result
    });
  } catch (error) {
    logger.error('Error in POST /api/email/test:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

/**
 * POST /api/email/welcome
 * Envia email de boas-vindas
 * Requer role CEO
 */
router.post('/welcome', authorize('CEO'), async (req, res) => {
  try {
    const { userId, email, username, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await emailService.sendWelcomeEmail({
      id: userId,
      email,
      username: username || 'Usuário',
      role: role || 'USER'
    });

    res.json({
      message: 'Welcome email sent',
      ...result
    });
  } catch (error) {
    logger.error('Error in POST /api/email/welcome:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

/**
 * POST /api/email/order-confirmation
 * Envia email de confirmação de pedido
 */
router.post('/order-confirmation', async (req, res) => {
  try {
    const { saleId, sale, client } = req.body;

    if (!sale || !client || !client.email) {
      return res.status(400).json({ error: 'Sale and client data with email are required' });
    }

    const result = await emailService.sendOrderConfirmation(sale, client);

    res.json({
      message: 'Order confirmation email sent',
      ...result
    });
  } catch (error) {
    logger.error('Error in POST /api/email/order-confirmation:', error);
    res.status(500).json({ error: 'Failed to send order confirmation' });
  }
});

/**
 * POST /api/email/low-stock-alert
 * Envia alerta de estoque baixo
 * Requer role CEO ou ESTOQUE
 */
router.post('/low-stock-alert', authorize('CEO', 'ESTOQUE'), async (req, res) => {
  try {
    const { products, recipient } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    if (!recipient) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const result = await emailService.sendLowStockAlert(products, recipient);

    res.json({
      message: 'Low stock alert sent',
      ...result
    });
  } catch (error) {
    logger.error('Error in POST /api/email/low-stock-alert:', error);
    res.status(500).json({ error: 'Failed to send low stock alert' });
  }
});

/**
 * POST /api/email/payment-reminder
 * Envia lembrete de pagamento
 * Requer role CEO ou FINANCEIRO
 */
router.post('/payment-reminder', authorize('CEO', 'FINANCEIRO'), async (req, res) => {
  try {
    const { client, transaction } = req.body;

    if (!client || !client.email) {
      return res.status(400).json({ error: 'Client data with email is required' });
    }

    if (!transaction) {
      return res.status(400).json({ error: 'Transaction data is required' });
    }

    const result = await emailService.sendPaymentReminder(client, transaction);

    res.json({
      message: 'Payment reminder sent',
      ...result
    });
  } catch (error) {
    logger.error('Error in POST /api/email/payment-reminder:', error);
    res.status(500).json({ error: 'Failed to send payment reminder' });
  }
});

/**
 * POST /api/email/backup-notification
 * Envia notificação de backup
 * Requer role CEO
 */
router.post('/backup-notification', authorize('CEO'), async (req, res) => {
  try {
    const { result, recipient } = req.body;

    if (!result) {
      return res.status(400).json({ error: 'Backup result is required' });
    }

    if (!recipient) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    const emailResult = await emailService.sendBackupNotification(result, recipient);

    res.json({
      message: 'Backup notification sent',
      ...emailResult
    });
  } catch (error) {
    logger.error('Error in POST /api/email/backup-notification:', error);
    res.status(500).json({ error: 'Failed to send backup notification' });
  }
});

/**
 * GET /api/email/status
 * Verifica status do serviço de email
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      configured: emailService.isConfigured,
      message: emailService.isConfigured
        ? 'Email service is configured and ready'
        : 'Email service is not configured. Set SMTP credentials in .env file.'
    });
  } catch (error) {
    logger.error('Error in GET /api/email/status:', error);
    res.status(500).json({ error: 'Failed to check email service status' });
  }
});

export default router;
