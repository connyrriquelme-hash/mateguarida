-- ---------------------------------------------------------------------------
-- Migracion 0001: panel docente (etapa 3).
--
-- Esta migracion solo hace falta en una base que ya tenia el esquema de la
-- etapa 2 (sesion_docente, estudiante.pin_salt/pin_hash) y hay que llevarla
-- al estado de cloudflare/schema.sql. Una base NUEVA no la necesita: ya nace
-- con schema.sql al dia.
--
-- Se corrio una sola vez contra la base remota de produccion el 2026-10-31:
--   npx wrangler d1 execute mateguarida-db --remote --file cloudflare/migrations/0001_panel_docente.sql
--
-- No es idempotente (ALTER TABLE ... DROP COLUMN falla si la columna ya no
-- existe): no volver a correrla sobre una base que ya la tiene aplicada.
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS sesion_docente;

ALTER TABLE estudiante DROP COLUMN pin_salt;
ALTER TABLE estudiante DROP COLUMN pin_hash;
ALTER TABLE estudiante ADD COLUMN inicial_apellido TEXT;
ALTER TABLE estudiante ADD COLUMN mesa TEXT;

CREATE INDEX IF NOT EXISTS idx_estudiante_mesa ON estudiante(curso_id, mesa);
