# Política de Segurança

## 🛡️ Versões Suportadas

Mantemos suporte de segurança para as seguintes versões do AUREON ERP:

| Versão | Suportada          |
| ------ | ------------------ |
| 2.0.x  | :white_check_mark: |
| 1.x.x  | :x:                |
| < 1.0  | :x:                |

## 🔒 Reportando uma Vulnerabilidade

A segurança do AUREON ERP é levada muito a sério. Agradecemos seus esforços para divulgar responsavelmente suas descobertas e faremos todos os esforços para reconhecer suas contribuições.

### Como Reportar

**NÃO** crie uma issue pública para vulnerabilidades de segurança.

Em vez disso, reporte vulnerabilidades de segurança através de:

1. **GitHub Security Advisories** (Recomendado)
   - Acesse: https://github.com/amorimbrunoengenharia-cmd/aureon-erp/security/advisories
   - Clique em "Report a vulnerability"
   - Preencha os detalhes da vulnerabilidade

2. **Email Privado**
   - Envie para: security@aureon-erp.com (ou email do mantenedor)
   - Assunto: `[SECURITY] Descrição breve da vulnerabilidade`

### Informações a Incluir

Para nos ajudar a entender e resolver o problema rapidamente, inclua:

- **Tipo de vulnerabilidade** (ex: XSS, SQL Injection, CSRF, etc.)
- **Localização**: Arquivo(s) e linha(s) de código afetados
- **Passos para reproduzir**: Instruções detalhadas
- **Impacto potencial**: O que um atacante poderia fazer
- **Versão afetada**: Qual versão do AUREON ERP você testou
- **Ambiente**: Navegador, SO, Node.js version, etc.
- **Prova de conceito**: Código ou screenshots (se possível)
- **Sugestões de correção**: Se você tiver (opcional)

### O Que Esperar

Após reportar uma vulnerabilidade:

1. **Confirmação em 48h**: Confirmaremos o recebimento do seu relatório
2. **Avaliação inicial em 1 semana**: Avaliaremos a severidade e impacto
3. **Atualizações regulares**: Manteremos você informado sobre o progresso
4. **Correção e divulgação**: Após a correção, coordenaremos a divulgação pública
5. **Reconhecimento**: Você será creditado no CHANGELOG (se desejar)

## 🏆 Programa de Reconhecimento

Embora não tenhamos um programa de bug bounty monetário, reconhecemos publicamente os pesquisadores de segurança que reportam vulnerabilidades:

- 🎖️ Menção no CHANGELOG e SECURITY.md
- 🌟 Badge especial de "Security Contributor" no GitHub
- 📝 Referência em nossos anúncios de segurança

## 🔐 Práticas de Segurança

### Para Desenvolvedores

Se você está contribuindo com código:

- ✅ **Nunca** comite credenciais, chaves API ou secrets
- ✅ Use variáveis de ambiente (`.env`) para dados sensíveis
- ✅ Valide e sanitize **todas** as entradas do usuário
- ✅ Use prepared statements para queries de banco de dados
- ✅ Implemente autenticação e autorização adequadas
- ✅ Mantenha dependências atualizadas (`npm audit`)
- ✅ Siga princípios de least privilege
- ✅ Revise código cuidadosamente antes de merge

### Para Usuários

Para manter sua instalação segura:

- ✅ Mantenha o AUREON ERP atualizado com a última versão
- ✅ Use senhas fortes e únicas para todas as contas
- ✅ Habilite autenticação de dois fatores (quando disponível)
- ✅ Revise regularmente logs de acesso e atividades suspeitas
- ✅ Configure HTTPS em produção
- ✅ Limite acesso à rede quando possível
- ✅ Faça backups regulares dos dados

## 🚨 Vulnerabilidades Conhecidas

Atualmente, **não há vulnerabilidades conhecidas** na versão 2.0.x.

Histórico de vulnerabilidades corrigidas:

- *Nenhuma ainda* - Este é o primeiro release de segurança

## 📋 Checklist de Segurança para Deploy

Antes de colocar em produção:

- [ ] Variáveis de ambiente configuradas (não hardcoded)
- [ ] HTTPS habilitado (certificado SSL válido)
- [ ] Senhas padrão alteradas
- [ ] API keys rotacionadas e seguras
- [ ] CORS configurado adequadamente
- [ ] Rate limiting habilitado
- [ ] Logs de segurança configurados
- [ ] Backup automatizado configurado
- [ ] Firewall configurado (portas mínimas abertas)
- [ ] Dependências atualizadas (`npm audit fix`)

## 🔄 Atualizações de Segurança

Atualizações de segurança são lançadas conforme necessário:

- **Críticas**: Patch imediato (< 24h)
- **Altas**: Patch urgente (< 1 semana)
- **Médias**: Próxima minor release
- **Baixas**: Próxima major/minor release

Acompanhe através de:
- GitHub Security Advisories
- Release Notes no CHANGELOG.md
- GitHub Watch → Custom → Security alerts

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://react.dev/learn/security)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

## 📞 Contato

- **Security Team**: security@aureon-erp.com
- **GitHub Security**: https://github.com/amorimbrunoengenharia-cmd/aureon-erp/security
- **Maintainer**: @amorimbrunoengenharia-cmd

---

**Divulgação Responsável**: Pedimos que você nos dê um tempo razoável para corrigir vulnerabilidades antes de divulgá-las publicamente. Trabalhamos ativamente para resolver problemas de segurança o mais rápido possível.

Obrigado por ajudar a manter o AUREON ERP seguro! 🙏
