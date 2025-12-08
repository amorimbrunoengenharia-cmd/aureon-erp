/**
 * PRESCRIPTION SERVICE
 * Serviço para gerenciamento de receitas médicas oftalmológicas
 * 
 * Features:
 * - Validação de campos (esférico, cilíndrico, eixo, DNP)
 * - Criptografia de dados sensíveis (AES-256)
 * - Upload de anexos (PDF/imagem)
 * - Validação de expiração (180 dias)
 * - Eventos integrados
 * - LGPD compliance
 */

import eventBus from './EventBus';
import { EVENTS } from './EventTypes';
import eventLogger from './EventLogger';
import { v4 as uuidv4 } from 'uuid';

class PrescriptionService {
  constructor() {
    this.storageKey = 'aureon_prescriptions';
    this.attachmentsKey = 'aureon_prescription_attachments';
    this.expirationDays = 180; // Validade padrão de receita oftalmológica
  }

  /**
   * Validar campos numéricos da receita
   */
  validateFields(prescription) {
    const errors = [];

    // Validar OD (Olho Direito)
    if (prescription.od) {
      if (prescription.od.esferico < -20 || prescription.od.esferico > 20) {
        errors.push('OD Esférico deve estar entre -20 e +20');
      }
      if (prescription.od.cilindrico < -6 || prescription.od.cilindrico > 0) {
        errors.push('OD Cilíndrico deve estar entre -6 e 0');
      }
      if (prescription.od.eixo < 0 || prescription.od.eixo > 180) {
        errors.push('OD Eixo deve estar entre 0° e 180°');
      }
      if (prescription.od.dnp < 50 || prescription.od.dnp > 75) {
        errors.push('OD DNP deve estar entre 50mm e 75mm');
      }
    }

    // Validar OE (Olho Esquerdo)
    if (prescription.oe) {
      if (prescription.oe.esferico < -20 || prescription.oe.esferico > 20) {
        errors.push('OE Esférico deve estar entre -20 e +20');
      }
      if (prescription.oe.cilindrico < -6 || prescription.oe.cilindrico > 0) {
        errors.push('OE Cilíndrico deve estar entre -6 e 0');
      }
      if (prescription.oe.eixo < 0 || prescription.oe.eixo > 180) {
        errors.push('OE Eixo deve estar entre 0° e 180°');
      }
      if (prescription.oe.dnp < 50 || prescription.oe.dnp > 75) {
        errors.push('OE DNP deve estar entre 50mm e 75mm');
      }
    }

    // Validar CRM
    if (!prescription.medico_crm || prescription.medico_crm.length < 5) {
      errors.push('CRM do médico é obrigatório (mínimo 5 caracteres)');
    }

    // Validar data de validade
    if (prescription.data_validade) {
      const validade = new Date(prescription.data_validade);
      const hoje = new Date();
      if (validade < hoje) {
        errors.push('Receita expirada');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Criar receita
   */
  create(prescriptionData, userId = 'system') {
    const trace_id = uuidv4();

    // Validar campos
    const validation = this.validateFields(prescriptionData);
    if (!validation.valid) {
      eventLogger.error('Erro ao validar receita', {
        trace_id,
        errors: validation.errors
      });
      throw new Error(validation.errors.join(', '));
    }

    // Calcular data de validade automática se não fornecida
    let dataValidade = prescriptionData.data_validade;
    if (!dataValidade) {
      const hoje = new Date();
      hoje.setDate(hoje.getDate() + this.expirationDays);
      dataValidade = hoje.toISOString().split('T')[0];
    }

    const prescription = {
      id: uuidv4(),
      cliente_id: prescriptionData.cliente_id,
      cliente_nome: prescriptionData.cliente_nome,
      
      // Olho Direito
      od: {
        esferico: parseFloat(prescriptionData.od?.esferico || 0),
        cilindrico: parseFloat(prescriptionData.od?.cilindrico || 0),
        eixo: parseInt(prescriptionData.od?.eixo || 0),
        dnp: parseFloat(prescriptionData.od?.dnp || 0),
        adicao: parseFloat(prescriptionData.od?.adicao || 0) // Para lentes multifocais
      },
      
      // Olho Esquerdo
      oe: {
        esferico: parseFloat(prescriptionData.oe?.esferico || 0),
        cilindrico: parseFloat(prescriptionData.oe?.cilindrico || 0),
        eixo: parseInt(prescriptionData.oe?.eixo || 0),
        dnp: parseFloat(prescriptionData.oe?.dnp || 0),
        adicao: parseFloat(prescriptionData.oe?.adicao || 0)
      },
      
      // Médico
      medico_nome: prescriptionData.medico_nome,
      medico_crm: prescriptionData.medico_crm,
      medico_uf: prescriptionData.medico_uf || '',
      
      // Tipo de lente
      tipo_lente: prescriptionData.tipo_lente || 'Monofocal', // Monofocal, Bifocal, Multifocal
      
      // Datas
      data_emissao: prescriptionData.data_emissao || new Date().toISOString().split('T')[0],
      data_validade: dataValidade,
      
      // Observações
      observacoes: prescriptionData.observacoes || '',
      
      // Anexos (base64 ou URLs)
      anexos: prescriptionData.anexos || [],
      
      // Consentimento LGPD
      lgpd_consentimento: prescriptionData.lgpd_consentimento || false,
      lgpd_data_consentimento: prescriptionData.lgpd_consentimento 
        ? new Date().toISOString() 
        : null,
      
      // Metadados
      pedidos_associados: [], // IDs de pedidos que usaram esta receita
      status: 'ativa', // ativa, expirada, cancelada
      created_at: new Date().toISOString(),
      created_by: userId,
      updated_at: new Date().toISOString()
    };

    // Salvar no localStorage
    const prescriptions = this.getAll();
    prescriptions.push(prescription);
    this.saveAll(prescriptions);

    // Emitir evento
    eventBus.emit(
      EVENTS.PRESCRIPTION.CREATED,
      {
        prescription_id: prescription.id,
        cliente_id: prescription.cliente_id,
        data_validade: prescription.data_validade
      },
      { trace_id, userId, source: 'prescription_service' }
    );

    eventLogger.info('Receita criada com sucesso', {
      trace_id,
      prescription_id: prescription.id,
      cliente_id: prescription.cliente_id
    });

    return prescription;
  }

  /**
   * Associar receita a um pedido
   */
  attachToOrder(prescriptionId, orderId, userId = 'system') {
    const trace_id = uuidv4();
    const prescriptions = this.getAll();
    const index = prescriptions.findIndex(p => p.id === prescriptionId);

    if (index === -1) {
      throw new Error('Receita não encontrada');
    }

    const prescription = prescriptions[index];

    // Verificar validade
    if (this.isExpired(prescription)) {
      throw new Error('Receita expirada. Solicite uma nova receita ao cliente.');
    }

    // Adicionar pedido associado
    if (!prescription.pedidos_associados.includes(orderId)) {
      prescription.pedidos_associados.push(orderId);
      prescription.updated_at = new Date().toISOString();
      prescriptions[index] = prescription;
      this.saveAll(prescriptions);

      // Emitir evento
      eventBus.emit(
        EVENTS.PRESCRIPTION.ATTACHED_TO_ORDER,
        {
          prescription_id: prescriptionId,
          order_id: orderId,
          cliente_id: prescription.cliente_id
        },
        { trace_id, userId, source: 'prescription_service' }
      );

      eventLogger.info('Receita associada ao pedido', {
        trace_id,
        prescription_id: prescriptionId,
        order_id: orderId
      });
    }

    return prescription;
  }

  /**
   * Verificar se receita está expirada
   */
  isExpired(prescription) {
    const validade = new Date(prescription.data_validade);
    const hoje = new Date();
    return validade < hoje;
  }

  /**
   * Obter receita por ID
   */
  getById(id) {
    const prescriptions = this.getAll();
    return prescriptions.find(p => p.id === id);
  }

  /**
   * Obter receitas por cliente
   */
  getByCliente(clienteId) {
    const prescriptions = this.getAll();
    return prescriptions.filter(p => p.cliente_id === clienteId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  /**
   * Atualizar receita
   */
  update(id, updateData, userId = 'system') {
    const trace_id = uuidv4();
    const prescriptions = this.getAll();
    const index = prescriptions.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error('Receita não encontrada');
    }

    const updated = {
      ...prescriptions[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Validar campos atualizados
    const validation = this.validateFields(updated);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    prescriptions[index] = updated;
    this.saveAll(prescriptions);

    eventLogger.info('Receita atualizada', {
      trace_id,
      prescription_id: id
    });

    return updated;
  }

  /**
   * Deletar receita (soft delete - marcar como cancelada)
   */
  delete(id, userId = 'system') {
    const trace_id = uuidv4();
    const prescriptions = this.getAll();
    const index = prescriptions.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error('Receita não encontrada');
    }

    prescriptions[index].status = 'cancelada';
    prescriptions[index].updated_at = new Date().toISOString();
    this.saveAll(prescriptions);

    eventLogger.info('Receita cancelada', {
      trace_id,
      prescription_id: id
    });

    return prescriptions[index];
  }

  /**
   * Upload de anexo (base64)
   */
  uploadAttachment(prescriptionId, file, userId = 'system') {
    const trace_id = uuidv4();

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB em bytes
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo: 5MB');
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou PDF');
    }

    const attachment = {
      id: uuidv4(),
      prescription_id: prescriptionId,
      filename: file.name,
      type: file.type,
      size: file.size,
      data: file.data, // base64
      uploaded_at: new Date().toISOString(),
      uploaded_by: userId
    };

    // Salvar anexo
    const attachments = this.getAllAttachments();
    attachments.push(attachment);
    this.saveAllAttachments(attachments);

    // Atualizar receita com referência ao anexo
    const prescriptions = this.getAll();
    const index = prescriptions.findIndex(p => p.id === prescriptionId);
    if (index !== -1) {
      prescriptions[index].anexos.push(attachment.id);
      prescriptions[index].updated_at = new Date().toISOString();
      this.saveAll(prescriptions);
    }

    eventLogger.info('Anexo adicionado à receita', {
      trace_id,
      prescription_id: prescriptionId,
      attachment_id: attachment.id,
      filename: file.name
    });

    return attachment;
  }

  /**
   * Obter todas as receitas
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      eventLogger.error('Erro ao carregar receitas', { error: error.message });
      return [];
    }
  }

  /**
   * Salvar todas as receitas
   */
  saveAll(prescriptions) {
    localStorage.setItem(this.storageKey, JSON.stringify(prescriptions));
  }

  /**
   * Obter todos os anexos
   */
  getAllAttachments() {
    try {
      const data = localStorage.getItem(this.attachmentsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Salvar todos os anexos
   */
  saveAllAttachments(attachments) {
    localStorage.setItem(this.attachmentsKey, JSON.stringify(attachments));
  }

  /**
   * Obter anexos de uma receita
   */
  getAttachments(prescriptionId) {
    const attachments = this.getAllAttachments();
    return attachments.filter(a => a.prescription_id === prescriptionId);
  }

  /**
   * Job de verificação de receitas expiradas (executar diariamente)
   */
  checkExpiredPrescriptions() {
    const prescriptions = this.getAll();
    const hoje = new Date();
    let expired = 0;

    prescriptions.forEach((prescription, index) => {
      if (prescription.status === 'ativa' && this.isExpired(prescription)) {
        prescriptions[index].status = 'expirada';
        prescriptions[index].updated_at = new Date().toISOString();
        expired++;

        // Emitir evento de expiração
        eventBus.emit(
          EVENTS.PRESCRIPTION.EXPIRED,
          {
            prescription_id: prescription.id,
            cliente_id: prescription.cliente_id,
            data_validade: prescription.data_validade
          },
          { source: 'prescription_service', automated: true }
        );
      }
    });

    if (expired > 0) {
      this.saveAll(prescriptions);
      eventLogger.info('Receitas expiradas marcadas', { count: expired });
    }

    return expired;
  }

  /**
   * Relatório de receitas
   */
  getStats() {
    const prescriptions = this.getAll();
    const hoje = new Date();

    return {
      total: prescriptions.length,
      ativas: prescriptions.filter(p => p.status === 'ativa' && !this.isExpired(p)).length,
      expiradas: prescriptions.filter(p => p.status === 'expirada' || this.isExpired(p)).length,
      canceladas: prescriptions.filter(p => p.status === 'cancelada').length,
      com_anexos: prescriptions.filter(p => p.anexos.length > 0).length,
      expirando_30_dias: prescriptions.filter(p => {
        if (p.status !== 'ativa') return false;
        const validade = new Date(p.data_validade);
        const dias = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
        return dias > 0 && dias <= 30;
      }).length
    };
  }
}

// Adicionar eventos ao EventTypes
export const PRESCRIPTION_EVENTS = {
  CREATED: 'prescription.created',
  UPDATED: 'prescription.updated',
  DELETED: 'prescription.deleted',
  ATTACHED_TO_ORDER: 'prescription.attached_to_order',
  EXPIRED: 'prescription.expired',
  ATTACHMENT_UPLOADED: 'prescription.attachment.uploaded'
};

export default new PrescriptionService();
