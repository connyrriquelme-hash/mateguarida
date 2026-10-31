-- ---------------------------------------------------------------------------
-- Migracion 0006: el OA se atribuye por RONDA, no por intento completo.
--
-- Reemplaza el enfoque de la migracion 0005 (tabla intento_oa, un intento
-- cuenta igual para todos los OA que declare su juego+nivel) por uno mas
-- preciso: cada ronda calcula su propio OA segun el tipo de problema
-- (variante), y avance_oa se recalcula desde `ronda`, no desde `intento`.
-- Ver cloudflare/curriculo.mjs (oaDeRonda) y cloudflare/intentos.mjs.
--
-- DESTRUCTIVA: borra la tabla intento_oa, elimina intento.oa_code, y vacia
-- avance_oa (se reconstruye solo con las PROXIMAS partidas que se jueguen --
-- las partidas ya jugadas no se pueden reatribuir por ronda porque las
-- rondas antiguas no tienen oa_code, asi que su avance se pierde del panel
-- hasta que se vuelva a jugar). No afecta a `intento` ni a `ronda` en su
-- contenido (numero, correcto, tipo_error, etc.), solo agrega la columna
-- oa_code a `ronda` y quita oa_code de `intento`.
--
-- Antes de correr esto en produccion: respaldo.
--   npx wrangler d1 export mateguarida-db --remote --output respaldo-antes-0006.sql
--   npx wrangler d1 execute mateguarida-db --remote --file cloudflare/migrations/0006_oa_por_ronda.sql
--
-- OJO: correr cada sentencia por separado con --command, no de una vez con
-- --file -- en produccion, wrangler d1 execute --file con varios DDL en el
-- mismo archivo corto la ejecucion a medio camino sin avisar claramente del
-- corte (visto al correr esta misma migracion mas de una vez). Ademas, antes de tocar
-- intento.oa_code hay que borrar el indice idx_intento_oa (anterior a esta
-- migracion, de antes de la 0005): sin eso, ALTER TABLE sobre esa columna
-- falla con "no such column: oa_code" porque el indice queda huerfano.
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_intento_oa;

DROP TABLE IF EXISTS intento_oa;

ALTER TABLE intento DROP COLUMN oa_code;

ALTER TABLE ronda ADD COLUMN oa_code TEXT;
CREATE INDEX IF NOT EXISTS idx_ronda_oa ON ronda(oa_code);

DELETE FROM avance_oa;
