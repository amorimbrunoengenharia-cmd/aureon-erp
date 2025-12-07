import { User, Tenant } from './models/index.js';

async function fixAllUsersTenant() {
  try {
    console.log('\n🔧 CORRIGINDO TENANT_ID PARA TODOS OS USUÁRIOS\n');
    
    // 1. Buscar todos os tenants
    const tenants = await Tenant.findAll();
    
    if (tenants.length === 0) {
      console.log('❌ Nenhum tenant encontrado! Execute: npm run seed');
      process.exit(1);
    }
    
    const firstTenant = tenants[0];
    console.log(`✅ Tenant encontrado: ${firstTenant.name} (${firstTenant.id})\n`);
    
    // 2. Buscar todos os usuários sem tenant_id
    const usersWithoutTenant = await User.findAll({
      where: {
        tenant_id: null
      }
    });
    
    if (usersWithoutTenant.length === 0) {
      console.log('✅ Todos os usuários já têm tenant_id configurado!');
      process.exit(0);
    }
    
    console.log(`⚠️  Encontrados ${usersWithoutTenant.length} usuário(s) sem tenant_id:\n`);
    
    // 3. Atualizar todos os usuários
    for (const user of usersWithoutTenant) {
      console.log(`   • ${user.username} (${user.role})`);
      await user.update({ tenant_id: firstTenant.id });
    }
    
    console.log(`\n✅ ${usersWithoutTenant.length} usuário(s) atualizado(s) com tenant_id: ${firstTenant.id}`);
    console.log(`   Tenant: ${firstTenant.name}\n`);
    
    // 4. Verificar todos os usuários
    const allUsers = await User.findAll();
    console.log('📋 LISTA COMPLETA DE USUÁRIOS:\n');
    
    for (const user of allUsers) {
      const status = user.tenant_id ? '✅' : '❌';
      console.log(`${status} ${user.username.padEnd(15)} | Role: ${user.role.padEnd(12)} | Tenant: ${user.tenant_id || 'NULL'}`);
    }
    
    console.log('\n🎉 CORREÇÃO CONCLUÍDA!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fixAllUsersTenant();
