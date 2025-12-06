import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class SavedSearch extends Model {}

SavedSearch.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nome da busca salva'
    },
    entity: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Entidade: products, clients, sales, suppliers'
    },
    query: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Termo de busca'
    },
    filters: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON dos filtros aplicados'
    },
    is_favorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Busca favorita'
    },
    use_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Contador de uso'
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última vez que foi usada'
    }
  },
  {
    sequelize,
    modelName: 'SavedSearch',
    tableName: 'saved_searches',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['entity'] },
      { fields: ['is_favorite'] },
      { 
        fields: ['user_id', 'entity'],
        name: 'saved_search_user_entity_idx'
      },
      {
        fields: ['user_id', 'is_favorite'],
        name: 'saved_search_favorites_idx'
      }
    ]
  }
);

export default SavedSearch;
