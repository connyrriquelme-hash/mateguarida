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
-- estudiante, que solo lee el panel docente autenticado. El dato del
-- estudiante es minimo a proposito: nombre e inicial del apellido. Nada de
-- RUT, fecha de nacimiento ni otro dato personal.
--
-- Entrada sin PIN: tocar el nombre basta, no hay PIN de estudiante (se quito
-- en la etapa 3; vivio brevemente en pin_salt/pin_hash, ver
-- cloudflare/migrations/0001_panel_docente.sql para la base que ya lo tenia
-- desplegado). El panel docente (/panel, /api/docente/*) se protege con
-- Cloudflare Access, no con una sesion propia -- por eso ya no existe una
-- tabla sesion_docente.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS curso (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL CHECK (length(nombre) BETWEEN 1 AND 60),
  nivel      TEXT NOT NULL CHECK (nivel IN ('NT1', 'NT2', '1-basico', '2-basico', '3-basico', '4-basico')),
  -- codigo que escriben los estudiantes una vez por tablet (como el CLASS_CODE
  -- de Lectoguarida, pero por curso en vez de global). No es un secreto fuerte:
  -- es friccion para que un extrano no entre, no una contrasena. Por eso se
  -- genera solo (cloudflare/codigos.mjs: PALABRA-NNL, ej. VERDE-47K) y se
  -- rechazan los cortos o comunes incluso si se edita a mano (la validacion
  -- real vive en JS; este CHECK es solo un piso minimo).
  codigo     TEXT NOT NULL UNIQUE CHECK (length(codigo) BETWEEN 4 AND 24),
  -- Cuantas mesas tiene el curso (para el selector numerico de estudiante.mesa).
  cantidad_mesas INTEGER NOT NULL DEFAULT 8 CHECK (cantidad_mesas BETWEEN 1 AND 60),
  activo     INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS estudiante (
  id               TEXT PRIMARY KEY,
  curso_id         TEXT NOT NULL REFERENCES curso(id),
  nombre           TEXT NOT NULL CHECK (length(nombre) BETWEEN 1 AND 60),
  -- Solo la inicial, nunca el apellido completo (dato minimo).
  inicial_apellido TEXT CHECK (inicial_apellido IS NULL OR length(inicial_apellido) <= 4),
  -- Numero de mesa (1..curso.cantidad_mesas; el rango exacto se valida en JS
  -- porque SQLite no puede comparar contra la columna de otra tabla en un
  -- CHECK). Selector numerico en el panel, no texto libre.
  mesa             INTEGER CHECK (mesa IS NULL OR mesa >= 1),
  activo           INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estudiante_curso ON estudiante(curso_id, activo);
CREATE INDEX IF NOT EXISTS idx_estudiante_mesa ON estudiante(curso_id, mesa);

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

-- Sesion del estudiante (igual patron que Lectoguarida: token -> expiracion).
-- No existe una tabla equivalente para el docente: Cloudflare Access es su
-- sesion (cookie propia de Access, fuera de esta base).
CREATE TABLE IF NOT EXISTS sesion_estudiante (
  token         TEXT PRIMARY KEY,
  estudiante_id TEXT NOT NULL,
  expires_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesion_estudiante_alumno ON sesion_estudiante(estudiante_id, expires_at);

-- Limite de intentos de /api/entrada por IP (cloudflare/limitador.mjs): 5
-- codigos incorrectos seguidos desde la misma IP la bloquean unos minutos.
-- Protege contra adivinar el codigo de un curso a fuerza bruta. Una sola fila
-- por IP; se borra sola al acertar o al vencer el bloqueo (revisarBloqueo).
CREATE TABLE IF NOT EXISTS intento_login_ip (
  ip              TEXT PRIMARY KEY,
  fallos          INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta TEXT,
  actualizado_en  TEXT NOT NULL
);

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

-- ---------------------------------------------------------------------------
-- Detalle por ronda (etapa 4 en adelante). Nace con "Guarida salta los
-- techos" pero es generica a proposito: cada juego nuevo con preguntas
-- diagnosticas (varios intentos cortos dentro de una partida, con
-- distractores que representan errores tipicos) escribe aqui, no cada uno
-- con su propia tabla.
--
-- `intento` guarda el resumen de la partida completa (ej. 9 rondas); esta
-- tabla guarda cada ronda individual, porque el panel necesita saber EN QUE
-- SE EQUIVOCA cada nino (tipo_error), no solo cuantos acerto. Un intento sin
-- rondas asociadas (otro juego futuro mas simple) es valido: esta tabla es
-- opcional por juego, no todos van a necesitar este nivel de detalle.
--
-- `variante` y `tipo_error` son texto libre, no un CHECK cerrado: cada juego
-- define los suyos en su propio modulo (ver cloudflare/juegos.mjs y el
-- juego.js de cada uno) porque cada OA tiene sus propios errores tipicos
-- (ej. 'cuenta_de_uno' en el conteo salteado, 'tabla_equivocada' en la
-- multiplicacion). Un CHECK cerrado aqui obligaria a elegir entre una lista
-- que no le sirve a todos los juegos o romper el INSERT del siguiente.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ronda (
  id          TEXT PRIMARY KEY,
  intento_id  TEXT NOT NULL REFERENCES intento(id),
  numero      INTEGER NOT NULL CHECK (numero >= 1),
  -- Que variante de la pregunta era (ej. "5-adelante" en los techos,
  -- "10-directo" en el reparto de panes). Libre por juego.
  variante    TEXT,
  nivel       INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 4),
  correcto    INTEGER NOT NULL CHECK (correcto IN (0, 1)),
  uso_apoyo   INTEGER NOT NULL DEFAULT 0 CHECK (uso_apoyo IN (0, 1)),
  -- Solo si correcto = 0: que distractor toco. Cada uno representa un error
  -- tipico, no un fallo al azar (ver el juego.js de cada juego).
  tipo_error  TEXT,
  ocurrido_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ronda_intento ON ronda(intento_id);
CREATE INDEX IF NOT EXISTS idx_ronda_error ON ronda(tipo_error);

-- ---------------------------------------------------------------------------
-- Referencia a Sumo Primero por juego y nivel: SOLO tomo/capitulo/paginas (la
-- ficha bibliografica), nunca el contenido del libro -- regla de CLAUDE.md.
-- La profesora la escribe/edita desde el panel; el juego_id es el id estatico
-- del juego (definido en el codigo, igual que `asignacion.juego_id`).
-- ---------------------------------------------------------------------------
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
