/**
 * PRESCRIPTION SERVICE
 * Business logic for prescription management with AI/OCR integration
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { 
  Prescription, 
  PrescriptionAttachment, 
  PatientHistory, 
  PrescriptionVersion,
  Client,
  User,
  Event
} from '../models/index.js';
import { Op } from 'sequelize';
import ocrService from './ocrService.js';
import sequelize from '../config/database.js';

class PrescriptionService {
  /**
   * Create prescription with trace_id and patient history
   */
  async create(data, userId) {
    const transaction = await sequelize.transaction();
    const trace_id = uuidv4();

    try {
      // Calculate data_validade (180 days if not provided)
      let dataValidade = data.data_validade;
      if (!dataValidade) {
        const emissao = new Date(data.data_emissao);
        emissao.setDate(emissao.getDate() + 180);
        dataValidade = emissao.toISOString().split('T')[0];
      }

      // Create prescription with trace_id
      const prescription = await Prescription.create({
        ...data,
        data_validade: dataValidade,
        lgpd_consentimento_data: new Date(),
        created_by: userId,
        updated_by: userId,
        trace_id
      }, { transaction });

      // Create patient history entry
      await PatientHistory.create({
        patient_id: data.cliente_id,
        event_type: 'prescription',
        related_id: prescription.id,
        related_type: 'prescription',
        trace_id,
        metadata: {
          od: data.od,
          oe: data.oe,
          tipo_lente: data.tipo_lente,
          medico_crm: data.medico_crm
        },
        description: `Nova prescrição criada por ${data.medico_nome}`,
        actor_id: userId,
        occurred_at: new Date(data.data_emissao)
      }, { transaction });

      // Create event for audit trail
      await Event.create({
        trace_id,
        event_type: 'prescription.created',
        payload: {
          prescription_id: prescription.id,
          cliente_id: data.cliente_id,
          tipo_lente: data.tipo_lente
        },
        metadata: {
          user_id: userId,
          source: 'api'
        },
        status: 'completed'
      }, { transaction });

      await transaction.commit();

      logger.info(`Prescription created with trace_id: ${trace_id}`, {
        prescription_id: prescription.id,
        trace_id
      });

      return prescription;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating prescription', { error: error.message, trace_id });
      throw error;
    }
  }

  /**
   * Update prescription and create version entry
   */
  async update(prescriptionId, data, userId) {
    const transaction = await sequelize.transaction();
    const trace_id = uuidv4();

    try {
      const prescription = await Prescription.findByPk(prescriptionId, { transaction });
      
      if (!prescription) {
        throw new Error('Prescription not found');
      }

      const previousData = prescription.toJSON();

      // Calculate changed fields
      const changedFields = this.calculateChangedFields(previousData, data);
      
      if (Object.keys(changedFields).length === 0) {
        await transaction.rollback();
        return prescription; // No changes
      }

      // Update prescription
      await prescription.update({
        ...data,
        updated_by: userId,
        trace_id
      }, { transaction });

      // Get current version number
      const lastVersion = await PrescriptionVersion.findOne({
        where: { prescription_id: prescriptionId },
        order: [['version_number', 'DESC']],
        transaction
      });

      const versionNumber = (lastVersion?.version_number || 0) + 1;

      // Create version entry
      await PrescriptionVersion.create({
        prescription_id: prescriptionId,
        version_number: versionNumber,
        reason: data.version_reason || 'correction',
        changed_fields: changedFields,
        previous_data: previousData,
        new_data: { ...previousData, ...data },
        changed_by: userId,
        trace_id,
        notes: data.version_notes || ''
      }, { transaction });

      // Create patient history entry
      await PatientHistory.create({
        patient_id: prescription.cliente_id,
        event_type: 'override',
        related_id: prescriptionId,
        related_type: 'prescription',
        trace_id,
        metadata: {
          version_number: versionNumber,
          changed_fields: changedFields,
          reason: data.version_reason || 'correction'
        },
        description: `Prescrição atualizada (v${versionNumber})`,
        actor_id: userId
      }, { transaction });

      await transaction.commit();

      logger.info(`Prescription updated with version ${versionNumber}`, {
        prescription_id: prescriptionId,
        version_number: versionNumber,
        trace_id
      });

      return prescription;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating prescription', { error: error.message, trace_id });
      throw error;
    }
  }

  /**
   * Parse prescription attachment using OCR
   */
  async parseAttachment(file, userId) {
    const trace_id = uuidv4();

    try {
      logger.info('Parsing prescription attachment', {
        file_name: file.originalname,
        file_size: file.size,
        trace_id
      });

      // Call OCR service
      const ocrResult = await ocrService.extractPrescriptionData(file);

      // Create event for tracking
      await Event.create({
        trace_id,
        event_type: 'prescription.attachment.parsed',
        payload: {
          file_name: file.originalname,
          confidence: ocrResult.confidence
        },
        metadata: {
          user_id: userId,
          ocr_provider: ocrResult.provider
        },
        status: 'completed'
      });

      logger.info('Prescription attachment parsed successfully', {
        confidence: ocrResult.confidence,
        trace_id
      });

      return {
        trace_id,
        parsed: ocrResult.data,
        confidence: ocrResult.confidence,
        suggestions: ocrResult.suggestions || []
      };
    } catch (error) {
      logger.error('Error parsing prescription attachment', {
        error: error.message,
        trace_id
      });

      // Create error event
      await Event.create({
        trace_id,
        event_type: 'prescription.attachment.parse_failed',
        payload: {
          file_name: file.originalname,
          error: error.message
        },
        metadata: {
          user_id: userId
        },
        status: 'failed',
        error_message: error.message
      });

      throw error;
    }
  }

  /**
   * Attach file to prescription
   */
  async attachFile(prescriptionId, file, parsedData, userId) {
    const transaction = await sequelize.transaction();
    const trace_id = uuidv4();

    try {
      const prescription = await Prescription.findByPk(prescriptionId, { transaction });
      
      if (!prescription) {
        throw new Error('Prescription not found');
      }

      // Save attachment
      const attachment = await PrescriptionAttachment.create({
        prescription_id: prescriptionId,
        file_type: this.getFileType(file.mimetype),
        file_url: file.path, // Assume file was uploaded to storage
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        parsed_confidence: parsedData?.confidence || null,
        parsed_data: parsedData || null,
        trace_id,
        uploaded_by: userId
      }, { transaction });

      // Update prescription anexos
      const anexos = prescription.anexos || [];
      anexos.push({
        id: attachment.id,
        file_name: file.originalname,
        uploaded_at: new Date()
      });
      
      await prescription.update({ anexos }, { transaction });

      await transaction.commit();

      logger.info('Attachment added to prescription', {
        prescription_id: prescriptionId,
        attachment_id: attachment.id,
        trace_id
      });

      return attachment;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error attaching file to prescription', {
        error: error.message,
        trace_id
      });
      throw error;
    }
  }

  /**
   * Get patient history
   */
  async getPatientHistory(patientId, options = {}) {
    const { limit = 50, offset = 0, event_type } = options;

    const where = { patient_id: patientId };
    if (event_type) where.event_type = event_type;

    const { rows: history, count } = await PatientHistory.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'patient', attributes: ['id', 'nome'] },
        { model: User, as: 'actor', attributes: ['id', 'username'] }
      ],
      limit,
      offset,
      order: [['occurred_at', 'DESC']]
    });

    return { history, count };
  }

  /**
   * Get prescription versions
   */
  async getVersions(prescriptionId) {
    return await PrescriptionVersion.findAll({
      where: { prescription_id: prescriptionId },
      include: [
        { model: User, as: 'changer', attributes: ['id', 'username'] }
      ],
      order: [['version_number', 'ASC']]
    });
  }

  /**
   * Check for rapid progression and flag
   */
  async checkRapidProgression(patientId) {
    const history = await PatientHistory.findAll({
      where: {
        patient_id: patientId,
        event_type: 'prescription'
      },
      order: [['occurred_at', 'DESC']],
      limit: 3
    });

    if (history.length < 2) return null;

    const latest = history[0].metadata;
    const previous = history[1].metadata;

    // Check for rapid progression (simplified logic)
    const odChange = Math.abs((latest.od?.esferico || 0) - (previous.od?.esferico || 0));
    const oeChange = Math.abs((latest.oe?.esferico || 0) - (previous.oe?.esferico || 0));

    if (odChange > 0.5 || oeChange > 0.5) {
      // Flag for rapid progression
      await PatientHistory.update(
        { 
          severity: 'high',
          flags: sequelize.fn('array_append', sequelize.col('flags'), 'rapid_progression')
        },
        { where: { id: history[0].id } }
      );

      return {
        flagged: true,
        reason: 'rapid_progression',
        od_change: odChange,
        oe_change: oeChange
      };
    }

    return null;
  }

  /**
   * Helper: Calculate changed fields
   */
  calculateChangedFields(oldData, newData) {
    const changed = {};

    const fieldsToCheck = ['od', 'oe', 'tipo_lente', 'medico_nome', 'medico_crm', 'observacoes'];

    for (const field of fieldsToCheck) {
      if (JSON.stringify(oldData[field]) !== JSON.stringify(newData[field])) {
        changed[field] = {
          old: oldData[field],
          new: newData[field]
        };
      }
    }

    return changed;
  }

  /**
   * Helper: Get file type from MIME type
   */
  getFileType(mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('csv')) return 'csv';
    return 'other';
  }
}

export default new PrescriptionService();
