/**
 * AUREON ERP - Mock Services Index
 * Coordinates all mock services
 */

import { PaymentGatewayMock } from './payment-gateway.js';
import { MarketplaceMock } from './marketplace.js';
import { ShippingMock } from './shipping.js';
import { OAuthMock } from './oauth.js';
import config from '../config.js';

export class MockServices {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.services = {};
    
    if (config.mocks.paymentGateway.enabled) {
      this.services.paymentGateway = new PaymentGatewayMock(config.mocks.paymentGateway);
    }
    
    if (config.mocks.marketplace.enabled) {
      this.services.marketplace = new MarketplaceMock(config.mocks.marketplace);
    }
    
    if (config.mocks.shipping.enabled) {
      this.services.shipping = new ShippingMock(config.mocks.shipping);
    }
    
    if (config.mocks.oauth.enabled) {
      this.services.oauth = new OAuthMock(config.mocks.oauth);
    }
  }

  async startAll() {
    console.log('  🚀 Starting mock services...');
    
    const promises = Object.entries(this.services).map(async ([name, service]) => {
      try {
        await service.start();
        console.log(`    ✓ ${name} started on port ${service.port}`);
      } catch (error) {
        console.error(`    ✗ ${name} failed to start:`, error.message);
        throw error;
      }
    });

    await Promise.all(promises);
    console.log('  ✓ All mock services started\n');
  }

  async stopAll() {
    console.log('\n  🛑 Stopping mock services...');
    
    const promises = Object.entries(this.services).map(async ([name, service]) => {
      try {
        await service.stop();
        console.log(`    ✓ ${name} stopped`);
      } catch (error) {
        console.error(`    ✗ ${name} failed to stop:`, error.message);
      }
    });

    await Promise.all(promises);
    console.log('  ✓ All mock services stopped');
  }

  get(serviceName) {
    return this.services[serviceName];
  }
}

export async function startMockServices(options = {}) {
  const mocks = new MockServices(options);
  await mocks.startAll();
  return mocks;
}

export async function stopMockServices(mocks) {
  if (mocks) {
    await mocks.stopAll();
  }
}
