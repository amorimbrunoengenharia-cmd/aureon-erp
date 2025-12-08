/**
 * AUREON ERP - Payment Gateway Mock
 * Simulates payment gateway API responses
 */

import express from 'express';

export class PaymentGatewayMock {
  constructor(config) {
    this.port = config.port || 5001;
    this.defaultDelay = config.defaultDelay || 500;
    this.failureRate = config.failureRate || 0;
    this.app = express();
    this.server = null;
    
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());

    // Create payment
    this.app.post('/v1/payments', async (req, res) => {
      await this.delay();

      if (this.shouldFail()) {
        return res.status(502).json({
          error: 'gateway_error',
          message: 'Payment gateway temporarily unavailable'
        });
      }

      const { amount, currency, customer, metadata } = req.body;

      res.json({
        id: `pay_${this.generateId()}`,
        status: 'succeeded',
        amount,
        currency: currency || 'BRL',
        customer,
        metadata,
        created_at: new Date().toISOString()
      });
    });

    // Get payment status
    this.app.get('/v1/payments/:id', async (req, res) => {
      await this.delay();

      res.json({
        id: req.params.id,
        status: 'succeeded',
        amount: 10000,
        currency: 'BRL',
        created_at: new Date().toISOString()
      });
    });

    // Refund payment
    this.app.post('/v1/payments/:id/refunds', async (req, res) => {
      await this.delay();

      const { amount, reason } = req.body;

      res.json({
        id: `ref_${this.generateId()}`,
        payment_id: req.params.id,
        status: 'succeeded',
        amount: amount || 10000,
        reason: reason || 'requested_by_customer',
        created_at: new Date().toISOString()
      });
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
  }

  async delay() {
    const ms = this.defaultDelay + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  shouldFail() {
    return Math.random() < this.failureRate;
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
}
