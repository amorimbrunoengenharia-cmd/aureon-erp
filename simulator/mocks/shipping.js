/**
 * AUREON ERP - Shipping Mock
 * Simulates Correios tracking API
 */

import express from 'express';

export class ShippingMock {
  constructor(config) {
    this.port = config.port || 5003;
    this.defaultDelay = config.defaultDelay || 800;
    this.app = express();
    this.server = null;
    this.trackings = new Map();
    
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());

    // Create tracking
    this.app.post('/api/rastreamento', async (req, res) => {
      await this.delay();

      const { codigo, tipo } = req.body;
      const trackingCode = codigo || this.generateTrackingCode();

      const tracking = {
        codigo: trackingCode,
        tipo: tipo || 'PAC',
        status: 'postado',
        eventos: [
          {
            data: new Date().toISOString(),
            local: 'Agência dos Correios - São Paulo/SP',
            status: 'Objeto postado'
          }
        ]
      };

      this.trackings.set(trackingCode, tracking);

      res.status(201).json(tracking);
    });

    // Get tracking status
    this.app.get('/api/rastreamento/:codigo', async (req, res) => {
      await this.delay();

      const tracking = this.trackings.get(req.params.codigo);

      if (!tracking) {
        return res.status(404).json({
          erro: 'Objeto não encontrado'
        });
      }

      res.json(tracking);
    });

    // Calculate shipping cost
    this.app.post('/api/preco', async (req, res) => {
      await this.delay();

      const { cep_origem, cep_destino, peso, tipo } = req.body;

      res.json({
        tipo: tipo || 'PAC',
        valor: this.calculatePrice(peso, tipo),
        prazo: tipo === 'SEDEX' ? 2 : 5,
        cep_origem,
        cep_destino
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
    const ms = this.defaultDelay + Math.random() * 300;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  generateTrackingCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = letters.charAt(Math.floor(Math.random() * letters.length)) +
                   letters.charAt(Math.floor(Math.random() * letters.length));
    const numbers = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const suffix = 'BR';
    
    return `${prefix}${numbers}${suffix}`;
  }

  calculatePrice(peso = 0.5, tipo = 'PAC') {
    const basePAC = 15.00;
    const baseSEDEX = 25.00;
    const base = tipo === 'SEDEX' ? baseSEDEX : basePAC;
    
    return base + (peso * 5);
  }
}
