import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Use SQLite or PostgreSQL based on USE_POSTGRES env var (not automatic in production)
const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = process.env.USE_POSTGRES === 'true';

// PostgreSQL SSL configuration for production
const sslConfig = isProduction && process.env.DB_SSL === 'true'
  ? {
      require: true,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    }
  : false;

export const sequelize = usePostgres
  ? new Sequelize(
      process.env.DB_NAME || 'aureon_erp',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          ssl: sslConfig,
          ...(isProduction && {
            statement_timeout: 30000, // 30 seconds
            idle_in_transaction_session_timeout: 60000 // 60 seconds
          })
        },
        pool: {
          max: parseInt(process.env.DB_POOL_MAX) || 20,
          min: parseInt(process.env.DB_POOL_MIN) || 5,
          acquire: 30000,
          idle: 10000,
          evict: 10000
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true
        },
        retry: {
          max: 3,
          match: [
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/
          ]
        }
      }
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    });

export default sequelize;
