-- ---------------------------------------------------------------------------
-- Migracion 0003: tablas para el primer minijuego ("El sapito saltarin").
--
-- A diferencia de 0001 y 0002, esta migracion SI es idempotente (solo
-- CREATE TABLE/INDEX IF NOT EXISTS: son tablas nuevas, no cambia ninguna
-- existente), igual que schema.sql. Se deja como migracion numerada de
-- todas formas para que el historial de cambios de la base quede completo
-- y en orden.
--
--   npx wrangler d1 execute mateguarida-db --remote --file cloudflare/migrations/0003_juego_conteo_saltos.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salto (
  id          TEXT PRIMARY KEY,
  intento_id  TEXT NOT NULL REFERENCES intento(id),
  numero      INTEGER NOT NULL CHECK (numero >= 1),
  tipo_conteo TEXT NOT NULL CHECK (tipo_conteo IN ('2', '5', '10')),
  direccion   TEXT NOT NULL CHECK (direccion IN ('adelante', 'atras')),
  nivel       INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 4),
  correcto    INTEGER NOT NULL CHECK (correcto IN (0, 1)),
  uso_apoyo   INTEGER NOT NULL DEFAULT 0 CHECK (uso_apoyo IN (0, 1)),
  tipo_error  TEXT CHECK (tipo_error IS NULL OR tipo_error IN ('cuenta_de_uno', 'salto_equivocado', 'confunde_decena')),
  ocurrido_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_salto_intento ON salto(intento_id);
CREATE INDEX IF NOT EXISTS idx_salto_error ON salto(tipo_error);

CREATE TABLE IF NOT EXISTS juego_sumo_primero (
  juego_id   TEXT NOT NULL,
  nivel      TEXT NOT NULL CHECK (nivel IN ('NT1', 'NT2', '1-basico', '2-basico', '3-basico', '4-basico')),
  tomo       TEXT,
  capitulo   TEXT,
  titulo     TEXT,
  paginas    TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (juego_id, nivel)
);
