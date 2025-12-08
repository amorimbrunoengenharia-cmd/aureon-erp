import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContextAPI';
import PrescriptionService from '../services/PrescriptionService';
import eventLogger from '../services/EventLogger';

export const PrescriptionContext = createContext();

export const PrescriptionProvider = ({ children }) => {
  const { user: currentUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Carregar receitas ao iniciar
  useEffect(() => {
    loadPrescriptions();
    loadStats();
    setLoading(false);
  }, []);

  // Carregar receitas
  const loadPrescriptions = () => {
    try {
      const data = PrescriptionService.getAll();
      setPrescriptions(data);
    } catch (error) {
      eventLogger.error('Erro ao carregar receitas', { error: error.message });
    }
  };

  // Carregar estatísticas
  const loadStats = () => {
    try {
      const data = PrescriptionService.getStats();
      setStats(data);
    } catch (error) {
      eventLogger.error('Erro ao carregar stats de receitas', { error: error.message });
    }
  };

  // Criar receita
  const createPrescription = (prescriptionData) => {
    try {
      const prescription = PrescriptionService.create(
        prescriptionData,
        currentUser?.username || 'system'
      );
      loadPrescriptions();
      loadStats();
      return { success: true, prescription };
    } catch (error) {
      eventLogger.error('Erro ao criar receita', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  // Atualizar receita
  const updatePrescription = (id, updateData) => {
    try {
      const prescription = PrescriptionService.update(
        id,
        updateData,
        currentUser?.username || 'system'
      );
      loadPrescriptions();
      return { success: true, prescription };
    } catch (error) {
      eventLogger.error('Erro ao atualizar receita', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  // Deletar receita
  const deletePrescription = (id) => {
    try {
      PrescriptionService.delete(id, currentUser?.username || 'system');
      loadPrescriptions();
      loadStats();
      return { success: true };
    } catch (error) {
      eventLogger.error('Erro ao deletar receita', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  // Associar receita a pedido
  const attachToOrder = (prescriptionId, orderId) => {
    try {
      const prescription = PrescriptionService.attachToOrder(
        prescriptionId,
        orderId,
        currentUser?.username || 'system'
      );
      loadPrescriptions();
      return { success: true, prescription };
    } catch (error) {
      eventLogger.error('Erro ao associar receita ao pedido', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  // Upload de anexo
  const uploadAttachment = (prescriptionId, file) => {
    try {
      const attachment = PrescriptionService.uploadAttachment(
        prescriptionId,
        file,
        currentUser?.username || 'system'
      );
      loadPrescriptions();
      return { success: true, attachment };
    } catch (error) {
      eventLogger.error('Erro ao fazer upload de anexo', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  // Obter receitas por cliente
  const getPrescriptionsByCliente = (clienteId) => {
    return PrescriptionService.getByCliente(clienteId);
  };

  // Obter receita por ID
  const getPrescriptionById = (id) => {
    return PrescriptionService.getById(id);
  };

  // Obter anexos
  const getAttachments = (prescriptionId) => {
    return PrescriptionService.getAttachments(prescriptionId);
  };

  // Verificar receitas expiradas
  const checkExpiredPrescriptions = () => {
    const expired = PrescriptionService.checkExpiredPrescriptions();
    if (expired > 0) {
      loadPrescriptions();
      loadStats();
    }
    return expired;
  };

  const value = {
    prescriptions,
    stats,
    loading,
    createPrescription,
    updatePrescription,
    deletePrescription,
    attachToOrder,
    uploadAttachment,
    getPrescriptionsByCliente,
    getPrescriptionById,
    getAttachments,
    checkExpiredPrescriptions,
    refresh: loadPrescriptions
  };

  return (
    <PrescriptionContext.Provider value={value}>
      {children}
    </PrescriptionContext.Provider>
  );
};

export const usePrescription = () => {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error('usePrescription must be used within PrescriptionProvider');
  }
  return context;
};
