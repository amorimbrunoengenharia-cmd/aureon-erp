/**
 * AUREON ERP - Report Generator
 * Generates JSON and HTML simulation reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ReportGenerator {
  constructor(options = {}) {
    this.format = options.format || config.reports.format;
    this.outputPath = options.outputPath || config.reports.localPath;
  }

  async generate(results, metadata = {}) {
    const report = this.buildReport(results, metadata);
    const outputs = [];

    // Ensure output directory exists
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    if (this.format.includes('json')) {
      const jsonPath = await this.generateJSON(report);
      outputs.push(jsonPath);
    }

    if (this.format.includes('html')) {
      const htmlPath = await this.generateHTML(report);
      outputs.push(htmlPath);
    }

    if (config.reports.s3?.enabled) {
      await this.uploadToS3(outputs);
    }

    return outputs;
  }

  buildReport(results, metadata) {
    const totalScenarios = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalSteps = results.reduce((sum, r) => sum + (r.steps?.length || 0), 0);

    return {
      metadata: {
        generated_at: new Date().toISOString(),
        simulator_version: '1.0.0',
        seed: metadata.seed,
        parallel: metadata.parallel,
        ...metadata
      },
      summary: {
        total: totalScenarios,
        passed,
        failed,
        skipped,
        duration: totalDuration,
        steps: totalSteps,
        success_rate: totalScenarios > 0 ? (passed / totalScenarios * 100).toFixed(2) : 0
      },
      scenarios: results
    };
  }

  async generateJSON(report) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `simulation-${timestamp}.json`;
    const filepath = path.join(this.outputPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`  📄 JSON report: ${filepath}`);
    return filepath;
  }

  async generateHTML(report) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `simulation-${timestamp}.html`;
    const filepath = path.join(this.outputPath, filename);

    const html = this.buildHTML(report);
    fs.writeFileSync(filepath, html, 'utf-8');

    console.log(`  📊 HTML report: ${filepath}`);
    return filepath;
  }

  buildHTML(report) {
    const { metadata, summary, scenarios } = report;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AUREON ERP - Simulation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
    .metric-label { color: #666; font-size: 14px; }
    .passed { color: #10b981; }
    .failed { color: #ef4444; }
    .skipped { color: #f59e0b; }
    .scenarios { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .scenario { border-bottom: 1px solid #e5e5e5; padding: 15px 0; }
    .scenario:last-child { border-bottom: none; }
    .scenario-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .scenario-name { font-size: 18px; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-passed { background: #d1fae5; color: #065f46; }
    .badge-failed { background: #fee2e2; color: #991b1b; }
    .badge-skipped { background: #fef3c7; color: #92400e; }
    .scenario-meta { color: #666; font-size: 14px; margin-bottom: 10px; }
    .steps { margin-top: 10px; }
    .step { padding: 8px; background: #f9fafb; border-left: 3px solid #e5e5e5; margin-bottom: 5px; font-size: 14px; }
    .step.passed { border-left-color: #10b981; }
    .step.failed { border-left-color: #ef4444; }
    .error { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 AUREON ERP - Simulation Report</h1>
      <p>Generated at ${new Date(metadata.generated_at).toLocaleString('pt-BR')}</p>
      <p>Seed: ${metadata.seed || 'random'} | Parallel: ${metadata.parallel || 1}</p>
    </div>

    <div class="summary">
      <div class="metric">
        <div class="metric-value">${summary.total}</div>
        <div class="metric-label">Total Scenarios</div>
      </div>
      <div class="metric">
        <div class="metric-value passed">${summary.passed}</div>
        <div class="metric-label">Passed</div>
      </div>
      <div class="metric">
        <div class="metric-value failed">${summary.failed}</div>
        <div class="metric-label">Failed</div>
      </div>
      <div class="metric">
        <div class="metric-value skipped">${summary.skipped}</div>
        <div class="metric-label">Skipped</div>
      </div>
      <div class="metric">
        <div class="metric-value">${summary.success_rate}%</div>
        <div class="metric-label">Success Rate</div>
      </div>
      <div class="metric">
        <div class="metric-value">${(summary.duration / 1000).toFixed(2)}s</div>
        <div class="metric-label">Total Duration</div>
      </div>
    </div>

    <div class="scenarios">
      <h2 style="margin-bottom: 20px;">Scenarios</h2>
      ${scenarios.map(scenario => `
        <div class="scenario">
          <div class="scenario-header">
            <div class="scenario-name">${scenario.scenario_id}</div>
            <span class="badge badge-${scenario.status}">${scenario.status}</span>
          </div>
          <div class="scenario-meta">
            Duration: ${(scenario.duration / 1000).toFixed(2)}s | 
            Steps: ${scenario.steps?.length || 0} | 
            Assertions: ${scenario.assertions?.length || 0}
          </div>
          ${scenario.error ? `<div class="error">❌ ${scenario.error}</div>` : ''}
          ${scenario.steps ? `
            <details class="steps">
              <summary style="cursor: pointer; font-weight: 600; margin-bottom: 10px;">Steps (${scenario.steps.length})</summary>
              ${scenario.steps.map(step => `
                <div class="step ${step.status}">
                  <strong>${step.type}</strong>: ${step.action} 
                  <span style="float: right;">${step.duration}ms</span>
                </div>
              `).join('')}
            </details>
          ` : ''}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
  }

  async uploadToS3(files) {
    // Mock implementation - would use AWS SDK in production
    console.log(`  ☁️  S3 upload: ${files.length} file(s) (mock)`);
  }
}
