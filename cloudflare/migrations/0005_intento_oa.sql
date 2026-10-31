-- ---------------------------------------------------------------------------
-- Migracion 0005: tabla intento_oa (un intento puede contar para mas de un OA).
--
-- Idempotente (solo CREATE TABLE/INDEX IF NOT EXISTS). Hizo falta al agregar
-- "Guarida completa su album", que declara 3 OA en data/juegos-oa.json
-- (MA02-OA-09, MA02-OA-06, MA02-OA-07): intento.oa_code solo guarda uno, asi
-- que sin esta tabla el avance de los otros dos nunca se habria llenado.
--
--   npx wrangler d1 execute mateguarida-db --remote --file cloudflare/migrations/0005_intento_oa.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS intento_oa (
  intento_id TEXT NOT NULL REFERENCES intento(id),
  oa_code    TEXT NOT NULL,
  PRIMARY KEY (intento_id, oa_code)
);
