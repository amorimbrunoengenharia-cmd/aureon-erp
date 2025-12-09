/**
 * PRESCRIPTION VALIDATOR
 * Validates prescription-related scenarios and data integrity
 */

import logger from '../../utils/logger.js';
import { Prescription, PrescriptionAttachment, PatientHistory, PrescriptionVersion, Event } from '../../../aureon-backend/models/index.js';

class PrescriptionValidator {
  /**
   * Validate prescription creation
   */
  async validatePrescriptionCreation(prescriptionId, expectedData) {
    const errors = [];

    try {
      const prescription = await Prescription.findByPk(prescriptionId);

      if (!prescription) {
        errors.push({ field: 'prescription', message: 'Prescription not found' });
        return { valid: false, errors };
      }

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(prescription.id)) {
        errors.push({ field: 'id', message: 'Invalid UUID format' });
      }

      // Validate trace_id
      if (!prescription.trace_id) {
        errors.push({ field: 'trace_id', message: 'Missing trace_id' });
      }

      // Validate status
      if (!['ativa', 'expirada', 'cancelada'].includes(prescription.status)) {
        errors.push({ field: 'status', message: 'Invalid status' });
      }

      // Validate lens type
      if (!['Monofocal', 'Bifocal', 'Multifocal', 'Progressiva'].includes(prescription.tipo_lente)) {
        errors.push({ field: 'tipo_lente', message: 'Invalid lens type' });
      }

      // Validate OD values
      if (prescription.od) {
        if (prescription.od.esferico < -20 || prescription.od.esferico > 20) {
          errors.push({ field: 'od.esferico', message: 'OD sphere out of range (-20 to +20)' });
        }
        if (prescription.od.cilindrico < -6 || prescription.od.cilindrico > 0) {
          errors.push({ field: 'od.cilindrico', message: 'OD cylinder out of range (-6 to 0)' });
        }
        if (prescription.od.eixo < 0 || prescription.od.eixo > 180) {
          errors.push({ field: 'od.eixo', message: 'OD axis out of range (0° to 180°)' });
        }
      }

      // Validate OE values
      if (prescription.oe) {
        if (prescription.oe.esferico < -20 || prescription.oe.esferico > 20) {
          errors.push({ field: 'oe.esferico', message: 'OE sphere out of range (-20 to +20)' });
        }
        if (prescription.oe.cilindrico < -6 || prescription.oe.cilindrico > 0) {
          errors.push({ field: 'oe.cilindrico', message: 'OE cylinder out of range (-6 to 0)' });
        }
        if (prescription.oe.eixo < 0 || prescription.oe.eixo > 180) {
          errors.push({ field: 'oe.eixo', message: 'OE axis out of range (0° to 180°)' });
        }
      }

      // Validate dates
      const emissao = new Date(prescription.data_emissao);
      const validade = new Date(prescription.data_validade);
      if (validade <= emissao) {
        errors.push({ field: 'data_validade', message: 'Expiry date must be after emission date' });
      }

      // Validate LGPD
      if (!prescription.lgpd_consentimento) {
        errors.push({ field: 'lgpd_consentimento', message: 'LGPD consent is required' });
      }

      logger.info('Prescription validation completed', {
        prescription_id: prescriptionId,
        valid: errors.length === 0,
        errors_count: errors.length
      });

      return { valid: errors.length === 0, errors, data: prescription };
    } catch (error) {
      logger.error('Error validating prescription', { error: error.message });
      errors.push({ field: 'system', message: error.message });
      return { valid: false, errors };
    }
  }

  /**
   * Validate patient history entry
   */
  async validatePatientHistoryEntry(prescriptionId, clienteId) {
    const errors = [];

    try {
      const historyEntries = await PatientHistory.findAll({
        where: {
          patient_id: clienteId,
          related_id: prescriptionId,
          event_type: 'prescription'
        }
      });

      if (historyEntries.length === 0) {
        errors.push({ field: 'patient_history', message: 'No patient history entry found for prescription' });
        return { valid: false, errors };
      }

      const entry = historyEntries[0];

      // Validate trace_id
      if (!entry.trace_id) {
        errors.push({ field: 'trace_id', message: 'Missing trace_id in patient history' });
      }

      // Validate metadata
      if (!entry.metadata || !entry.metadata.od || !entry.metadata.oe) {
        errors.push({ field: 'metadata', message: 'Incomplete metadata in patient history' });
      }

      // Validate actor_id
      if (!entry.actor_id) {
        errors.push({ field: 'actor_id', message: 'Missing actor_id in patient history' });
      }

      logger.info('Patient history validation completed', {
        prescription_id: prescriptionId,
        valid: errors.length === 0
      });

      return { valid: errors.length === 0, errors, data: entry };
    } catch (error) {
      logger.error('Error validating patient history', { error: error.message });
      errors.push({ field: 'system', message: error.message });
      return { valid: false, errors };
    }
  }

  /**
   * Validate event creation
   */
  async validateEventCreation(traceId, expectedEventType) {
    const errors = [];

    try {
      const events = await Event.findAll({
        where: {
          trace_id: traceId,
          event_type: expectedEventType
        }
      });

      if (events.length === 0) {
        errors.push({ field: 'events', message: `No events found with type ${expectedEventType}` });
        return { valid: false, errors };
      }

      const event = events[0];

      // Validate status
      if (event.status !== 'completed') {
        errors.push({ field: 'status', message: `Event status is ${event.status}, expected completed` });
      }

      // Validate payload
      if (!event.payload || Object.keys(event.payload).length === 0) {
        errors.push({ field: 'payload', message: 'Event payload is empty' });
      }

      logger.info('Event validation completed', {
        trace_id: traceId,
        event_type: expectedEventType,
        valid: errors.length === 0
      });

      return { valid: errors.length === 0, errors, data: event };
    } catch (error) {
      logger.error('Error validating event', { error: error.message });
      errors.push({ field: 'system', message: error.message });
      return { valid: false, errors };
    }
  }

  /**
   * Validate OCR parsing result
   */
  validateOCRResult(parseResult) {
    const errors = [];

    // Validate confidence
    if (typeof parseResult.confidence !== 'number') {
      errors.push({ field: 'confidence', message: 'Confidence must be a number' });
    } else if (parseResult.confidence < 0 || parseResult.confidence > 1) {
      errors.push({ field: 'confidence', message: 'Confidence must be between 0 and 1' });
    }

    // Validate parsed data structure
    if (!parseResult.parsed) {
      errors.push({ field: 'parsed', message: 'Missing parsed data' });
      return { valid: false, errors };
    }

    const { parsed } = parseResult;

    // Check for critical fields
    if (!parsed.od && !parsed.oe) {
      errors.push({ field: 'parsed', message: 'Missing both OD and OE data' });
    }

    // Check trace_id
    if (!parseResult.trace_id) {
      errors.push({ field: 'trace_id', message: 'Missing trace_id in parse result' });
    }

    logger.info('OCR result validation completed', {
      valid: errors.length === 0,
      confidence: parseResult.confidence
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate prescription version entry
   */
  async validatePrescriptionVersion(prescriptionId, versionNumber) {
    const errors = [];

    try {
      const version = await PrescriptionVersion.findOne({
        where: {
          prescription_id: prescriptionId,
          version_number: versionNumber
        }
      });

      if (!version) {
        errors.push({ field: 'version', message: `Version ${versionNumber} not found` });
        return { valid: false, errors };
      }

      // Validate changed_fields
      if (!version.changed_fields || Object.keys(version.changed_fields).length === 0) {
        errors.push({ field: 'changed_fields', message: 'No changed fields recorded' });
      }

      // Validate reason
      if (!['manual_override', 'progression', 'recheck', 'correction', 'adjustment'].includes(version.reason)) {
        errors.push({ field: 'reason', message: 'Invalid version reason' });
      }

      // Validate trace_id
      if (!version.trace_id) {
        errors.push({ field: 'trace_id', message: 'Missing trace_id in version' });
      }

      logger.info('Version validation completed', {
        prescription_id: prescriptionId,
        version_number: versionNumber,
        valid: errors.length === 0
      });

      return { valid: errors.length === 0, errors, data: version };
    } catch (error) {
      logger.error('Error validating prescription version', { error: error.message });
      errors.push({ field: 'system', message: error.message });
      return { valid: false, errors };
    }
  }

  /**
   * Validate simulator run completeness
   */
  async validateSimulatorRun(runId, expectedOutcome) {
    const errors = [];

    try {
      // Count created prescriptions
      const prescriptionCount = await Prescription.count({
        where: {
          metadata: {
            simulator_run_id: runId
          }
        }
      });

      if (expectedOutcome.prescriptionsCreated && prescriptionCount < expectedOutcome.prescriptionsCreated) {
        errors.push({
          field: 'prescriptions',
          message: `Expected ${expectedOutcome.prescriptionsCreated} prescriptions, found ${prescriptionCount}`
        });
      }

      // Count events
      const eventCount = await Event.count({
        where: {
          metadata: {
            simulator_run_id: runId
          }
        }
      });

      if (expectedOutcome.eventsCreated && eventCount < expectedOutcome.eventsCreated) {
        errors.push({
          field: 'events',
          message: `Expected ${expectedOutcome.eventsCreated} events, found ${eventCount}`
        });
      }

      logger.info('Simulator run validation completed', {
        run_id: runId,
        valid: errors.length === 0,
        prescriptions: prescriptionCount,
        events: eventCount
      });

      return {
        valid: errors.length === 0,
        errors,
        stats: {
          prescriptions: prescriptionCount,
          events: eventCount
        }
      };
    } catch (error) {
      logger.error('Error validating simulator run', { error: error.message });
      errors.push({ field: 'system', message: error.message });
      return { valid: false, errors };
    }
  }
}

export default new PrescriptionValidator();
