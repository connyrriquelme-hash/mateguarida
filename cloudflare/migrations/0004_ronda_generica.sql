-- ---------------------------------------------------------------------------
-- Migracion 0004: generaliza "salto" a "ronda".
--
-- La tabla `salto` (migracion 0003) tenia columnas y un CHECK de tipo_error
-- pensados solo para "Guarida salta los techos" (tipo_conteo IN (2,5,10),
-- direccion IN (adelante,atras), tipo_error IN (cuenta_de_uno,
-- salto_equivocado, confunde_decena)). Al agregar "Guarida reparte los
-- panes", que tiene sus propios tipos de error (tabla_equivocada, etc.),
-- ese CHECK rechazaria sus INSERT. Se reemplaza por una tabla generica:
-- `variante` y `tipo_error` quedan como texto libre, cada juego define los
-- suyos (ver cloudflare/schema.sql para el detalle).
--
-- Se corrio una sola vez contra la base remota de produccion el 2026-11-01:
--   npx wrangler d1 execute mateguarida-db --remote --file cloudflare/migrations/0004_ronda_generica.sql
--
-- Seguro de ejecutar tal cual: a esta fecha la tabla `salto` esta vacia en
-- produccion (no hay estudiantes reales jugando todavia), asi que se
-- recrea en vez de migrar filas. Si en el futuro esto se corre con datos
-- reales adentro, hay que copiarlos antes de dropear.
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_salto_intento;
DROP INDEX IF EXISTS idx_salto_error;
DROP TABLE IF EXISTS salto;

CREATE TABLE IF NOT EXISTS ronda (
  id          TEXT PRIMARY KEY,
  intento_id  TEXT NOT NULL REFERENCES intento(id),
  numero      INTEGER NOT NULL CHECK (numero >= 1),
  variante    TEXT,
  nivel       INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 4),
  correcto    INTEGER NOT NULL CHECK (correcto IN (0, 1)),
  uso_apoyo   INTEGER NOT NULL DEFAULT 0 CHECK (uso_apoyo IN (0, 1)),
  tipo_error  TEXT,
  ocurrido_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ronda_intento ON ronda(intento_id);
CREATE INDEX IF NOT EXISTS idx_ronda_error ON ronda(tipo_error);
