/**
 * AUREON ERP - Events Validator
 * Validates event bus assertions
 */

export class EventsValidator {
  constructor(executors) {
    this.executors = executors;
  }

  async validateCount(condition) {
    const { event_type, min, max } = condition;
    const log = this.executors.event.getLog();
    const matchingEvents = log.filter(e => e.type === event_type);
    const count = matchingEvents.length;

    if (min !== undefined && count < min) {
      throw new Error(`Expected at least ${min} events, got ${count}`);
    }

    if (max !== undefined && count > max) {
      throw new Error(`Expected at most ${max} events, got ${count}`);
    }

    return count;
  }

  async validateExists(condition) {
    const { event_type, payload_contains } = condition;
    const log = this.executors.event.getLog();
    
    const matchingEvents = log.filter(e => {
      if (e.type !== event_type) return false;
      
      if (payload_contains) {
        const payloadStr = JSON.stringify(e.payload);
        return Object.entries(payload_contains).every(([key, value]) => {
          return payloadStr.includes(`"${key}":${JSON.stringify(value)}`);
        });
      }

      return true;
    });

    return matchingEvents.length > 0;
  }

  async validateEventOrder(condition) {
    const { event_types } = condition;
    const log = this.executors.event.getLog();
    
    const relevantEvents = log.filter(e => event_types.includes(e.type));
    const actualOrder = relevantEvents.map(e => e.type);
    
    const orderMatches = event_types.every((type, index) => {
      return actualOrder[index] === type;
    });

    if (!orderMatches) {
      throw new Error(
        `Event order mismatch. Expected: ${event_types.join(' → ')}, Got: ${actualOrder.join(' → ')}`
      );
    }

    return true;
  }

  async validateEventPayload(condition) {
    const { event_type, payload_schema } = condition;
    const log = this.executors.event.getLog();
    
    const lastEvent = log.filter(e => e.type === event_type).pop();
    
    if (!lastEvent) {
      throw new Error(`No event found with type: ${event_type}`);
    }

    // Simple schema validation
    for (const [key, expectedType] of Object.entries(payload_schema)) {
      const actualValue = lastEvent.payload[key];
      const actualType = typeof actualValue;

      if (actualType !== expectedType) {
        throw new Error(
          `Payload type mismatch for key "${key}": expected ${expectedType}, got ${actualType}`
        );
      }
    }

    return lastEvent.payload;
  }
}
