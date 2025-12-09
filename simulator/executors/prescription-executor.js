/**
 * PRESCRIPTION EXECUTOR
 * Executes prescription-specific operations in simulator scenarios
 */

import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../utils/logger.js';
import { SimulatorRun } from '../../../aureon-backend/models/index.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PrescriptionExecutor {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:5000';
    this.timeout = 30000; // 30s default
  }

  /**
   * Execute prescription creation
   */
  async executePrescriptionCreation(stepConfig, context) {
    try {
      const prescriptionData = {
        cliente_id: this.resolveVariable(stepConfig.body.cliente_id, context),
        od: stepConfig.body.od,
        oe: stepConfig.body.oe,
        tipo_lente: stepConfig.body.tipo_lente,
        medico_nome: stepConfig.body.medico_nome,
        medico_crm: stepConfig.body.medico_crm,
        medico_uf: stepConfig.body.medico_uf,
        data_emissao: stepConfig.body.data_emissao || new Date().toISOString(),
        data_validade: stepConfig.body.data_validade || this.calculateExpiryDate(),
        observacoes: stepConfig.body.observacoes,
        lgpd_consentimento: stepConfig.body.lgpd_consentimento ?? true
      };

      const response = await this.makeRequest({
        method: 'POST',
        url: `${this.baseURL}/api/prescriptions`,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(context)
        },
        body: prescriptionData
      });

      // Capture trace_id and prescription_id
      if (response.data && response.data.id) {
        context.variables.prescription_id = response.data.id;
        context.variables.trace_id = response.data.trace_id;
      }

      logger.info('Prescription created in simulator', {
        prescription_id: response.data?.id,
        trace_id: response.data?.trace_id,
        scenario: context.scenarioId
      });

      return response;
    } catch (error) {
      logger.error('Error executing prescription creation', {
        error: error.message,
        scenario: context.scenarioId
      });
      throw error;
    }
  }

  /**
   * Execute OCR attachment parsing
   */
  async executeOCRParsing(stepConfig, context) {
    try {
      // Resolve file path
      const filePath = path.resolve(__dirname, '../../', stepConfig.file.path);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create FormData
      const formData = new FormData();
      formData.append(stepConfig.file.field || 'file', fs.createReadStream(filePath));

      const response = await this.makeRequest({
        method: 'POST',
        url: `${this.baseURL}/api/prescriptions/parse-attachment`,
        headers: {
          ...formData.getHeaders(),
          ...this.getAuthHeaders(context)
        },
        body: formData,
        timeout: 60000 // OCR can take longer
      });

      // Capture variables
      if (response.data) {
        context.variables.trace_id = response.data.trace_id;
        context.variables.parsed_data = response.data.parsed;
        context.variables.confidence = response.data.confidence;
      }

      logger.info('OCR parsing executed', {
        trace_id: response.data?.trace_id,
        confidence: response.data?.confidence,
        scenario: context.scenarioId
      });

      return response;
    } catch (error) {
      logger.error('Error executing OCR parsing', {
        error: error.message,
        scenario: context.scenarioId
      });
      throw error;
    }
  }

  /**
   * Execute prescription update
   */
  async executePrescriptionUpdate(stepConfig, context) {
    try {
      const prescriptionId = this.resolveVariable(stepConfig.params.id, context);

      const updateData = {
        ...stepConfig.body,
        cliente_id: this.resolveVariable(stepConfig.body.cliente_id, context)
      };

      const response = await this.makeRequest({
        method: 'PUT',
        url: `${this.baseURL}/api/prescriptions/${prescriptionId}`,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(context)
        },
        body: updateData
      });

      logger.info('Prescription updated in simulator', {
        prescription_id: prescriptionId,
        scenario: context.scenarioId
      });

      return response;
    } catch (error) {
      logger.error('Error executing prescription update', {
        error: error.message,
        scenario: context.scenarioId
      });
      throw error;
    }
  }

  /**
   * Execute patient history retrieval
   */
  async executePatientHistoryRetrieval(stepConfig, context) {
    try {
      const patientId = this.resolveVariable(stepConfig.params.patientId, context);
      const queryParams = new URLSearchParams({
        page: stepConfig.query?.page || 1,
        limit: stepConfig.query?.limit || 50,
        ...(stepConfig.query?.event_type && { event_type: stepConfig.query.event_type })
      });

      const response = await this.makeRequest({
        method: 'GET',
        url: `${this.baseURL}/api/patients/${patientId}/history?${queryParams}`,
        headers: this.getAuthHeaders(context)
      });

      logger.info('Patient history retrieved', {
        patient_id: patientId,
        count: response.data?.count,
        scenario: context.scenarioId
      });

      return response;
    } catch (error) {
      logger.error('Error retrieving patient history', {
        error: error.message,
        scenario: context.scenarioId
      });
      throw error;
    }
  }

  /**
   * Execute progression check
   */
  async executeProgressionCheck(stepConfig, context) {
    try {
      const patientId = this.resolveVariable(stepConfig.params.patientId, context);

      const response = await this.makeRequest({
        method: 'GET',
        url: `${this.baseURL}/api/patients/${patientId}/progression-check`,
        headers: this.getAuthHeaders(context)
      });

      // Capture flagged status
      if (response.data) {
        context.variables.progression_flagged = response.data.flagged;
      }

      logger.info('Progression check executed', {
        patient_id: patientId,
        flagged: response.data?.flagged,
        scenario: context.scenarioId
      });

      return response;
    } catch (error) {
      logger.error('Error executing progression check', {
        error: error.message,
        scenario: context.scenarioId
      });
      throw error;
    }
  }

  /**
   * Create simulator run record
   */
  async createSimulatorRun(scenarioId, scenarioName, config) {
    try {
      const run = await SimulatorRun.create({
        id: uuidv4(),
        scenario_id: scenarioId,
        scenario_name: scenarioName,
        status: 'running',
        seed: config.seed || Math.floor(Math.random() * 1000000),
        start_at: new Date(),
        config: {
          parallel: config.parallel || 1,
          failFast: config.failFast ?? true,
          injectFailures: config.injectFailures ?? false
        },
        trace_id: uuidv4(),
        executed_by: config.executedBy || null
      });

      logger.info('Simulator run created', {
        run_id: run.id,
        scenario_id: scenarioId
      });

      return run;
    } catch (error) {
      logger.error('Error creating simulator run', { error: error.message });
      throw error;
    }
  }

  /**
   * Update simulator run with results
   */
  async updateSimulatorRun(runId, results) {
    try {
      const run = await SimulatorRun.findByPk(runId);

      if (!run) {
        throw new Error(`Simulator run ${runId} not found`);
      }

      await run.update({
        status: results.status,
        end_at: new Date(),
        duration_ms: Date.now() - new Date(run.start_at).getTime(),
        created_records: results.created_records || {},
        assertions: results.assertions || { total: 0, passed: 0, failed: 0 },
        errors: results.errors || [],
        report_url: results.report_url || null
      });

      logger.info('Simulator run updated', {
        run_id: runId,
        status: results.status,
        duration_ms: run.duration_ms
      });

      return run;
    } catch (error) {
      logger.error('Error updating simulator run', { error: error.message });
      throw error;
    }
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  async makeRequest({ method, url, headers, body, timeout }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || this.timeout);

    try {
      const fetchOptions = {
        method,
        headers,
        signal: controller.signal
      };

      if (body) {
        if (body instanceof FormData) {
          fetchOptions.body = body;
        } else {
          fetchOptions.body = JSON.stringify(body);
        }
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout || this.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Resolve variable from context
   */
  resolveVariable(value, context) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const varName = value.slice(2, -1);
      return context.variables[varName] || value;
    }
    return value;
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders(context) {
    if (context.token) {
      return { Authorization: `Bearer ${context.token}` };
    }
    return {};
  }

  /**
   * Calculate expiry date (default 1 year from now)
   */
  calculateExpiryDate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  }

  /**
   * Inject failure if configured
   */
  shouldInjectFailure(failureConfig) {
    if (!failureConfig || !failureConfig.condition) {
      return false;
    }

    // Parse condition: "random(0.1)" = 10% chance
    const match = failureConfig.condition.match(/random\(([0-9.]+)\)/);
    if (match) {
      const probability = parseFloat(match[1]);
      return Math.random() < probability;
    }

    return false;
  }

  /**
   * Apply failure injection
   */
  async applyFailureInjection(failureConfig) {
    if (failureConfig.type === 'timeout') {
      await new Promise((resolve) => setTimeout(resolve, failureConfig.duration));
      throw new Error(`Injected timeout: ${failureConfig.duration}ms`);
    } else if (failureConfig.type === 'error') {
      throw new Error(failureConfig.message || 'Injected error');
    }
  }
}

export default new PrescriptionExecutor();
