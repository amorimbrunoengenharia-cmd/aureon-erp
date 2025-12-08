/**
 * Script para resetar usuários no localStorage
 * Execute no Console do Navegador (F12) com a aplicação aberta
 */

// Usuários padrão do sistema
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

// Salvar no localStorage
localStorage.setItem('aureon_users', JSON.stringify(usuariosPadrao));

// Limpar sessão atual
localStorage.removeItem('aureon_current_user');

console.log('✅ 5 usuários resetados com sucesso!');
console.log('👤 Usuários disponíveis:');
usuariosPadrao.forEach(u => {
  console.log(`   ${u.username} / ${u.password} (${u.role})`);
});
console.log('🔄 Recarregue a página (F5) para aplicar as mudanças');
