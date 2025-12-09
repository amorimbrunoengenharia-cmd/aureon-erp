import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Prescription extends Model {}

Prescription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    cliente_nome: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    // Olho Direito (OD)
    od: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        esferico: 0,
        cilindrico: 0,
        eixo: 0,
        dnp: 0,
        adicao: 0
      }
    },
    // Olho Esquerdo (OE)
    oe: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        esferico: 0,
        cilindrico: 0,
        eixo: 0,
        dnp: 0,
        adicao: 0
      }
    },
    medico_nome: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    medico_crm: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    medico_uf: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    tipo_lente: {
      type: DataTypes.ENUM('Monofocal', 'Bifocal', 'Multifocal', 'Progressiva'),
      allowNull: false,
      defaultValue: 'Monofocal'
    },
    data_emissao: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    data_validade: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ativa', 'expirada', 'cancelada'),
      defaultValue: 'ativa'
    },
    anexos: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    pedidos_associados: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    lgpd_consentimento: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    lgpd_consentimento_data: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    trace_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'For correlating with events and operations'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional metadata for AI/ML: {confidence, source, ai_recommendations}'
    }
  },
  {
    sequelize,
    modelName: 'Prescription',
    tableName: 'prescriptions',
    indexes: [
      { fields: ['cliente_id'] },
      { fields: ['status'] },
      { fields: ['data_validade'] },
      { fields: ['trace_id'] },
      { fields: ['created_at'] }
    ]
  }
);

export default Prescription;
