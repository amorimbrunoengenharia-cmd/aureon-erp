import { useEffect } from 'react';

/**
 * Componente utilitário para garantir que todos os usuários padrão existam
 * Executa apenas uma vez quando o app carrega
 */
export default function EnsureDefaultUsers() {
  useEffect(() => {
    const usuariosPadrao = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123',
        role: 'CEO',
        email: 'ceo@aureon.com',
        active: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        id: 2,
        username: 'estoque',
        password: 'estoque123',
        role: 'ESTOQUE',
        email: 'estoque@aureon.com',
        active: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        id: 3,
        username: 'compras',
        password: 'compras123',
        role: 'COMPRAS',
        email: 'compras@aureon.com',
        active: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        id: 4,
        username: 'vendedor',
        password: 'vendedor123',
        role: 'VENDAS',
        email: 'vendedor@aureon.com',
        active: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      },
      {
        id: 5,
        username: 'financeiro',
        password: 'financeiro123',
        role: 'FINANCEIRO',
        email: 'financeiro@aureon.com',
        active: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      }
    ];

    // Verificar se os usuários já existem
    const storedUsers = localStorage.getItem('aureon_users');
    
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      
      // Verificar se o usuário financeiro existe
      const hasFinanceiro = users.some(u => u.username === 'financeiro');
      
      if (!hasFinanceiro) {
        // Adicionar usuário financeiro
        const updatedUsers = [...users, usuariosPadrao[4]];
        localStorage.setItem('aureon_users', JSON.stringify(updatedUsers));
        console.log('✅ Usuário financeiro adicionado aos usuários existentes');
      }
      
      // Verificar se todos os 5 usuários existem
      if (users.length < 5) {
        // Garantir que todos os usuários padrão existem
        usuariosPadrao.forEach(padrao => {
          const existe = users.some(u => u.username === padrao.username);
          if (!existe) {
            users.push(padrao);
          }
        });
        localStorage.setItem('aureon_users', JSON.stringify(users));
        console.log('✅ Usuários padrão sincronizados');
      }
    } else {
      // Primeira execução: criar todos os usuários
      localStorage.setItem('aureon_users', JSON.stringify(usuariosPadrao));
      console.log('✅ Usuários padrão criados');
    }
  }, []);

  return null; // Componente invisível
}
