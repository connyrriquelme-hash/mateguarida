-- ---------------------------------------------------------------------------
-- Datos de prueba, SOLO para desarrollo local (npm run db:seed:local).
-- NUNCA correr esto contra la base remota: son nombres inventados para
-- probar la pantalla de entrada y el panel docente antes de desplegar.
-- Codigo de entrada para probar: DEMO-2B
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO curso (id, nombre, nivel, codigo, created_at, updated_at)
VALUES ('curso-demo', '2º Básico (prueba)', '2-basico', 'DEMO-2B', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO estudiante (id, curso_id, nombre, inicial_apellido, mesa, created_at, updated_at) VALUES
  ('est-demo-1', 'curso-demo', 'Ana',   'R', 'Mesa 1', datetime('now'), datetime('now')),
  ('est-demo-2', 'curso-demo', 'Bruno', 'S', 'Mesa 1', datetime('now'), datetime('now')),
  ('est-demo-3', 'curso-demo', 'Caro',  NULL, 'Mesa 2', datetime('now'), datetime('now'));
