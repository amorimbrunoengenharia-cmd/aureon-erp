# Configuração da API OpenAI para AUREON ERP

## 📋 Pré-requisitos

1. Conta na OpenAI (https://platform.openai.com)
2. Créditos adicionados ($5-10 recomendado)
3. API Key gerada

## 🔑 Como Obter a API Key

1. Acesse: https://platform.openai.com/api-keys
2. Faça login ou crie uma conta
3. Clique em "Create new secret key"
4. Copie a chave (formato: `sk-proj-...`)
5. **IMPORTANTE**: Guarde a chave em local seguro, ela aparece apenas uma vez

## ⚙️ Configuração no Projeto

### Passo 1: Criar arquivo .env
```bash
cd "C:\Users\Usuario\Desktop\Projeto AUREON ERP\aureon-os"
copy .env.example .env
```

### Passo 2: Editar .env
Abra o arquivo `.env` e adicione sua chave:
```
VITE_OPENAI_API_KEY=sk-proj-SUA_CHAVE_AQUI
```

### Passo 3: Reiniciar o servidor
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

## 💰 Custos Estimados

| Operação | Custo Aproximado |
|----------|------------------|
| 1 boleto processado | $0.01 USD |
| 100 boletos | $1.00 USD |
| 1000 boletos | $10.00 USD |

**Modelo usado**: GPT-4o (10x mais barato que GPT-4)

## 🧪 Teste sem API Key

O sistema funciona sem API key configurada:
- Usa dados simulados (mock)
- Exibe aviso nos logs
- Permite testar fluxo completo

## 🔒 Segurança

- ✅ API Key armazenada em `.env` (não commitada no Git)
- ✅ Variáveis VITE_ são expostas apenas no build
- ✅ Comunicação HTTPS com OpenAI
- ⚠️ Nunca exponha a API Key em código-fonte público

## 📊 Monitoramento de Uso

Acompanhe o uso em: https://platform.openai.com/usage

## 🆘 Problemas Comuns

### Erro: "API Key inválida"
- Verifique se copiou a chave corretamente
- Confirme que tem créditos na conta OpenAI

### Erro: "Rate limit exceeded"
- Você atingiu o limite de requisições
- Aguarde alguns minutos ou upgrade o plano

### Erro: "Insufficient quota"
- Adicione créditos em: https://platform.openai.com/account/billing

## 📝 Exemplo de Resposta da IA

```json
{
  "descricao": "Conta de Energia Elétrica - Novembro/2024",
  "valor": "287.45",
  "dataVencimento": "2024-12-15",
  "fornecedor": "CEMIG - Companhia Energética de Minas Gerais",
  "categoria": "Energia",
  "observacoes": "Referente ao consumo de 450 kWh"
}
```

## 🔄 Alternativas Futuras

Se quiser trocar de provedor:
- **Anthropic Claude**: Melhor em português
- **Google Gemini**: Grátis até 1000/mês
- **Azure OpenAI**: Para empresas

## 📞 Suporte

Dúvidas sobre a API OpenAI:
- Documentação: https://platform.openai.com/docs
- Status: https://status.openai.com
