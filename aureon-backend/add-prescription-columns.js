import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

try {
  db.exec('ALTER TABLE prescriptions ADD COLUMN trace_id TEXT');
  console.log('✅ Coluna trace_id adicionada');
} catch (e) {
  console.log('⚠️  trace_id:', e.message);
}

try {
  db.exec("ALTER TABLE prescriptions ADD COLUMN metadata TEXT DEFAULT '{}'");
  console.log('✅ Coluna metadata adicionada');
} catch (e) {
  console.log('⚠️  metadata:', e.message);
}

try {
  db.exec('CREATE INDEX IF NOT EXISTS idx_prescriptions_trace_id ON prescriptions(trace_id)');
  console.log('✅ Index trace_id criado');
} catch (e) {
  console.log('⚠️  index:', e.message);
}

db.close();
console.log('\n✅ Tabela prescriptions atualizada!');
