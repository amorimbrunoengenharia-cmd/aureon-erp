# 📧 Email Notifications - AUREON ERP

Sistema completo de notificações por email com templates HTML profissionais e integração SMTP.

## 🌟 Features

### Email Types
1. **Welcome Email** - Boas-vindas para novos usuários
2. **Order Confirmation** - Confirmação de pedidos com detalhes
3. **Low Stock Alert** - Alertas de estoque baixo
4. **Password Reset** - Reset de senha com token
5. **Payment Reminder** - Lembretes de pagamento
6. **Backup Notification** - Notificações de backup

### Template Features
- ✅ Design responsivo (mobile-friendly)
- ✅ Inline CSS para máxima compatibilidade
- ✅ Headers com gradients CSS
- ✅ Tables para dados estruturados
- ✅ Call-to-action buttons
- ✅ Fallback automático text/plain
- ✅ Branding consistente

---

## 📡 API Endpoints

### 1. POST /api/email/test
**Descrição:** Envia email de teste  
**Auth:** Required (CEO only)  
**Body:**
```json
{
  "to": "test@example.com",
  "subject": "Teste - AUREON ERP",
  "message": "Este é um email de teste"
}
```

**Response:**
```json
{
  "message": "Test email sent",
  "success": true,
  "messageId": "<message-id>"
}
```

**PowerShell:**
```powershell
$token = "your_jwt_token"
$body = @{
  to = "test@example.com"
  subject = "Teste"
  message = "Mensagem de teste"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/email/test" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Body $body `
  -ContentType "application/json"
```

---

### 2. POST /api/email/welcome
**Descrição:** Envia email de boas-vindas  
**Auth:** Required (CEO only)  
**Body:**
```json
{
  "userId": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "role": "USER"
}
```

**Response:**
```json
{
  "message": "Welcome email sent",
  "success": true,
  "messageId": "<message-id>"
}
```

**Integração Automática:**
Enviado automaticamente quando um novo usuário é registrado via `POST /api/auth/register`.

---

### 3. POST /api/email/order-confirmation
**Descrição:** Envia confirmação de pedido  
**Auth:** Required  
**Body:**
```json
{
  "sale": {
    "id": 1,
    "produto": "Lente Progressiva",
    "valor_venda": 450.00,
    "quantidade": 1,
    "data_venda": "2025-01-23T10:30:00Z",
    "status": "completed",
    "canal": "loja_fisica"
  },
  "client": {
    "nome": "João Silva",
    "email": "joao@example.com"
  }
}
```

**Response:**
```json
{
  "message": "Order confirmation email sent",
  "success": true,
  "messageId": "<message-id>"
}
```

**Integração Automática:**
Enviado automaticamente quando uma venda é criada via `POST /api/sales` (se cliente tiver email).

---

### 4. POST /api/email/low-stock-alert
**Descrição:** Envia alerta de estoque baixo  
**Auth:** Required (CEO ou ESTOQUE)  
**Body:**
```json
{
  "products": [
    {
      "name": "Lente Progressiva Varilux",
      "sku": "LPV001",
      "currentStock": 3,
      "threshold": 10
    },
    {
      "name": "Armação Ótica Premium",
      "sku": "AOP002",
      "currentStock": 0,
      "threshold": 5
    }
  ],
  "recipient": "manager@aureon.com"
}
```

**Response:**
```json
{
  "message": "Low stock alert sent",
  "success": true,
  "messageId": "<message-id>"
}
```

**Integração Automática:**
Enviado automaticamente para CEOs quando `alertService.checkLowStock()` detecta produtos com estoque baixo.

---

### 5. POST /api/email/payment-reminder
**Descrição:** Envia lembrete de pagamento  
**Auth:** Required (CEO ou FINANCEIRO)  
**Body:**
```json
{
  "client": {
    "nome": "Maria Santos",
    "email": "maria@example.com"
  },
  "transaction": {
    "id": 123,
    "tipo": "contas_receber",
    "valor": 850.00,
    "data_vencimento": "2025-02-15",
    "descricao": "Pagamento Pedido #456"
  }
}
```

**Response:**
```json
{
  "message": "Payment reminder sent",
  "success": true,
  "messageId": "<message-id>"
}
```

---

### 6. POST /api/email/backup-notification
**Descrição:** Envia notificação de backup concluído  
**Auth:** Required (CEO only)  
**Body:**
```json
{
  "result": {
    "success": true,
    "filename": "backup_20250123_143000.json",
    "metadata": {
      "total_records": 15423,
      "tables": 10,
      "duration_ms": 2345
    },
    "size_mb": "2.45"
  },
  "recipient": "admin@aureon.com"
}
```

**Response:**
```json
{
  "message": "Backup notification sent",
  "success": true,
  "messageId": "<message-id>"
}
```

**Integração Automática:**
Enviado automaticamente para CEOs quando um backup é concluído via `backupService.createFullBackup()`.

---

### 7. GET /api/email/status
**Descrição:** Verifica status do serviço de email  
**Auth:** Required  
**Response:**
```json
{
  "configured": true,
  "message": "Email service is configured and ready"
}
```

**PowerShell:**
```powershell
$token = "your_jwt_token"
Invoke-RestMethod -Uri "http://localhost:5000/api/email/status" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente (.env)

Adicione as seguintes variáveis ao arquivo `.env`:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_NAME=AUREON ERP
```

### 2. Gmail Configuration

Para usar Gmail, você precisa gerar uma **App Password**:

1. Acesse sua conta Google
2. Vá para "Segurança"
3. Ative "Verificação em duas etapas"
4. Vá para "Senhas de app"
5. Gere uma senha para "Email"
6. Use essa senha no campo `SMTP_PASS`

**⚠️ NUNCA use sua senha normal do Gmail!**

### 3. Outros Provedores SMTP

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM_NAME=AUREON ERP
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_aws_access_key_id
SMTP_PASS=your_aws_secret_access_key
SMTP_FROM_NAME=AUREON ERP
```

#### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
SMTP_FROM_NAME=AUREON ERP
```

---

## 🧪 Testando o Sistema

### 1. Verificar Configuração

```powershell
$token = "your_jwt_token"
Invoke-RestMethod -Uri "http://localhost:5000/api/email/status" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### 2. Enviar Email de Teste

```powershell
$token = "your_jwt_token"
$body = @{
  to = "your_email@example.com"
  subject = "Teste AUREON"
  message = "Sistema de email funcionando!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/email/test" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Body $body `
  -ContentType "application/json"
```

---

## 🎨 Templates HTML

Todos os templates incluem:

### Welcome Email
- Header com gradient (verde/azul)
- Saudação personalizada
- Informações da conta (username, role)
- Botão "Acessar Sistema"
- Footer com contato

### Order Confirmation
- Header com gradient (roxo/rosa)
- Dados do pedido (ID, data, status)
- Tabela com produtos e valores
- Totais e método de pagamento
- Informações de contato

### Low Stock Alert
- Header com gradient (laranja/vermelho)
- Tabela com produtos em baixa
- Indicação de estoque atual vs mínimo
- Produtos sem estoque destacados
- Call-to-action para reposição

### Payment Reminder
- Header com gradient (azul/índigo)
- Dados da transação
- Data de vencimento destacada
- Valor formatado em BRL
- Instruções de pagamento

### Backup Notification
- Header com gradient (verde/esmeralda)
- Status do backup (sucesso/falha)
- Estatísticas (registros, tabelas, tempo)
- Tamanho do arquivo
- Instruções de download

---

## 🔧 Integrações Automáticas

### Registro de Usuário
```javascript
// auth.routes.js - POST /api/auth/register
await emailService.sendWelcomeEmail(user);
```

### Confirmação de Pedido
```javascript
// sales.routes.js - POST /api/sales
if (client.email) {
  await emailService.sendOrderConfirmation(sale, client);
}
```

### Alerta de Estoque Baixo
```javascript
// alertService.js - checkLowStock()
const ceoUsers = await User.findAll({ where: { role: 'CEO' } });
for (const ceo of ceoUsers) {
  await emailService.sendLowStockAlert(products, ceo.email);
}
```

### Notificação de Backup
```javascript
// backupService.js - createFullBackup()
const ceoUsers = await User.findAll({ where: { role: 'CEO' } });
for (const ceo of ceoUsers) {
  await emailService.sendBackupNotification(result, ceo.email);
}
```

---

## 🚨 Troubleshooting

### Email não está sendo enviado

1. **Verifique a configuração:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/email/status"
```

2. **Verifique as variáveis de ambiente:**
```powershell
# No terminal do backend
node -e "console.log(process.env.SMTP_HOST, process.env.SMTP_USER)"
```

3. **Teste a conexão SMTP manualmente:**
```javascript
// No arquivo emailService.js, o método initialize() testa a conexão
// Verifique os logs do servidor
```

### Erro "Authentication failed"

- Verifique se você está usando **App Password** (não a senha normal)
- Confirme que a verificação em duas etapas está ativada
- Verifique se o email/usuário está correto

### Erro "Connection timeout"

- Verifique se a porta está correta (587 para TLS, 465 para SSL)
- Teste com `SMTP_SECURE=true` para porta 465
- Verifique firewall/antivírus

### Email vai para spam

- Configure SPF, DKIM e DMARC no seu domínio
- Use um provedor SMTP confiável (SendGrid, AWS SES)
- Evite palavras spam nos assuntos
- Mantenha uma lista de destinatários limpa

---

## 📊 Métricas

O sistema registra:
- ✅ Emails enviados com sucesso
- ❌ Falhas no envio (com erro detalhado)
- 📝 Todos os envios são logados via Winston

**Logs:**
```
✅ Order confirmation email sent to joao@example.com
✅ Low stock alert emails sent to 2 CEOs
❌ Failed to send welcome email: Error connecting to SMTP server
```

---

## 🔐 Segurança

### Best Practices

1. **NUNCA commite credenciais SMTP no código**
2. **Use variáveis de ambiente (.env)**
3. **Rotacione App Passwords periodicamente**
4. **Limite rate de envio (evite spam)**
5. **Valide emails antes de enviar**
6. **Use TLS/SSL para conexão segura**
7. **Monitore falhas de envio**

### Rate Limiting

O sistema usa o middleware `rateLimiter` que já limita requisições por IP.

Para adicionar rate limiting específico para emails:

```javascript
// Limitar 10 emails por hora por usuário
const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: 'Too many emails sent, please try again later'
});

router.post('/email/test', emailRateLimiter, authenticate, ...);
```

---

## 🚀 Performance

### Otimizações Implementadas

1. **Envio Assíncrono:** Emails não bloqueiam a resposta da API
2. **Fallback Gracioso:** Se email falhar, operação principal continua
3. **Logs Detalhados:** Facilita debugging
4. **Connection Pooling:** Nodemailer reutiliza conexões SMTP
5. **HTML + Text:** Fallback automático para clientes que não suportam HTML

### Recomendações

Para produção com alto volume:
- Use um serviço de fila (Bull, BullMQ)
- Implemente retry logic para falhas temporárias
- Use um provedor dedicado (SendGrid, AWS SES)
- Monitor delivery rates e bounces
- Implemente unsubscribe links

---

## 📚 Referências

- [Nodemailer Documentation](https://nodemailer.com/)
- [HTML Email Best Practices](https://www.emailonacid.com/blog/article/email-development/html-email-best-practices/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [SendGrid SMTP API](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [AWS SES SMTP](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)

---

## 📄 Arquivos Relacionados

- `services/emailService.js` - Serviço principal (525 linhas)
- `routes/email.routes.js` - API routes (154 linhas)
- `routes/auth.routes.js` - Integração de boas-vindas
- `routes/sales.routes.js` - Integração de confirmação
- `services/alertService.js` - Integração de alertas
- `services/backupService.js` - Integração de backups
- `.env.example` - Configuração SMTP
- `ApiService.js` (frontend) - 7 métodos de email
