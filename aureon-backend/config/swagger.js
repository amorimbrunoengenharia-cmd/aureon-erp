import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AUREON ERP API',
      version: '1.0.0',
      description: `
# AUREON ERP API Documentation

Sistema ERP completo para gestão de óticas com módulos de:
- 💰 **Financeiro**: DRE, Fluxo de Caixa, Indicadores, Projeções
- 📦 **Estoque**: Controle de produtos, movimentações, alertas
- 🛒 **Vendas**: PDV, prescrições, marketplace integrado
- 👥 **Clientes**: CRM, histórico, análises
- 📊 **Analytics**: Dashboards, relatórios, insights

## 🚀 Início Rápido

1. Faça login em \`/api/auth/login\` com credenciais padrão:
   - Username: \`admin\`
   - Password: \`admin123\`

2. Use o \`accessToken\` retornado no header:
   \`\`\`
   Authorization: Bearer seu-token-aqui
   \`\`\`

3. Explore os endpoints abaixo!

## 🔐 Autenticação

Todos os endpoints (exceto login) requerem JWT token no header Authorization.

## 🏢 Multi-Tenant

O tenant é identificado automaticamente via JWT. Opcionalmente pode enviar header \`X-Tenant-ID\`.

## 📝 Mais Informações

- [Developer Guide](../DEVELOPER_GUIDE.md)
- [GitHub Repository](https://github.com/seu-org/aureon-erp)
      `,
      contact: {
        name: 'AUREON Development Team',
        email: 'dev@aureon.com',
        url: 'https://aureon.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.aureon.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string', example: 'admin' },
            email: { type: 'string', format: 'email', example: 'admin@aureon.com' },
            role: { 
              type: 'string', 
              enum: ['CEO', 'VENDAS', 'ESTOQUE', 'COMPRAS', 'FINANCEIRO'],
              example: 'CEO'
            },
            active: { type: 'boolean', default: true },
            created_at: { type: 'string', format: 'date-time' },
            last_login: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nome: { type: 'string', example: 'Lente Progressiva Varilux' },
            sku: { type: 'string', example: 'LPV001' },
            descricao: { type: 'string' },
            categoria: { 
              type: 'string', 
              enum: ['lentes', 'armacoes', 'acessorios', 'medicamentos'],
              example: 'lentes'
            },
            tipo: { type: 'string', example: 'progressiva' },
            preco_venda: { type: 'number', format: 'float', example: 450.00 },
            preco_custo: { type: 'number', format: 'float', example: 250.00 },
            estoque: { type: 'integer', example: 15 },
            active: { type: 'boolean', default: true }
          }
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nome: { type: 'string', example: 'João Silva' },
            email: { type: 'string', format: 'email', example: 'joao@email.com' },
            telefone: { type: 'string', example: '(11) 98765-4321' },
            cpf: { type: 'string', example: '123.456.789-00' },
            endereco: { type: 'string' },
            categoria: { type: 'string', enum: ['VIP', 'regular', 'ocasional'] },
            origem: { type: 'string', enum: ['loja_fisica', 'online', 'indicacao'] },
            total_compras: { type: 'number', format: 'float', example: 1500.00 },
            total_pedidos: { type: 'integer', example: 3 },
            active: { type: 'boolean', default: true }
          }
        },
        Sale: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            produto: { type: 'string', example: 'Lente Progressiva' },
            produto_id: { type: 'string', format: 'uuid' },
            cliente_id: { type: 'string', format: 'uuid' },
            vendedor_id: { type: 'string', format: 'uuid' },
            vendedor: { type: 'string', example: 'admin' },
            valor_venda: { type: 'number', format: 'float', example: 450.00 },
            quantidade: { type: 'integer', example: 1 },
            desconto: { type: 'number', format: 'float', default: 0 },
            forma_pagamento: { type: 'string', enum: ['dinheiro', 'pix', 'credito', 'debito', 'boleto'] },
            canal: { type: 'string', enum: ['loja_fisica', 'mercado_livre', 'whatsapp', 'site'] },
            status: { type: 'string', enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
            data_venda: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            details: { type: 'object' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            pages: { type: 'integer', example: 10 },
            limit: { type: 'integer', example: 10 }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Products',
        description: 'Product management endpoints'
      },
      {
        name: 'Clients',
        description: 'Client management endpoints'
      },
      {
        name: 'Sales',
        description: 'Sales transaction endpoints'
      },
      {
        name: 'Inventory',
        description: 'Inventory and stock management'
      },
      {
        name: 'Finance',
        description: 'Financial transactions and reports'
      },
      {
        name: 'Analytics',
        description: 'Sales analytics and reporting'
      },
      {
        name: 'Backup',
        description: 'Backup and restore operations'
      },
      {
        name: 'Audit',
        description: 'Audit trail and logging'
      },
      {
        name: 'Search',
        description: 'Advanced search and filters'
      },
      {
        name: 'Email',
        description: 'Email notification services'
      },
      {
        name: 'Prescriptions',
        description: 'Medical prescription management'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './docs/*.js'  // Include docs folder for schemas
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
export const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { font-size: 36px; }
    .swagger-ui .scheme-container { 
      background: #1f8ef1; 
      box-shadow: 0 1px 2px 0 rgba(0,0,0,.15);
    }
  `,
  customSiteTitle: 'AUREON ERP API Documentation',
  customfavIcon: '/favicon.ico'
};

export default { swaggerSpec, swaggerUi, swaggerUiOptions };
