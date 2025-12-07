/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtido no endpoint /api/auth/login
 *   
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Validation failed
 *         message:
 *           type: string
 *           example: Invalid email format
 *         details:
 *           type: object
 *     
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: admin
 *         password:
 *           type: string
 *           format: password
 *           example: admin123
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refreshToken:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *               enum: [admin, gerente, vendedor, financeiro, estoque]
 *             tenant_id:
 *               type: string
 *               format: uuid
 *     
 *     FinancialDashboard:
 *       type: object
 *       properties:
 *         dre:
 *           type: object
 *           description: Demonstração de Resultado do Exercício
 *           properties:
 *             receita_bruta:
 *               type: number
 *               format: float
 *             receita_liquida:
 *               type: number
 *             custos:
 *               type: number
 *             lucro_bruto:
 *               type: number
 *             despesas:
 *               type: object
 *             lucro_liquido:
 *               type: number
 *         cashFlow:
 *           type: object
 *           description: Fluxo de Caixa
 *           properties:
 *             periodos:
 *               type: array
 *               items:
 *                 type: object
 *             totalRecebimentos:
 *               type: number
 *             totalPagamentos:
 *               type: number
 *         indicators:
 *           type: object
 *           description: Indicadores Financeiros
 *           properties:
 *             ticketMedio:
 *               type: number
 *             margemLucro:
 *               type: number
 *             roe:
 *               type: number
 *             roi:
 *               type: number
 *   
 *   parameters:
 *     TenantHeader:
 *       in: header
 *       name: X-Tenant-ID
 *       schema:
 *         type: string
 *         format: uuid
 *       required: false
 *       description: ID do tenant (opcional, pode ser identificado automaticamente via JWT)
 *     
 *     StartDate:
 *       in: query
 *       name: startDate
 *       schema:
 *         type: string
 *         format: date
 *       required: true
 *       example: 2025-01-01
 *       description: Data início (formato YYYY-MM-DD)
 *     
 *     EndDate:
 *       in: query
 *       name: endDate
 *       schema:
 *         type: string
 *         format: date
 *       required: true
 *       example: 2025-12-31
 *       description: Data fim (formato YYYY-MM-DD)
 *     
 *     Page:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         default: 1
 *       description: Número da página
 *     
 *     Limit:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         default: 20
 *         maximum: 100
 *       description: Itens por página
 *   
 *   responses:
 *     Unauthorized:
 *       description: Não autenticado - Token inválido ou ausente
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: Unauthorized
 *             message: No token provided
 *     
 *     Forbidden:
 *       description: Sem permissão para acessar este recurso
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: Forbidden
 *             message: Role vendedor is not authorized
 *     
 *     NotFound:
 *       description: Recurso não encontrado
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: Not Found
 *             message: Resource not found
 *     
 *     BadRequest:
 *       description: Requisição inválida
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     
 *     InternalServerError:
 *       description: Erro interno do servidor
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: Internal Server Error
 *             message: An unexpected error occurred
 * 
 * tags:
 *   - name: Authentication
 *     description: Endpoints de autenticação (login, logout, refresh token)
 *   - name: Financial
 *     description: Dashboard financeiro, DRE, fluxo de caixa, indicadores
 *   - name: Sales
 *     description: Gestão de vendas
 *   - name: Products
 *     description: Gestão de produtos
 *   - name: Clients
 *     description: Gestão de clientes
 *   - name: Inventory
 *     description: Gestão de estoque
 *   - name: Health
 *     description: Endpoints de saúde e monitoramento
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check simples
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 environment:
 *                   type: string
 */

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness probe
 *     description: Verifica se a API está pronta para receber requisições (database conectado)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API pronta
 *       503:
 *         description: API não está pronta (database offline, circuit breaker aberto)
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /api/financial/dashboard:
 *   get:
 *     summary: Dashboard financeiro completo
 *     description: Retorna DRE, fluxo de caixa, indicadores e projeções
 *     tags: [Financial]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantHeader'
 *       - $ref: '#/components/parameters/StartDate'
 *       - $ref: '#/components/parameters/EndDate'
 *     responses:
 *       200:
 *         description: Dashboard carregado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialDashboard'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       400:
 *         description: Tenant não identificado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Tenant not identified
 *               message: Please provide X-Tenant-ID header or use authenticated user
 */

export default {};
