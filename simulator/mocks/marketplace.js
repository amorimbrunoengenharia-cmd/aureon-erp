/**
 * AUREON ERP - Marketplace Mock
 * Simulates Mercado Livre API responses
 */

import express from 'express';

export class MarketplaceMock {
  constructor(config) {
    this.port = config.port || 5002;
    this.defaultDelay = config.defaultDelay || 1000;
    this.failureRate = config.failureRate || 0;
    this.app = express();
    this.server = null;
    this.listings = new Map();
    
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());

    // Create listing
    this.app.post('/items', async (req, res) => {
      await this.delay();

      if (this.shouldFail()) {
        return res.status(500).json({
          error: 'internal_error',
          message: 'Marketplace API error'
        });
      }

      const { title, price, quantity, description } = req.body;
      const listingId = `MLB${this.generateId()}`;

      const listing = {
        id: listingId,
        title,
        price,
        quantity,
        description,
        status: 'active',
        permalink: `https://produto.mercadolivre.com.br/${listingId}`,
        created_at: new Date().toISOString()
      };

      this.listings.set(listingId, listing);

      res.status(201).json(listing);
    });

    // Get listing
    this.app.get('/items/:id', async (req, res) => {
      await this.delay();

      const listing = this.listings.get(req.params.id);

      if (!listing) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Item not found'
        });
      }

      res.json(listing);
    });

    // Update listing
    this.app.put('/items/:id', async (req, res) => {
      await this.delay();

      const listing = this.listings.get(req.params.id);

      if (!listing) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Item not found'
        });
      }

      const updated = { ...listing, ...req.body, updated_at: new Date().toISOString() };
      this.listings.set(req.params.id, updated);

      res.json(updated);
    });

    // Pause listing
    this.app.put('/items/:id/pause', async (req, res) => {
      await this.delay();

      const listing = this.listings.get(req.params.id);

      if (!listing) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Item not found'
        });
      }

      listing.status = 'paused';
      this.listings.set(req.params.id, listing);

      res.json(listing);
    });

    // Sync webhook (simulates marketplace notifying of sale)
    this.app.post('/notifications', async (req, res) => {
      await this.delay();
      res.status(200).json({ received: true });
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
    const ms = this.defaultDelay + Math.random() * 500;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  shouldFail() {
    return Math.random() < this.failureRate;
  }

  generateId() {
    return Math.floor(Math.random() * 1000000000);
  }
}
