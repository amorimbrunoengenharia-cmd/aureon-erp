-- ==================================================
-- PRESCRIPTION SEEDS FOR SIMULATOR
-- Sample data for testing prescription workflows
-- ==================================================

-- Sample Clients (with LGPD consent)
INSERT INTO clients (id, nome, cpf, email, telefone, data_nascimento, endereco, lgpd_consentimento, created_at, updated_at) VALUES
('11111111-1111-4111-a111-111111111111', 'Maria Silva', '123.456.789-01', 'maria.silva@example.com', '(11) 98765-4321', '1985-03-15', '{"rua": "Av. Paulista", "numero": "1000", "cidade": "São Paulo", "estado": "SP", "cep": "01310-100"}', true, NOW(), NOW()),
('22222222-2222-4222-a222-222222222222', 'João Santos', '234.567.890-12', 'joao.santos@example.com', '(21) 97654-3210', '1990-07-22', '{"rua": "Rua das Flores", "numero": "500", "cidade": "Rio de Janeiro", "estado": "RJ", "cep": "20040-020"}', true, NOW(), NOW()),
('33333333-3333-4333-a333-333333333333', 'Ana Costa', '345.678.901-23', 'ana.costa@example.com', '(31) 96543-2109', '1978-11-10', '{"rua": "Av. Afonso Pena", "numero": "3000", "cidade": "Belo Horizonte", "estado": "MG", "cep": "30130-009"}', true, NOW(), NOW()),
('44444444-4444-4444-a444-444444444444', 'Carlos Oliveira', '456.789.012-34', 'carlos.oliveira@example.com', '(85) 95432-1098', '1995-05-05', '{"rua": "Av. Beira Mar", "numero": "2500", "cidade": "Fortaleza", "estado": "CE", "cep": "60165-121"}', true, NOW(), NOW());

-- Sample Prescriptions (Various lens types and progressions)
INSERT INTO prescriptions (id, cliente_id, od, oe, tipo_lente, medico_nome, medico_crm, medico_uf, data_emissao, data_validade, observacoes, lgpd_consentimento, status, trace_id, metadata, created_at, updated_at) VALUES
-- Maria Silva - Monofocal (baseline)
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', '11111111-1111-4111-a111-111111111111', 
 '{"esferico": -2.0, "cilindrico": -0.5, "eixo": 90, "dnp": 32}', 
 '{"esferico": -2.25, "cilindrico": -0.75, "eixo": 85, "dnp": 32}', 
 'Monofocal', 'Dra. Patricia Oliveira', '12345', 'SP', '2024-01-15', '2025-01-15', 
 'Primeira prescrição', true, 'ativa', 
 'trace-aaa-111', '{"source": "manual", "simulator_test": true}', 
 '2024-01-15 10:00:00', '2024-01-15 10:00:00'),

-- Maria Silva - Progression (6 months later, -0.75D change = RAPID)
('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', '11111111-1111-4111-a111-111111111111', 
 '{"esferico": -2.75, "cilindrico": -0.5, "eixo": 90, "dnp": 32}', 
 '{"esferico": -3.0, "cilindrico": -0.75, "eixo": 85, "dnp": 32}', 
 'Monofocal', 'Dra. Patricia Oliveira', '12345', 'SP', '2024-07-20', '2025-07-20', 
 'Progressão rápida - necessita acompanhamento', true, 'ativa', 
 'trace-bbb-222', '{"source": "manual", "simulator_test": true, "progression_flagged": true}', 
 '2024-07-20 14:30:00', '2024-07-20 14:30:00'),

-- João Santos - Bifocal
('cccccccc-cccc-4ccc-cccc-cccccccccccc', '22222222-2222-4222-a222-222222222222', 
 '{"esferico": -1.5, "cilindrico": -1.0, "eixo": 180, "dnp": 33, "adicao": 2.0}', 
 '{"esferico": -1.75, "cilindrico": -1.25, "eixo": 175, "dnp": 33, "adicao": 2.0}', 
 'Bifocal', 'Dr. Roberto Fernandes', '67890', 'RJ', '2024-03-10', '2025-03-10', 
 'Presbiopia - primeira vez bifocal', true, 'ativa', 
 'trace-ccc-333', '{"source": "manual", "simulator_test": true}', 
 '2024-03-10 11:00:00', '2024-03-10 11:00:00'),

-- Ana Costa - Progressiva
('dddddddd-dddd-4ddd-dddd-dddddddddddd', '33333333-3333-4333-a333-333333333333', 
 '{"esferico": 1.0, "cilindrico": -0.5, "eixo": 45, "dnp": 31, "adicao": 2.5}', 
 '{"esferico": 0.75, "cilindrico": -0.75, "eixo": 40, "dnp": 31, "adicao": 2.5}', 
 'Progressiva', 'Dr. Fernando Silva', '11223', 'MG', '2024-02-05', '2025-02-05', 
 'Hipermetropia com presbiopia', true, 'ativa', 
 'trace-ddd-444', '{"source": "manual", "simulator_test": true}', 
 '2024-02-05 09:15:00', '2024-02-05 09:15:00'),

-- Carlos Oliveira - Multifocal (OCR simulated)
('eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee', '44444444-4444-4444-a444-444444444444', 
 '{"esferico": -3.5, "cilindrico": -2.0, "eixo": 15, "dnp": 34, "adicao": 1.5}', 
 '{"esferico": -3.75, "cilindrico": -2.25, "eixo": 10, "dnp": 34, "adicao": 1.5}', 
 'Multifocal', 'Dra. Camila Rodrigues', '99887', 'CE', '2024-06-18', '2025-06-18', 
 'Extraído via OCR - verificar dados', true, 'ativa', 
 'trace-eee-555', '{"source": "ocr", "ocr_confidence": 0.85, "simulator_test": true}', 
 '2024-06-18 16:45:00', '2024-06-18 16:45:00');

-- Sample Patient History Entries
INSERT INTO patient_history (id, patient_id, event_type, related_id, trace_id, metadata, actor_id, occurred_at, severity, flags, created_at, updated_at) VALUES
-- Maria Silva - Initial prescription
('hist-aaa-111', '11111111-1111-4111-a111-111111111111', 'prescription', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 
 'trace-aaa-111', 
 '{"od": {"esferico": -2.0, "cilindrico": -0.5}, "oe": {"esferico": -2.25, "cilindrico": -0.75}, "tipo_lente": "Monofocal"}', 
 NULL, '2024-01-15 10:00:00', 'low', '[]', NOW(), NOW()),

-- Maria Silva - Rapid progression
('hist-bbb-222', '11111111-1111-4111-a111-111111111111', 'prescription', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 
 'trace-bbb-222', 
 '{"od": {"esferico": -2.75, "cilindrico": -0.5}, "oe": {"esferico": -3.0, "cilindrico": -0.75}, "tipo_lente": "Monofocal", "progression": {"od_change": -0.75, "oe_change": -0.75, "months_elapsed": 6}}', 
 NULL, '2024-07-20 14:30:00', 'high', '["rapid_progression", "needs_recheck"]', NOW(), NOW()),

-- João Santos - Bifocal prescription
('hist-ccc-333', '22222222-2222-4222-a222-222222222222', 'prescription', 'cccccccc-cccc-4ccc-cccc-cccccccccccc', 
 'trace-ccc-333', 
 '{"od": {"esferico": -1.5, "cilindrico": -1.0, "adicao": 2.0}, "oe": {"esferico": -1.75, "cilindrico": -1.25, "adicao": 2.0}, "tipo_lente": "Bifocal"}', 
 NULL, '2024-03-10 11:00:00', 'medium', '["first_bifocal"]', NOW(), NOW()),

-- Ana Costa - Progressiva prescription
('hist-ddd-444', '33333333-3333-4333-a333-333333333333', 'prescription', 'dddddddd-dddd-4ddd-dddd-dddddddddddd', 
 'trace-ddd-444', 
 '{"od": {"esferico": 1.0, "cilindrico": -0.5, "adicao": 2.5}, "oe": {"esferico": 0.75, "cilindrico": -0.75, "adicao": 2.5}, "tipo_lente": "Progressiva"}', 
 NULL, '2024-02-05 09:15:00', 'low', '[]', NOW(), NOW()),

-- Carlos Oliveira - OCR prescription
('hist-eee-555', '44444444-4444-4444-a444-444444444444', 'prescription', 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee', 
 'trace-eee-555', 
 '{"od": {"esferico": -3.5, "cilindrico": -2.0, "adicao": 1.5}, "oe": {"esferico": -3.75, "cilindrico": -2.25, "adicao": 1.5}, "tipo_lente": "Multifocal", "source": "ocr", "confidence": 0.85}', 
 NULL, '2024-06-18 16:45:00', 'medium', '["ocr_extracted"]', NOW(), NOW());

-- Sample Prescription Versions (Maria Silva progression)
INSERT INTO prescription_versions (id, prescription_id, version_number, reason, changed_fields, previous_data, new_data, changed_by, trace_id, notes, created_at, updated_at) VALUES
('ver-aaa-001', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 1, 'progression', 
 '{"od.esferico": {"old": -2.0, "new": -2.75}, "oe.esferico": {"old": -2.25, "new": -3.0}}', 
 '{"od": {"esferico": -2.0, "cilindrico": -0.5, "eixo": 90}, "oe": {"esferico": -2.25, "cilindrico": -0.75, "eixo": 85}}', 
 '{"od": {"esferico": -2.75, "cilindrico": -0.5, "eixo": 90}, "oe": {"esferico": -3.0, "cilindrico": -0.75, "eixo": 85}}', 
 NULL, 'trace-bbb-222', 'Progressão de 6 meses - flagged for review', 
 '2024-07-20 14:30:00', '2024-07-20 14:30:00');

-- Sample Events
INSERT INTO events (id, event_type, status, trace_id, payload, metadata, created_at, updated_at) VALUES
-- Maria Silva events
('evt-aaa-111', 'prescription.created', 'completed', 'trace-aaa-111', 
 '{"prescription_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", "cliente_id": "11111111-1111-4111-a111-111111111111"}', 
 '{"simulator_test": true}', '2024-01-15 10:00:00', '2024-01-15 10:00:00'),

('evt-bbb-222', 'prescription.created', 'completed', 'trace-bbb-222', 
 '{"prescription_id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb", "cliente_id": "11111111-1111-4111-a111-111111111111"}', 
 '{"simulator_test": true, "progression_detected": true}', '2024-07-20 14:30:00', '2024-07-20 14:30:00'),

-- João Santos event
('evt-ccc-333', 'prescription.created', 'completed', 'trace-ccc-333', 
 '{"prescription_id": "cccccccc-cccc-4ccc-cccc-cccccccccccc", "cliente_id": "22222222-2222-4222-a222-222222222222"}', 
 '{"simulator_test": true}', '2024-03-10 11:00:00', '2024-03-10 11:00:00'),

-- Ana Costa event
('evt-ddd-444', 'prescription.created', 'completed', 'trace-ddd-444', 
 '{"prescription_id": "dddddddd-dddd-4ddd-dddd-dddddddddddd", "cliente_id": "33333333-3333-4333-a333-333333333333"}', 
 '{"simulator_test": true}', '2024-02-05 09:15:00', '2024-02-05 09:15:00'),

-- Carlos Oliveira OCR events
('evt-eee-555', 'prescription.attachment.parsed', 'completed', 'trace-eee-555', 
 '{"confidence": 0.85, "provider": "tesseract"}', 
 '{"simulator_test": true, "ocr_extraction": true}', '2024-06-18 16:40:00', '2024-06-18 16:40:00'),

('evt-eee-556', 'prescription.created', 'completed', 'trace-eee-555', 
 '{"prescription_id": "eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee", "cliente_id": "44444444-4444-4444-a444-444444444444"}', 
 '{"simulator_test": true, "source": "ocr"}', '2024-06-18 16:45:00', '2024-06-18 16:45:00');

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================
-- Uncomment to verify data after insertion:

-- SELECT 'Clients' as entity, COUNT(*) as count FROM clients WHERE lgpd_consentimento = true;
-- SELECT 'Prescriptions' as entity, COUNT(*) as count FROM prescriptions WHERE metadata->>'simulator_test' = 'true';
-- SELECT 'Patient History' as entity, COUNT(*) as count FROM patient_history;
-- SELECT 'Versions' as entity, COUNT(*) as count FROM prescription_versions;
-- SELECT 'Events' as entity, COUNT(*) as count FROM events WHERE metadata->>'simulator_test' = 'true';

-- Check Maria Silva progression:
-- SELECT 
--   p.id,
--   p.data_emissao,
--   p.od->>'esferico' as od_esf,
--   p.oe->>'esferico' as oe_esf,
--   p.metadata->>'progression_flagged' as flagged
-- FROM prescriptions p
-- WHERE p.cliente_id = '11111111-1111-4111-a111-111111111111'
-- ORDER BY p.data_emissao;
