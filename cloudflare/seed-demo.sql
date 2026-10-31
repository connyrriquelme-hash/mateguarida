-- ---------------------------------------------------------------------------
-- Datos de prueba, SOLO para desarrollo local (npm run db:seed:local).
-- NUNCA correr esto contra la base remota: son nombres inventados para
-- probar la pantalla de entrada antes de que exista el panel docente
-- (etapa 3). Codigo de entrada para probar: DEMO-2B
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO curso (id, nombre, nivel, codigo, created_at, updated_at)
VALUES ('curso-demo', '2º Básico (prueba)', '2-basico', 'DEMO-2B', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO estudiante (id, curso_id, nombre, created_at, updated_at) VALUES
  ('est-demo-1', 'curso-demo', 'Ana',   datetime('now'), datetime('now')),
  ('est-demo-2', 'curso-demo', 'Bruno', datetime('now'), datetime('now')),
  ('est-demo-3', 'curso-demo', 'Caro',  datetime('now'), datetime('now'));
