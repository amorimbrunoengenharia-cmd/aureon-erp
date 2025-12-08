/**
 * AUREON ERP - Audit Validator
 * Validates audit log assertions
 */

export class AuditValidator {
  constructor(executors) {
    this.executors = executors;
  }

  async validateNoErrors(condition) {
    const { since, log_level } = condition;
    const logEntries = await this.getLogEntries(since);
    
    const errorLevels = log_level || ['ERROR', 'FATAL'];
    const errors = logEntries.filter(entry => 
      errorLevels.includes(entry.level)
    );

    if (errors.length > 0) {
      throw new Error(
        `Found ${errors.length} error(s) in logs: ${errors.map(e => e.message).join(', ')}`
      );
    }

    return true;
  }

  async validateAuditEntry(condition) {
    const { action, user_id, resource_type, resource_id } = condition;
    
    const result = await this.executors.db.select('audit_logs', {
      where: { 
        action,
        user_id,
        resource_type,
        resource_id
      },
      limit: 1,
      order: 'created_at DESC'
    });

    if (result.rows.length === 0) {
      throw new Error(
        `No audit entry found for action="${action}", user="${user_id}"`
      );
    }

    return result.rows[0];
  }

  async validateAuditCount(condition) {
    const { action, min, max } = condition;
    
    const result = await this.executors.db.count('audit_logs', { action });
    const count = result.count;

    if (min !== undefined && count < min) {
      throw new Error(`Expected at least ${min} audit entries, got ${count}`);
    }

    if (max !== undefined && count > max) {
      throw new Error(`Expected at most ${max} audit entries, got ${count}`);
    }

    return count;
  }

  async getLogEntries(since) {
    // Mock implementation - would query actual logs
    const sinceDate = since ? new Date(Date.now() - since) : new Date(0);
    
    // In production, this would read from log files or logging service
    return [];
  }

  async validateNoSQLErrors(condition) {
    const { since } = condition;
    const logEntries = await this.getLogEntries(since);
    
    const sqlErrors = logEntries.filter(entry => 
      entry.message && (
        entry.message.includes('SQLITE_') ||
        entry.message.includes('SQL') ||
        entry.message.includes('database')
      )
    );

    if (sqlErrors.length > 0) {
      throw new Error(
        `Found ${sqlErrors.length} SQL error(s): ${sqlErrors.map(e => e.message).join(', ')}`
      );
    }

    return true;
  }
}
