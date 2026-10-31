-- ---------------------------------------------------------------------------
-- Esquema D1 de Mateguarida
--
-- Migracion idempotente: solo CREATE ... IF NOT EXISTS, se puede volver a
-- ejecutar sin perder ni duplicar nada (mismo patron que Lectoguarida).
-- `wrangler deploy` NO aplica este archivo: hay que correrlo contra D1 antes
-- de publicar el worker que lo usa:
--   npx wrangler d1 execute mateguarida-db --remote --file cloudflare/schema.sql
--
-- A diferencia de Lectoguarida (un solo curso), Mateguarida puede tener varios
-- cursos a la vez porque abarca de NT1 a 4basico: cada curso vive en su propia
-- fila y tiene su propio codigo de entrada (lo que en Lectoguarida era un
-- secreto unico CLASS_CODE aqui es una columna, porque puede haber mas de uno).
--
-- Privacidad: ninguna tabla guarda audio, voz, IP ni huella de navegador. El
-- vinculo entre estudiante.id y el nombre real vive solo en la tabla
-- estudiante, que solo lee el panel docente autenticado.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS curso (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL CHECK (length(nombre) BETWEEN 1 AND 60),
  nivel      TEXT NOT NULL CHECK (nivel IN ('NT1', 'NT2', '1-basico', '2-basico', '3-basico', '4-basico')),
  -- codigo que escriben los estudiantes una vez por tablet (como el CLASS_CODE
  -- de Lectoguarida, pero por curso en vez de global). No es un secreto fuerte:
  -- es friccion para que un extrano no entre, no una contrasena.
  codigo     TEXT NOT NULL UNIQUE CHECK (length(codigo) BETWEEN 4 AND 24),
  activo     INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS estudiante (
  id         TEXT PRIMARY KEY,
  curso_id   TEXT NOT NULL REFERENCES curso(id),
  nombre     TEXT NOT NULL CHECK (length(nombre) BETWEEN 1 AND 60),
  -- Igual que Lectoguarida: un perfil sin PIN entra solo eligiendo su nombre.
  -- La profesora le pone PIN desde el panel a quien lo necesite.
  pin_salt   TEXT,
  pin_hash   TEXT,
  activo     INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estudiante_curso ON estudiante(curso_id, activo);

-- Que juego (id estatico, definido en el codigo del Worker/cliente, no en D1 -
-- mismo patron que Lectoguarida: los juegos son contenido versionado, no
-- datos) esta asignado a cada curso. Lo que la profesora marca aqui es
-- exactamente lo que ve el nino al entrar a ese curso.
CREATE TABLE IF NOT EXISTS asignacion (
  curso_id   TEXT NOT NULL REFERENCES curso(id),
  juego_id   TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (curso_id, juego_id)
);

CREATE INDEX IF NOT EXISTS idx_asignacion_curso ON asignacion(curso_id);

-- Sesiones (igual patron que Lectoguarida: token -> expiracion).
CREATE TABLE IF NOT EXISTS sesion_docente (
  token      TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesion_docente_expira ON sesion_docente(expires_at);

CREATE TABLE IF NOT EXISTS sesion_estudiante (
  token         TEXT PRIMARY KEY,
  estudiante_id TEXT NOT NULL,
  expires_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesion_estudiante_alumno ON sesion_estudiante(estudiante_id, expires_at);

-- ---------------------------------------------------------------------------
-- Avance (etapa 4 en adelante: el primer minijuego ya escribe aqui)
--
-- `intento` es cada vez que un estudiante juega un minijuego hasta el final.
-- A diferencia de la evidencia item-por-item de Lectoguarida (lectura es mas
-- granular), un minijuego de Mateguarida dura 2-4 minutos y se resume en un
-- solo intento: preguntas totales, correctas y en que OA. id lo genera el
-- cliente (uuid) para que reenviar un lote tras una caida de red no duplique
-- filas (la ingesta debe usar INSERT OR IGNORE, igual que Lectoguarida).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS intento (
  id                   TEXT PRIMARY KEY,
  estudiante_id        TEXT NOT NULL,
  juego_id             TEXT NOT NULL,
  -- OA principal que declara el juego para este nivel (ver data/oa.json).
  -- Puede ir vacio si el juego todavia no declara OA.
  oa_code              TEXT,
  preguntas_total      INTEGER NOT NULL DEFAULT 0 CHECK (preguntas_total >= 0),
  preguntas_correctas  INTEGER NOT NULL DEFAULT 0 CHECK (preguntas_correctas >= 0 AND preguntas_correctas <= preguntas_total),
  duracion_ms          INTEGER CHECK (duracion_ms IS NULL OR duracion_ms >= 0),
  completado           INTEGER NOT NULL DEFAULT 0 CHECK (completado IN (0, 1)),
  dispositivo          TEXT CHECK (dispositivo IS NULL OR dispositivo IN ('tablet', 'pizarra', 'otro')),
  ocurrido_en          TEXT NOT NULL,
  recibido_en          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intento_estudiante ON intento(estudiante_id, ocurrido_en);
CREATE INDEX IF NOT EXISTS idx_intento_oa ON intento(estudiante_id, oa_code, ocurrido_en);

-- Agregado por estudiante y OA que lee el panel docente. Nunca se consulta
-- `intento` directamente desde el panel: se recalcula aqui despues de cada
-- ingesta (mismo patron que learning_oa_profile de Lectoguarida).
CREATE TABLE IF NOT EXISTS avance_oa (
  estudiante_id    TEXT NOT NULL,
  oa_code          TEXT NOT NULL,
  intentos_total   INTEGER NOT NULL DEFAULT 0,
  preguntas_total  INTEGER NOT NULL DEFAULT 0,
  preguntas_correctas INTEGER NOT NULL DEFAULT 0,
  precision        REAL NOT NULL DEFAULT 0,
  ultimo_intento_en TEXT,
  updated_at       TEXT NOT NULL,
  PRIMARY KEY (estudiante_id, oa_code)
);

CREATE INDEX IF NOT EXISTS idx_avance_oa_codigo ON avance_oa(oa_code);

-- Avisos de las tablets sobre la cola de intentos sin enviar (si la app se
-- cierra sin internet, se pierde lo que quede). La profesora los ve en el
-- panel: una perdida de datos de un nino nunca es silenciosa (mismo patron
-- que aviso_evidencia en Lectoguarida).
CREATE TABLE IF NOT EXISTS aviso_avance (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  estudiante_id TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('cola-en-memoria', 'intentos-perdidos')),
  motivo        TEXT,
  cantidad      INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  ocurrido_en   TEXT NOT NULL,
  recibido_en   TEXT NOT NULL,
  UNIQUE (estudiante_id, tipo, ocurrido_en)
);

CREATE INDEX IF NOT EXISTS idx_aviso_avance_alumno ON aviso_avance(estudiante_id, ocurrido_en);
