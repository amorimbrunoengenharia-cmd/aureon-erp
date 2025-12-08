/**
 * AUREON ERP - OAuth Mock
 * Simulates OAuth2 token generation
 */

import express from 'express';
import crypto from 'crypto';

export class OAuthMock {
  constructor(config) {
    this.port = config.port || 5004;
    this.defaultDelay = config.defaultDelay || 300;
    this.app = express();
    this.server = null;
    this.tokens = new Map();
    
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());

    // Token endpoint
    this.app.post('/oauth/token', async (req, res) => {
      await this.delay();

      const { grant_type, client_id, client_secret, code, refresh_token } = req.body;

      // Validate grant type
      if (!['authorization_code', 'refresh_token', 'client_credentials'].includes(grant_type)) {
        return res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Grant type not supported'
        });
      }

      // Generate tokens
      const accessToken = this.generateToken();
      const newRefreshToken = this.generateToken();

      const tokenData = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: newRefreshToken,
        scope: 'read write',
        created_at: Math.floor(Date.now() / 1000)
      };

      this.tokens.set(accessToken, {
        ...tokenData,
        client_id,
        expires_at: Date.now() + (3600 * 1000)
      });

      res.json(tokenData);
    });

    // Validate token
    this.app.get('/oauth/token/info', async (req, res) => {
      await this.delay();

      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'invalid_token',
          error_description: 'Token not provided'
        });
      }

      const token = authHeader.substring(7);
      const tokenData = this.tokens.get(token);

      if (!tokenData) {
        return res.status(401).json({
          error: 'invalid_token',
          error_description: 'Token not found'
        });
      }

      if (tokenData.expires_at < Date.now()) {
        return res.status(401).json({
          error: 'invalid_token',
          error_description: 'Token expired'
        });
      }

      res.json({
        active: true,
        scope: tokenData.scope,
        client_id: tokenData.client_id,
        exp: tokenData.expires_at,
        iat: tokenData.created_at
      });
    });

    // Revoke token
    this.app.post('/oauth/revoke', async (req, res) => {
      await this.delay();

      const { token } = req.body;

      if (this.tokens.has(token)) {
        this.tokens.delete(token);
      }

      res.status(200).json({ revoked: true });
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
    const ms = this.defaultDelay + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  generateToken() {
    return crypto.randomBytes(32).toString('base64url');
  }
}
