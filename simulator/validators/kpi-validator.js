/**
 * AUREON ERP - KPI Validator
 * Validates business KPI assertions
 */

export class KpiValidator {
  constructor(executors) {
    this.executors = executors;
  }

  async validateValue(condition) {
    const { kpi_name, expected, tolerance } = condition;

    let actualValue;

    switch (kpi_name) {
      case 'gmv':
        actualValue = await this.calculateGMV(condition);
        break;
      
      case 'margin':
        actualValue = await this.calculateMargin(condition);
        break;
      
      case 'conversion_rate':
        actualValue = await this.calculateConversionRate(condition);
        break;
      
      case 'average_ticket':
        actualValue = await this.calculateAverageTicket(condition);
        break;
      
      default:
        throw new Error(`Unknown KPI: ${kpi_name}`);
    }

    // Check if within tolerance
    if (tolerance) {
      const diff = Math.abs(actualValue - expected);
      const toleranceValue = expected * (tolerance / 100);
      
      if (diff > toleranceValue) {
        throw new Error(
          `KPI "${kpi_name}" outside tolerance: expected ${expected} ±${tolerance}%, got ${actualValue}`
        );
      }
    } else {
      if (actualValue !== expected) {
        throw new Error(
          `KPI "${kpi_name}" mismatch: expected ${expected}, got ${actualValue}`
        );
      }
    }

    return actualValue;
  }

  async calculateGMV(condition) {
    const { start_date, end_date } = condition;
    
    const result = await this.executors.db.execute('SELECT SUM(total) as gmv FROM vendas WHERE status = "CONCLUIDA"', {});
    
    return result.rows[0]?.gmv || 0;
  }

  async calculateMargin(condition) {
    const { product_id } = condition;
    
    const result = await this.executors.db.select('produtos', {
      where: { id: product_id },
      limit: 1
    });

    if (result.rows.length === 0) {
      throw new Error(`Product not found: ${product_id}`);
    }

    const product = result.rows[0];
    const margin = ((product.preco_venda - product.preco_custo) / product.preco_venda) * 100;

    return Math.round(margin * 100) / 100;
  }

  async calculateConversionRate(condition) {
    const { start_date, end_date } = condition;
    
    const totalVisits = await this.executors.db.count('page_views', {});
    const totalSales = await this.executors.db.count('vendas', { status: 'CONCLUIDA' });

    if (totalVisits.count === 0) return 0;

    const rate = (totalSales.count / totalVisits.count) * 100;
    return Math.round(rate * 100) / 100;
  }

  async calculateAverageTicket(condition) {
    const { start_date, end_date } = condition;
    
    const result = await this.executors.db.execute(
      'SELECT AVG(total) as avg_ticket FROM vendas WHERE status = "CONCLUIDA"',
      {}
    );

    return result.rows[0]?.avg_ticket || 0;
  }

  async validateDashboardMetrics(condition) {
    const { metrics } = condition;
    const results = {};

    for (const [metricName, expectedValue] of Object.entries(metrics)) {
      results[metricName] = await this.validateValue({
        kpi_name: metricName,
        expected: expectedValue,
        tolerance: condition.tolerance
      });
    }

    return results;
  }
}
