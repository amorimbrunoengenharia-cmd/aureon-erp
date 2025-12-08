/**
 * AUREON ERP - Stock Validator
 * Validates stock-related assertions
 */

export class StockValidator {
  constructor(executors) {
    this.executors = executors;
  }

  async validateCount(condition) {
    const { table, where } = condition;
    const result = await this.executors.db.count(table, where);
    return result.count;
  }

  async validateValue(condition) {
    const { table, column, where } = condition;
    const result = await this.executors.db.select(table, { where, limit: 1 });
    
    if (result.rows.length === 0) {
      throw new Error(`No rows found matching condition`);
    }

    return result.rows[0][column];
  }

  async validateExists(condition) {
    const { table, where } = condition;
    const result = await this.executors.db.count(table, where);
    return result.count > 0;
  }

  async validateStockLevel(productId, expectedLevel) {
    const result = await this.executors.db.select('produtos', {
      where: { id: productId },
      limit: 1
    });

    if (result.rows.length === 0) {
      throw new Error(`Product not found: ${productId}`);
    }

    const actualLevel = result.rows[0].estoque_atual;
    
    if (actualLevel !== expectedLevel) {
      throw new Error(
        `Stock mismatch: expected ${expectedLevel}, got ${actualLevel}`
      );
    }

    return actualLevel;
  }

  async validateStockReservation(productId, quantity) {
    // Check if stock was properly reserved
    const result = await this.executors.db.select('estoque_movimentos', {
      where: { 
        produto_id: productId, 
        tipo: 'RESERVA'
      },
      order: 'created_at DESC',
      limit: 1
    });

    if (result.rows.length === 0) {
      throw new Error('No stock reservation found');
    }

    const reservation = result.rows[0];
    
    if (Math.abs(reservation.quantidade) !== quantity) {
      throw new Error(
        `Reservation mismatch: expected ${quantity}, got ${Math.abs(reservation.quantidade)}`
      );
    }

    return reservation;
  }
}
