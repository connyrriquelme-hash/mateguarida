-- ---------------------------------------------------------------------------
-- Migracion 0002: codigos seguros, mesas numericas y limite de intentos.
--
-- Igual que 0001: solo hace falta en una base que ya tenia el esquema
-- anterior (estudiante.mesa como texto libre, sin curso.cantidad_mesas, sin
-- intento_login_ip). Una base nueva ya nace al dia con schema.sql.
--
-- Se corrio una sola vez contra la base remota de produccion el 2026-10-31:
--   npx wrangler d1 execute mateguarida-db --remote --file cloudflare/migrations/0002_codigos_mesas_limite.sql
--
-- No es idempotente (ALTER TABLE ... ADD COLUMN y RENAME COLUMN fallan si ya
-- se aplicaron): no volver a correrla sobre una base que ya la tiene.
--
-- estudiante.mesa pasa de texto libre a numero: los valores que no eran un
-- numero puro (ej. "Mesa 1" escrito a mano en la etapa 3, antes del
-- selector) quedan en null -- son datos de prueba de antes del lanzamiento,
-- no hay estudiantes reales que pierdan su mesa real.
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_estudiante_mesa;

ALTER TABLE curso ADD COLUMN cantidad_mesas INTEGER NOT NULL DEFAULT 8;

ALTER TABLE estudiante ADD COLUMN mesa_num INTEGER;
UPDATE estudiante SET mesa_num = CAST(mesa AS INTEGER) WHERE mesa GLOB '[0-9]*';
ALTER TABLE estudiante DROP COLUMN mesa;
ALTER TABLE estudiante RENAME COLUMN mesa_num TO mesa;

CREATE INDEX IF NOT EXISTS idx_estudiante_mesa ON estudiante(curso_id, mesa);

CREATE TABLE IF NOT EXISTS intento_login_ip (
  ip              TEXT PRIMARY KEY,
  fallos          INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta TEXT,
  actualizado_en  TEXT NOT NULL
);
