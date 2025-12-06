import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

/**
 * Email Service
 * Handles all email sending operations
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  initialize() {
    try {
      const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      // Check if credentials are configured
      if (!config.auth.user || !config.auth.pass) {
        logger.warn('⚠️ SMTP credentials not configured. Email service disabled.');
        logger.info('💡 Set SMTP_USER and SMTP_PASS in .env to enable emails');
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('❌ Email service error:', error);
          this.isConfigured = false;
        } else {
          logger.info('✅ Email service ready');
        }
      });
    } catch (error) {
      logger.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content (optional)
   * @param {Array} options.attachments - Attachments (optional)
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.isConfigured) {
      logger.warn('Email service not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'AUREON ERP'} <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`📧 Email sent successfully to ${to}: ${subject}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      logger.error(`❌ Failed to send email to ${to}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simple HTML to text converter
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const html = this.getWelcomeTemplate(user);

    return this.sendEmail({
      to: user.email,
      subject: '🎉 Bem-vindo ao AUREON ERP',
      html
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(sale, client) {
    const html = this.getOrderConfirmationTemplate(sale, client);

    return this.sendEmail({
      to: client.email,
      subject: `✅ Pedido #${sale.id.substring(0, 8)} confirmado`,
      html
    });
  }

  /**
   * Send low stock alert email
   */
  async sendLowStockAlert(products, recipient) {
    const html = this.getLowStockAlertTemplate(products);

    return this.sendEmail({
      to: recipient,
      subject: '⚠️ Alerta de Estoque Baixo - AUREON ERP',
      html
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    const html = this.getPasswordResetTemplate(user, resetToken);

    return this.sendEmail({
      to: user.email,
      subject: '🔐 Redefinição de Senha - AUREON ERP',
      html
    });
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(client, transaction) {
    const html = this.getPaymentReminderTemplate(client, transaction);

    return this.sendEmail({
      to: client.email,
      subject: '💰 Lembrete de Pagamento - AUREON ERP',
      html
    });
  }

  /**
   * Send backup notification email
   */
  async sendBackupNotification(result, recipient) {
    const html = this.getBackupNotificationTemplate(result);

    return this.sendEmail({
      to: recipient,
      subject: '💾 Backup Concluído - AUREON ERP',
      html
    });
  }

  // ===== EMAIL TEMPLATES =====

  getWelcomeTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao AUREON ERP!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.username}</strong>,</p>
            <p>Sua conta foi criada com sucesso! Estamos felizes em tê-lo conosco.</p>
            <p><strong>Detalhes da conta:</strong></p>
            <ul>
              <li>Usuário: ${user.username}</li>
              <li>Email: ${user.email}</li>
              <li>Role: ${user.role}</li>
            </ul>
            <p>Você já pode começar a usar todas as funcionalidades do sistema.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Acessar Sistema</a>
          </div>
          <div class="footer">
            <p>AUREON ERP - Sistema de Gestão Empresarial</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getOrderConfirmationTemplate(sale, client) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .total { font-size: 24px; font-weight: bold; color: #10b981; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pedido Confirmado!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${client.nome}</strong>,</p>
            <p>Seu pedido foi confirmado e está sendo processado.</p>
            <div class="order-details">
              <h3>Detalhes do Pedido</h3>
              <p><strong>Número:</strong> #${sale.id.substring(0, 8)}</p>
              <p><strong>Produto:</strong> ${sale.produto}</p>
              <p><strong>Quantidade:</strong> ${sale.quantidade}</p>
              <p><strong>Data:</strong> ${new Date(sale.data_venda).toLocaleDateString('pt-BR')}</p>
              <p><strong>Canal:</strong> ${sale.canal_venda}</p>
              <p><strong>Pagamento:</strong> ${sale.forma_pagamento}</p>
              <div class="total">Total: R$ ${parseFloat(sale.valor_venda).toFixed(2)}</div>
            </div>
            <p>Em breve você receberá atualizações sobre o andamento do seu pedido.</p>
          </div>
          <div class="footer">
            <p>AUREON ERP - Obrigado pela preferência!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getLowStockAlertTemplate(products) {
    const productRows = products.map(p => `
      <tr>
        <td>${p.produto}</td>
        <td style="text-align: center; color: ${p.quantidade_estoque < 5 ? 'red' : 'orange'}">
          ${p.quantidade_estoque}
        </td>
        <td style="text-align: center;">${p.quantidade_minima || 10}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; }
          th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
          th { background: #f3f4f6; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta de Estoque Baixo</h1>
          </div>
          <div class="content">
            <p>Os seguintes produtos estão com estoque baixo e precisam de reposição:</p>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style="text-align: center;">Estoque Atual</th>
                  <th style="text-align: center;">Estoque Mínimo</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>
            <p><strong>Ação recomendada:</strong> Realize pedidos de reposição para evitar rupturas de estoque.</p>
          </div>
          <div class="footer">
            <p>AUREON ERP - Sistema de Alertas Automáticos</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Redefinição de Senha</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${user.username}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
            <p style="font-size: 12px; color: #666;">
              Ou copie e cole este link no seu navegador:<br>
              ${resetUrl}
            </p>
            <div class="warning">
              <p><strong>⚠️ Importante:</strong></p>
              <ul>
                <li>Este link expira em 1 hora</li>
                <li>Se você não solicitou esta redefinição, ignore este email</li>
                <li>Nunca compartilhe este link com ninguém</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>AUREON ERP - Segurança em primeiro lugar</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentReminderTemplate(client, transaction) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount { font-size: 32px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Lembrete de Pagamento</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${client.nome}</strong>,</p>
            <p>Este é um lembrete amigável sobre o pagamento pendente:</p>
            <div class="details">
              <p><strong>Descrição:</strong> ${transaction.descricao || 'Pagamento pendente'}</p>
              <p><strong>Vencimento:</strong> ${new Date(transaction.data).toLocaleDateString('pt-BR')}</p>
              <div class="amount">R$ ${parseFloat(transaction.valor).toFixed(2)}</div>
            </div>
            <p>Por favor, realize o pagamento o mais breve possível para evitar atrasos.</p>
            <p>Em caso de dúvidas, entre em contato conosco.</p>
          </div>
          <div class="footer">
            <p>AUREON ERP - Gestão Financeira</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getBackupNotificationTemplate(result) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .stat { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💾 Backup Concluído</h1>
          </div>
          <div class="content">
            <p>O backup automático do banco de dados foi concluído com sucesso.</p>
            <div class="stats">
              <h3>Estatísticas do Backup</h3>
              <div class="stat">
                <span>Arquivo:</span>
                <strong>${result.filename}</strong>
              </div>
              <div class="stat">
                <span>Tamanho:</span>
                <strong>${result.size_mb} MB</strong>
              </div>
              <div class="stat">
                <span>Registros:</span>
                <strong>${result.metadata.total_records.toLocaleString()}</strong>
              </div>
              <div class="stat">
                <span>Tabelas:</span>
                <strong>${result.metadata.tables}</strong>
              </div>
              <div class="stat">
                <span>Duração:</span>
                <strong>${result.metadata.duration_ms}ms</strong>
              </div>
            </div>
            <p>O backup está armazenado com segurança no servidor.</p>
          </div>
          <div class="footer">
            <p>AUREON ERP - Backup Automático</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
