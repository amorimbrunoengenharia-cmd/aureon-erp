-- Seeds simplificados para testes de prescrição
-- Usa schema existente do banco

-- Verificar se temos clients e prescriptions
-- Se não existir, você pode criar manualmente via interface

-- Exemplo de como adicionar trace_id a prescrições existentes
UPDATE prescriptions 
SET trace_id = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))
WHERE trace_id IS NULL;

-- Adicionar metadata vazio para prescrições sem metadata
UPDATE prescriptions 
SET metadata = '{}'
WHERE metadata IS NULL OR metadata = '';

-- Exemplo de INSERT em patient_history (ajuste os IDs conforme seu banco)
-- Descomente e ajuste os UUIDs para seus dados reais:

/*
INSERT INTO patient_history (
  id, 
  patient_id, 
  event_type, 
  related_id, 
  trace_id, 
  metadata, 
  actor_id, 
  occurred_at, 
  severity, 
  flags, 
  created_at, 
  updated_at
) VALUES (
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
  'SEU-CLIENT-UUID-AQUI',
  'prescription',
  'SEU-PRESCRIPTION-UUID-AQUI',
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
  '{"od": {"esferico": -2.0}, "oe": {"esferico": -2.25}}',
  NULL,
  datetime('now'),
  'low',
  '[]',
  datetime('now'),
  datetime('now')
);
*/

-- Verificar dados atuais
SELECT 'Clients:' as info, COUNT(*) as count FROM clients
UNION ALL
SELECT 'Prescriptions:', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'Prescriptions with trace_id:', COUNT(*) FROM prescriptions WHERE trace_id IS NOT NULL
UNION ALL
SELECT 'Patient History:', COUNT(*) FROM patient_history
UNION ALL
SELECT 'Prescription Versions:', COUNT(*) FROM prescription_versions
UNION ALL
SELECT 'Events:', COUNT(*) FROM events;
