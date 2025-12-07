import { User, Tenant } from './models/index.js';

async function checkTenant() {
  try {
    // Buscar admin
    const admin = await User.findOne({ where: { username: 'admin' } });
    
    if (!admin) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }

    console.log('\n=== USUÁRIO ADMIN ===');
    console.log('ID:', admin.id);
    console.log('Username:', admin.username);
    console.log('Role:', admin.role);
    console.log('Tenant ID:', admin.tenant_id || '❌ NULL');

    if (!admin.tenant_id) {
      console.log('\n⚠️  PROBLEMA: tenant_id está NULL!');
      console.log('Buscando tenants disponíveis...\n');
      
      const tenants = await Tenant.findAll();
      if (tenants.length === 0) {
        console.log('❌ Nenhum tenant encontrado no banco!');
        console.log('Execute: npm run seed para criar dados de teste');
      } else {
        console.log(`✅ Encontrados ${tenants.length} tenant(s):`);
        tenants.forEach(t => {
          console.log(`  - ID: ${t.id} | Nome: ${t.name} | Slug: ${t.slug}`);
        });
        
        // Atualizar admin com o primeiro tenant
        const firstTenant = tenants[0];
        await admin.update({ tenant_id: firstTenant.id });
        console.log(`\n✅ Admin atualizado com tenant_id: ${firstTenant.id}`);
        console.log(`   Tenant: ${firstTenant.name}`);
      }
    } else {
      console.log('\n✅ tenant_id está configurado corretamente!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkTenant();
