-- ---------------------------------------------------------------------------
-- Datos de prueba, SOLO para desarrollo local (npm run db:seed:local).
-- NUNCA correr esto contra la base remota: son nombres inventados para
-- probar la pantalla de entrada y el panel docente antes de desplegar.
-- Codigo de entrada para probar: DEMO-47K
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO curso (id, nombre, nivel, codigo, created_at, updated_at)
VALUES ('curso-demo', '2º Básico (prueba)', '2-basico', 'DEMO-47K', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO estudiante (id, curso_id, nombre, inicial_apellido, mesa, created_at, updated_at) VALUES
  ('est-demo-1', 'curso-demo', 'Ana',   'R', 1, datetime('now'), datetime('now')),
  ('est-demo-2', 'curso-demo', 'Bruno', 'S', 1, datetime('now'), datetime('now')),
  ('est-demo-3', 'curso-demo', 'Caro',  NULL, 2, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO asignacion (curso_id, juego_id, updated_at)
VALUES ('curso-demo', 'conteo-saltos-2basico', datetime('now'));
