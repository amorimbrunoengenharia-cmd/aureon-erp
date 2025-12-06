/**
 * Jest Configuration
 * Configuração para testes do AUREON ERP Backend
 */

export default {
  // Usar node como ambiente de teste
  testEnvironment: 'node',

  // Suporte para módulos ES6
  transform: {},

  // Padrão de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Arquivos para ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'middlewares/**/*.js',
    'models/**/*.js',
    '!models/index.js',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],

  // Thresholds de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Timeout para testes (aumentado para operações de banco)
  testTimeout: 10000,

  // Mostrar cada teste individual
  verbose: true,

  // Força a saída do Jest após todos os testes
  forceExit: true,

  // Detecta memory leaks
  detectOpenHandles: true,

  // Limpa mocks automaticamente entre testes
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
