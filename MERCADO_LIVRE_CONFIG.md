# Integração Mercado Livre - Configuração

## ✅ Credenciais Configuradas

- **Client ID:** `4040995724027537`
- **Client Secret:** `0NdiRkBz4TLIEQ9s6FCzkW9ho5r995kT`
- **Redirect URI:** `http://localhost:5173/mercado-livre/callback`

## 📋 Próximos Passos

### 1. Configurar Redirect URI no Mercado Livre

1. Acesse: https://developers.mercadolivre.com.br/devcenter
2. Vá em **"Suas aplicações"**
3. Clique na sua aplicação (ID: 4040995724027537)
4. Em **"Redirect URI"**, adicione:
   ```
   http://localhost:5173/mercado-livre/callback
   ```
5. Salve as alterações

### 2. Testar Integração

1. Abra o sistema AUREON ERP
2. Vá na aba **"Mercado Livre"**
3. Clique em **"Conectar com Mercado Livre"**
4. Você será redirecionado para página de autorização
5. Faça login e autorize o aplicativo
6. Você será redirecionado de volta automaticamente
7. ✅ Integração concluída!

## 🔄 Como Funciona

### Fluxo OAuth 2.0

```
1. Usuário clica "Conectar"
   ↓
2. Redirecionado para auth.mercadolivre.com.br
   ↓
3. Faz login e autoriza
   ↓
4. Mercado Livre redireciona para: 
   http://localhost:5173/mercado-livre/callback?code=TG-xxxxx
   ↓
5. Sistema troca código por token
   ↓
6. Token salvo no localStorage
   ↓
7. ✅ Conectado! Pode buscar pedidos, produtos, etc.
```

## 🚀 Funcionalidades Disponíveis

Após conectar, você poderá:

- ✅ Buscar pedidos automaticamente
- ✅ Sincronizar status de pedidos
- ✅ Ver detalhes de produtos vendidos
- ✅ Importar pedidos para o sistema
- ✅ Atualizar estoque automaticamente

## 🔐 Segurança

- Tokens são salvos no navegador (localStorage)
- Client Secret está no código (apenas para desenvolvimento)
- **PRODUÇÃO:** Mova credenciais para variáveis de ambiente

## ⚠️ Importante

### Para Produção (ngrok ou servidor real):

Você precisará adicionar mais Redirect URIs:

1. Com ngrok: `https://seu-dominio.ngrok-free.app/mercado-livre/callback`
2. Com domínio: `https://aureon-os.com.br/mercado-livre/callback`

Adicione todos os URIs possíveis no painel do Mercado Livre!

## 🆘 Troubleshooting

### Erro: "redirect_uri mismatch"
- Verifique se adicionou a URI exata no painel do ML
- URI deve incluir `http://` ou `https://`
- Não pode ter barra `/` no final

### Erro: "invalid_client"
- Verifique Client ID e Secret
- Confirme que a aplicação está ativa

### Token expira
- Tokens duram 6 horas
- Sistema renova automaticamente com refresh_token
- Se expirar, basta reconectar

## 📞 Suporte

Documentação oficial: https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
