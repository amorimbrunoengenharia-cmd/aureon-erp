/**
 * Script para popular banco com seeds de prescrições
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const seedsPath = path.join(__dirname, '..', 'aureon-os', 'simulator', 'seeds', 'prescriptions.sql');

console.log('🌱 Populando banco com seeds de prescrições...\n');

// Conectar ao banco
const db = new Database(dbPath);

// Ler arquivo de seeds
let sql = fs.readFileSync(seedsPath, 'utf-8');

// Adaptar SQL do PostgreSQL para SQLite
sql = sql
  .replace(/UUID/g, 'TEXT')
  .replace(/JSONB/g, 'TEXT')
  .replace(/NOW\(\)/g, "datetime('now')")
  .replace(/::jsonb/g, '')
  .replace(/TIMESTAMP WITH TIME ZONE/g, 'DATETIME')
  .replace(/gen_random_uuid\(\)/g, "lower(hex(randomblob(16)))")
  .replace(/ON CONFLICT[^;]+;/g, ';') // Remover ON CONFLICT (não é crítico)
  .replace(/-- [\s\S]*?(?=INSERT|SELECT|$)/g, ''); // Remover comentários longos

try {
  // Dividir em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.startsWith('INSERT'));

  console.log(`📊 Encontrados ${statements.length} INSERTs\n`);

  let inserted = 0;

  db.transaction(() => {
    for (const statement of statements) {
      try {
        db.exec(statement);
        inserted++;
        
        // Identificar qual tabela
        const match = statement.match(/INSERT INTO (\w+)/);
        if (match) {
          console.log(`✅ Inserido em ${match[1]}`);
        }
      } catch (err) {
        // Ignorar erros de constraint (registro já existe)
        if (!err.message.includes('UNIQUE constraint') && 
            !err.message.includes('FOREIGN KEY constraint')) {
          console.log(`⚠️  Aviso: ${err.message}`);
        }
      }
    }
  })();

  console.log(`\n🎉 Seeds populados com sucesso!`);
  console.log(`   ✅ Inseridos: ${inserted} registros\n`);

  // Verificar contagens
  console.log('📈 Contagens finais:');
  const counts = {
    clients: db.prepare('SELECT COUNT(*) as count FROM clients WHERE lgpd_consentimento = 1').get(),
    prescriptions: db.prepare('SELECT COUNT(*) as count FROM prescriptions').get(),
    patient_history: db.prepare('SELECT COUNT(*) as count FROM patient_history').get(),
    prescription_versions: db.prepare('SELECT COUNT(*) as count FROM prescription_versions').get(),
    events: db.prepare('SELECT COUNT(*) as count FROM events').get()
  };

  Object.entries(counts).forEach(([table, result]) => {
    console.log(`   ${table}: ${result.count}`);
  });

} catch (error) {
  console.error('❌ Erro ao popular seeds:');
  console.error(error.message);
  process.exit(1);
} finally {
  db.close();
}
