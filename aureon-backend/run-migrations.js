/**
 * Script para executar migrações SQL no banco SQLite
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const migrationsPath = path.join(__dirname, 'migrations');

console.log('🔧 Executando migrações SQL...\n');

// Conectar ao banco
const db = new Database(dbPath);

// Criar tabela de controle de migrações se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Pegar migrações já executadas
const executedMigrations = db.prepare('SELECT filename FROM migrations').all().map(m => m.filename);

// Listar arquivos de migração (apenas 004 em diante - prescrições)
const migrationFiles = fs.readdirSync(migrationsPath)
  .filter(file => file.endsWith('.sql'))
  .filter(file => file >= '004-') // Apenas migrations de prescrições
  .sort(); // Ordem alfabética

console.log(`📁 Encontradas ${migrationFiles.length} migrações de prescrições\n`);

let executed = 0;
let skipped = 0;

// Executar cada migração
for (const filename of migrationFiles) {
  if (executedMigrations.includes(filename)) {
    console.log(`⏭️  Pulando ${filename} (já executada)`);
    skipped++;
    continue;
  }

  const filePath = path.join(migrationsPath, filename);
  let sql = fs.readFileSync(filePath, 'utf-8');

  try {
    console.log(`⚙️  Executando ${filename}...`);
    
    // Adaptar SQL do PostgreSQL para SQLite
    sql = sql
      .replace(/UUID/g, 'TEXT') // UUID vira TEXT no SQLite
      .replace(/JSONB/g, 'TEXT') // JSONB vira TEXT no SQLite
      .replace(/ADD COLUMN IF NOT EXISTS/g, 'ADD COLUMN') // SQLite não tem IF NOT EXISTS em ALTER
      .replace(/COMMENT ON .+;/g, '') // Remover COMMENT ON (não suportado)
      .replace(/ENUM\([^)]+\)/g, 'TEXT') // ENUM vira TEXT
      .replace(/SERIAL/g, 'INTEGER') // SERIAL vira INTEGER
      .replace(/IF NOT EXISTS/gi, '') // Remover IF NOT EXISTS de CREATE INDEX
      .replace(/CREATE INDEX\s+/gi, 'CREATE INDEX IF NOT EXISTS '); // Adicionar de volta IF NOT EXISTS
    
    // Dividir SQL em statements individuais (separados por ;)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    db.transaction(() => {
      for (const statement of statements) {
        if (statement.length > 0) {
          try {
            db.exec(statement);
          } catch (err) {
            // Ignorar erros de coluna já existente
            if (!err.message.includes('duplicate column name')) {
              throw err;
            }
          }
        }
      }
      // Marcar como executada
      db.prepare('INSERT OR IGNORE INTO migrations (filename) VALUES (?)').run(filename);
    })();

    console.log(`✅ ${filename} executada com sucesso\n`);
    executed++;
  } catch (error) {
    console.error(`❌ Erro ao executar ${filename}:`);
    console.error(error.message);
    console.error('\n');
    process.exit(1);
  }
}

db.close();

console.log('\n🎉 Migrações concluídas!');
console.log(`   ✅ Executadas: ${executed}`);
console.log(`   ⏭️  Puladas: ${skipped}`);
console.log(`   📊 Total: ${migrationFiles.length}\n`);
