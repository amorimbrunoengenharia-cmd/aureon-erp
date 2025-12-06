/**
 * SupplierQuotation Model
 * Modelo para gerenciar cotações de fornecedores
 */

import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SupplierQuotation = sequelize.define('SupplierQuotation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tenants',
      key: 'id'
    }
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Suppliers',
      key: 'id'
    }
  },
  produto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  preco_cotado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Preço cotado pelo fornecedor'
  },
  quantidade_minima: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Quantidade mínima para o preço cotado'
  },
  prazo_entrega_dias: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Prazo de entrega em dias'
  },
  validade_cotacao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de validade da cotação'
  },
  status: {
    type: DataTypes.ENUM('PENDENTE', 'APROVADA', 'REJEITADA', 'EXPIRADA'),
    allowNull: false,
    defaultValue: 'PENDENTE'
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observações sobre a cotação'
  },
  aprovado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User que aprovou/rejeitou'
  },
  data_aprovacao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  motivo_rejeicao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Informações adicionais
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Dados adicionais: condições de pagamento, frete, impostos, etc'
  },
  // Performance tracking
  data_entrega_real: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data real de entrega (para análise de performance)'
  },
  avaliacao_qualidade: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Avaliação da qualidade do produto entregue (1-5)'
  },
  avaliacao_prazo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Avaliação do cumprimento do prazo (1-5)'
  }
}, {
  tableName: 'supplier_quotations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['supplier_id']
    },
    {
      fields: ['produto_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['validade_cotacao']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    // Hook para marcar cotações expiradas
    beforeFind: async (options) => {
      // Verificar cotações expiradas
      const now = new Date();
      await SupplierQuotation.update(
        { status: 'EXPIRADA' },
        {
          where: {
            status: 'PENDENTE',
            validade_cotacao: {
              [sequelize.Sequelize.Op.lt]: now
            }
          }
        }
      );
    }
  }
});

// Métodos de instância
SupplierQuotation.prototype.isValid = function() {
  if (this.status !== 'PENDENTE') {
    return false;
  }
  if (!this.validade_cotacao) {
    return true;
  }
  return new Date() < new Date(this.validade_cotacao);
};

SupplierQuotation.prototype.calcularAtraso = function() {
  if (!this.data_entrega_real || !this.prazo_entrega_dias) {
    return null;
  }
  
  const dataEsperada = new Date(this.created_at);
  dataEsperada.setDate(dataEsperada.getDate() + this.prazo_entrega_dias);
  
  const dataReal = new Date(this.data_entrega_real);
  const diffTime = dataReal - dataEsperada;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays; // Positivo = atrasou, Negativo = adiantou
};

export default SupplierQuotation;
