/**
 * AUREON ERP - Event Executor
 * Executes and monitors event bus operations
 */

export class EventExecutor {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.events = [];
    this.apiBaseUrl = options.apiBaseUrl || 'http://localhost:5000/api';
  }

  async execute(action, params = {}) {
    const [verb, ...rest] = action.split(' ');
    const eventType = rest.join(' ');

    switch (verb.toLowerCase()) {
      case 'publish':
        return await this.publish(eventType, params.payload);
      
      case 'consume':
        return await this.consume(eventType, params);
      
      case 'wait_for':
        return await this.waitFor(eventType, params.timeout || 5000);
      
      default:
        throw new Error(`Unknown event action: ${verb}`);
    }
  }

  async publish(eventType, payload) {
    const event = {
      id: this.generateId(),
      type: eventType,
      payload,
      timestamp: new Date().toISOString()
    };

    this.events.push(event);

    // In production, this would publish to the actual event bus
    console.log(`  📡 Published event: ${eventType}`);
    
    return event;
  }

  async consume(eventType, params = {}) {
    // Mock implementation - would consume from actual event bus
    const matchingEvents = this.events.filter(e => e.type === eventType);
    return matchingEvents[matchingEvents.length - 1] || null;
  }

  async waitFor(eventType, timeout) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const event = await this.consume(eventType);
      if (event) return event;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Timeout waiting for event: ${eventType}`);
  }

  getLog() {
    return this.events;
  }

  clearLog() {
    this.events = [];
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
