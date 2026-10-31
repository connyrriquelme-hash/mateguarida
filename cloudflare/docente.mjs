/**
 * docente.mjs
 * API del panel docente: cursos, estudiantes (con mesa e inicial de
 * apellido), y avance por estudiante / por mesa / por OA. Protegida por
 * Cloudflare Access + cloudflare/acceso.mjs (ver worker.mjs).
 *
 * Los juegos (etapa 4) todavia no existen: "asignar juegos" y el avance real
 * quedan listos del lado de la base y de este archivo, pero sin datos que
 * mostrar aun -- el panel debe mostrar un estado vacio, no un error.
 */

import { generarCodigo, validarCodigo } from "./codigos.mjs";
import { JUEGOS, existeJuego } from "./juegos.mjs";

const NIVELES_VALIDOS = ["NT1", "NT2", "1-basico", "2-basico", "3-basico", "4-basico"];
const CANTIDAD_MESAS_MIN = 1;
const CANTIDAD_MESAS_MAX = 60;
const CANTIDAD_MESAS_DEFECTO = 8;
const INTENTOS_GENERAR_CODIGO = 10;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function ahora() {
  return new Date().toISOString();
}

async function leerJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/**
 * Un nombre por linea. Si la ultima palabra es una sola letra (con o sin
 * punto), se toma como inicial del apellido: "Ana R." o "Ana R" -> nombre
 * "Ana", inicialApellido "R". Si no, toda la linea es el nombre y la inicial
 * queda vacia (editable despues desde el panel).
 */
export function parsearListado(texto) {
  const PATRON_INICIAL = /^(.+?)\s+([A-Za-zÁÉÍÓÚÑÜáéíóúñü])\.?$/;
  return String(texto || "")
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const m = linea.match(PATRON_INICIAL);
      if (m) return { nombre: m[1].trim(), inicialApellido: m[2].toLocaleUpperCase("es-CL") };
      return { nombre: linea, inicialApellido: null };
    });
}

function filaEstudiante(e) {
  return {
    id: e.id,
    nombre: e.nombre,
    inicialApellido: e.inicial_apellido || null,
    mesa: e.mesa === null || e.mesa === undefined ? null : Number(e.mesa),
    activo: Boolean(e.activo)
  };
}

function validarCantidadMesas(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < CANTIDAD_MESAS_MIN || n > CANTIDAD_MESAS_MAX) {
    return { error: `La cantidad de mesas debe ser un número entero entre ${CANTIDAD_MESAS_MIN} y ${CANTIDAD_MESAS_MAX}.` };
  }
  return { valor: n };
}

/** mesa puede venir null/undefined (sin mesa), o un numero 1..cantidadMesas. */
function validarMesa(valorCrudo, cantidadMesas) {
  if (valorCrudo === null || valorCrudo === undefined || valorCrudo === "") return { valor: null };
  const n = Number(valorCrudo);
  if (!Number.isInteger(n) || n < 1 || n > cantidadMesas) {
    return { error: `La mesa debe ser un número entre 1 y ${cantidadMesas}.` };
  }
  return { valor: n };
}

/* ------------------------------- cursos --------------------------------- */

/** GET /api/docente/cursos */
export async function listarCursos(env) {
  const { results } = await env.DB.prepare(
    "SELECT c.id, c.nombre, c.nivel, c.codigo, c.cantidad_mesas, c.activo, " +
    "  (SELECT COUNT(*) FROM estudiante e WHERE e.curso_id = c.id AND e.activo = 1) AS total_estudiantes " +
    "FROM curso c ORDER BY c.nombre COLLATE NOCASE"
  ).all();
  return json({
    cursos: (results || []).map((c) => ({
      id: c.id, nombre: c.nombre, nivel: c.nivel, codigo: c.codigo, cantidadMesas: c.cantidad_mesas,
      activo: Boolean(c.activo), totalEstudiantes: c.total_estudiantes
    }))
  });
}

/**
 * Intenta insertar un curso con un codigo generado; si choca con uno que ya
 * existe (muy poco probable, pero posible), genera otro y reintenta.
 */
async function insertarCursoConCodigoGenerado(env, { id, nombre, nivel, cantidadMesas, t }) {
  for (let intento = 0; intento < INTENTOS_GENERAR_CODIGO; intento += 1) {
    const codigo = generarCodigo();
    try {
      await env.DB.prepare(
        "INSERT INTO curso (id, nombre, nivel, codigo, cantidad_mesas, activo, created_at, updated_at) " +
        "VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?6)"
      ).bind(id, nombre, nivel, codigo, cantidadMesas, t).run();
      return codigo;
    } catch (error) {
      if (!String(error.message || "").includes("UNIQUE")) throw error;
      // codigo ya usado por otro curso: se intenta con uno nuevo.
    }
  }
  throw new Error("No se pudo generar un código de curso único.");
}

/** POST /api/docente/cursos  { nombre, nivel, codigo?, cantidadMesas? } */
export async function crearCurso(request, env) {
  const body = await leerJson(request);
  const nombre = String(body.nombre || "").trim();
  const nivel = String(body.nivel || "").trim();

  if (!nombre || nombre.length > 60) return json({ error: "El nombre del curso debe tener entre 1 y 60 caracteres." }, 400);
  if (!NIVELES_VALIDOS.includes(nivel)) return json({ error: "Nivel invalido." }, 400);

  const cantidadMesasResultado = validarCantidadMesas(body.cantidadMesas ?? CANTIDAD_MESAS_DEFECTO);
  if (cantidadMesasResultado.error) return json({ error: cantidadMesasResultado.error }, 400);
  const cantidadMesas = cantidadMesasResultado.valor;

  const id = crypto.randomUUID();
  const t = ahora();

  // Se puede pedir un codigo propio, pero se valida igual que uno generado
  // (sin excepciones): nada corto ni facil de adivinar.
  const codigoPedido = body.codigo !== undefined && body.codigo !== null && String(body.codigo).trim() !== ""
    ? String(body.codigo).trim().toUpperCase()
    : null;

  let codigoFinal;
  try {
    if (codigoPedido) {
      const errorCodigo = validarCodigo(codigoPedido);
      if (errorCodigo) return json({ error: errorCodigo }, 400);
      await env.DB.prepare(
        "INSERT INTO curso (id, nombre, nivel, codigo, cantidad_mesas, activo, created_at, updated_at) " +
        "VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?6)"
      ).bind(id, nombre, nivel, codigoPedido, cantidadMesas, t).run();
      codigoFinal = codigoPedido;
    } else {
      codigoFinal = await insertarCursoConCodigoGenerado(env, { id, nombre, nivel, cantidadMesas, t });
    }
  } catch (error) {
    if (String(error.message || "").includes("UNIQUE")) {
      return json({ error: "Ya existe un curso con ese codigo." }, 409);
    }
    throw error;
  }

  return json({
    curso: { id, nombre, nivel, codigo: codigoFinal, cantidadMesas, activo: true, totalEstudiantes: 0 }
  }, 201);
}

/** GET /api/docente/cursos/:id */
export async function obtenerCurso(env, cursoId) {
  const curso = await env.DB.prepare(
    "SELECT id, nombre, nivel, codigo, cantidad_mesas, activo FROM curso WHERE id = ?1"
  ).bind(cursoId).first();
  if (!curso) return json({ error: "Curso no encontrado." }, 404);

  const { results: estudiantes } = await env.DB.prepare(
    "SELECT id, nombre, inicial_apellido, mesa, activo FROM estudiante WHERE curso_id = ?1 ORDER BY nombre COLLATE NOCASE"
  ).bind(cursoId).all();

  return json({
    curso: {
      id: curso.id, nombre: curso.nombre, nivel: curso.nivel, codigo: curso.codigo,
      cantidadMesas: curso.cantidad_mesas, activo: Boolean(curso.activo)
    },
    estudiantes: (estudiantes || []).map(filaEstudiante)
  });
}

/** PATCH /api/docente/cursos/:id  { nombre?, nivel?, codigo?, cantidadMesas?, activo? } */
export async function actualizarCurso(request, env, cursoId) {
  const body = await leerJson(request);
  const existente = await env.DB.prepare("SELECT id FROM curso WHERE id = ?1").bind(cursoId).first();
  if (!existente) return json({ error: "Curso no encontrado." }, 404);

  const campos = [];
  const valores = [];
  if (body.nombre !== undefined) {
    const nombre = String(body.nombre).trim();
    if (!nombre || nombre.length > 60) return json({ error: "Nombre invalido." }, 400);
    campos.push("nombre = ?"); valores.push(nombre);
  }
  if (body.nivel !== undefined) {
    if (!NIVELES_VALIDOS.includes(body.nivel)) return json({ error: "Nivel invalido." }, 400);
    campos.push("nivel = ?"); valores.push(body.nivel);
  }
  if (body.codigo !== undefined) {
    const codigo = String(body.codigo).trim().toUpperCase();
    const errorCodigo = validarCodigo(codigo);
    if (errorCodigo) return json({ error: errorCodigo }, 400);
    campos.push("codigo = ?"); valores.push(codigo);
  }
  if (body.cantidadMesas !== undefined) {
    const resultado = validarCantidadMesas(body.cantidadMesas);
    if (resultado.error) return json({ error: resultado.error }, 400);
    campos.push("cantidad_mesas = ?"); valores.push(resultado.valor);
  }
  if (body.activo !== undefined) {
    campos.push("activo = ?"); valores.push(body.activo ? 1 : 0);
  }
  if (!campos.length) return json({ error: "Nada para actualizar." }, 400);

  campos.push("updated_at = ?"); valores.push(ahora());
  try {
    await env.DB.prepare(`UPDATE curso SET ${campos.join(", ")} WHERE id = ?`).bind(...valores, cursoId).run();
  } catch (error) {
    if (String(error.message || "").includes("UNIQUE")) return json({ error: "Ya existe un curso con ese codigo." }, 409);
    throw error;
  }
  return obtenerCurso(env, cursoId);
}

/** POST /api/docente/cursos/:id/regenerar-codigo -- por si el codigo se filtro. */
export async function regenerarCodigo(env, cursoId) {
  const existente = await env.DB.prepare("SELECT id FROM curso WHERE id = ?1").bind(cursoId).first();
  if (!existente) return json({ error: "Curso no encontrado." }, 404);

  for (let intento = 0; intento < INTENTOS_GENERAR_CODIGO; intento += 1) {
    const codigo = generarCodigo();
    try {
      await env.DB.prepare("UPDATE curso SET codigo = ?1, updated_at = ?2 WHERE id = ?3").bind(codigo, ahora(), cursoId).run();
      return obtenerCurso(env, cursoId);
    } catch (error) {
      if (!String(error.message || "").includes("UNIQUE")) throw error;
    }
  }
  return json({ error: "No se pudo generar un código de curso único." }, 500);
}

/** DELETE /api/docente/cursos/:id -- borra el curso y todo lo suyo. */
export async function eliminarCurso(env, cursoId) {
  const curso = await env.DB.prepare("SELECT id FROM curso WHERE id = ?1").bind(cursoId).first();
  if (!curso) return json({ error: "Curso no encontrado." }, 404);

  const { results: estudiantes } = await env.DB.prepare("SELECT id FROM estudiante WHERE curso_id = ?1").bind(cursoId).all();
  const ids = (estudiantes || []).map((e) => e.id);

  const sentencias = [];
  for (const id of ids) {
    sentencias.push(env.DB.prepare("DELETE FROM sesion_estudiante WHERE estudiante_id = ?1").bind(id));
    sentencias.push(env.DB.prepare("DELETE FROM intento WHERE estudiante_id = ?1").bind(id));
    sentencias.push(env.DB.prepare("DELETE FROM avance_oa WHERE estudiante_id = ?1").bind(id));
    sentencias.push(env.DB.prepare("DELETE FROM aviso_avance WHERE estudiante_id = ?1").bind(id));
  }
  sentencias.push(env.DB.prepare("DELETE FROM estudiante WHERE curso_id = ?1").bind(cursoId));
  sentencias.push(env.DB.prepare("DELETE FROM asignacion WHERE curso_id = ?1").bind(cursoId));
  sentencias.push(env.DB.prepare("DELETE FROM curso WHERE id = ?1").bind(cursoId));

  await env.DB.batch(sentencias);
  return json({ ok: true });
}

/* ----------------------------- estudiantes ------------------------------- */

/**
 * POST /api/docente/cursos/:id/estudiantes
 *   { pegado: "Ana R.\nBruno\nCaro M.", mesa?: 3 }  -- carga masiva
 *   { nombre: "Ana", inicialApellido: "R", mesa: 3 } -- uno solo
 * `mesa` es un numero (1..curso.cantidadMesas), no texto libre.
 */
export async function agregarEstudiantes(request, env, cursoId) {
  const curso = await env.DB.prepare("SELECT id, cantidad_mesas FROM curso WHERE id = ?1").bind(cursoId).first();
  if (!curso) return json({ error: "Curso no encontrado." }, 404);

  const body = await leerJson(request);
  let mesaComun = null;
  if (body.mesa !== undefined) {
    const r = validarMesa(body.mesa, curso.cantidad_mesas);
    if (r.error) return json({ error: r.error }, 400);
    mesaComun = r.valor;
  }

  let candidatos;
  if (typeof body.pegado === "string" && body.pegado.trim()) {
    candidatos = parsearListado(body.pegado).map((c) => ({ ...c, mesa: mesaComun }));
  } else if (body.nombre) {
    const nombre = String(body.nombre).trim();
    if (!nombre) return json({ error: "Falta el nombre." }, 400);
    candidatos = [{ nombre, inicialApellido: body.inicialApellido || null, mesa: mesaComun }];
  } else {
    return json({ error: "Falta 'pegado' o 'nombre'." }, 400);
  }
  if (!candidatos.length) return json({ error: "No se encontraron nombres." }, 400);

  const t = ahora();
  const creados = [];
  const sentencias = candidatos.map((c) => {
    const id = crypto.randomUUID();
    creados.push({ id, nombre: c.nombre, inicialApellido: c.inicialApellido, mesa: c.mesa, activo: true });
    return env.DB.prepare(
      "INSERT INTO estudiante (id, curso_id, nombre, inicial_apellido, mesa, activo, created_at, updated_at) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?6)"
    ).bind(id, cursoId, c.nombre, c.inicialApellido, c.mesa, t);
  });

  await env.DB.batch(sentencias);
  return json({ estudiantes: creados }, 201);
}

/** PATCH /api/docente/estudiantes/:id  { nombre?, inicialApellido?, mesa?, activo? } */
export async function actualizarEstudiante(request, env, estudianteId) {
  const body = await leerJson(request);
  const existente = await env.DB.prepare(
    "SELECT e.id, c.cantidad_mesas FROM estudiante e JOIN curso c ON c.id = e.curso_id WHERE e.id = ?1"
  ).bind(estudianteId).first();
  if (!existente) return json({ error: "Estudiante no encontrado." }, 404);

  const campos = [];
  const valores = [];
  if (body.nombre !== undefined) {
    const nombre = String(body.nombre).trim();
    if (!nombre || nombre.length > 60) return json({ error: "Nombre invalido." }, 400);
    campos.push("nombre = ?"); valores.push(nombre);
  }
  if (body.inicialApellido !== undefined) {
    const inicial = body.inicialApellido ? String(body.inicialApellido).trim().slice(0, 4) : null;
    campos.push("inicial_apellido = ?"); valores.push(inicial);
  }
  if (body.mesa !== undefined) {
    const r = validarMesa(body.mesa, existente.cantidad_mesas);
    if (r.error) return json({ error: r.error }, 400);
    campos.push("mesa = ?"); valores.push(r.valor);
  }
  if (body.activo !== undefined) {
    campos.push("activo = ?"); valores.push(body.activo ? 1 : 0);
  }
  if (!campos.length) return json({ error: "Nada para actualizar." }, 400);

  campos.push("updated_at = ?"); valores.push(ahora());
  await env.DB.prepare(`UPDATE estudiante SET ${campos.join(", ")} WHERE id = ?`).bind(...valores, estudianteId).run();

  const fila = await env.DB.prepare("SELECT id, nombre, inicial_apellido, mesa, activo FROM estudiante WHERE id = ?1").bind(estudianteId).first();
  return json({ estudiante: filaEstudiante(fila) });
}

/** DELETE /api/docente/estudiantes/:id */
export async function eliminarEstudiante(env, estudianteId) {
  const existente = await env.DB.prepare("SELECT id FROM estudiante WHERE id = ?1").bind(estudianteId).first();
  if (!existente) return json({ error: "Estudiante no encontrado." }, 404);

  await env.DB.batch([
    env.DB.prepare("DELETE FROM sesion_estudiante WHERE estudiante_id = ?1").bind(estudianteId),
    env.DB.prepare("DELETE FROM intento WHERE estudiante_id = ?1").bind(estudianteId),
    env.DB.prepare("DELETE FROM avance_oa WHERE estudiante_id = ?1").bind(estudianteId),
    env.DB.prepare("DELETE FROM aviso_avance WHERE estudiante_id = ?1").bind(estudianteId),
    env.DB.prepare("DELETE FROM estudiante WHERE id = ?1").bind(estudianteId)
  ]);
  return json({ ok: true });
}

/* --------------------------- juegos y asignacion -------------------------- */

/** GET /api/docente/cursos/:id/juegos -> todos los juegos + cuales estan asignados a este curso. */
export async function listarJuegosDeCurso(env, cursoId) {
  const curso = await env.DB.prepare("SELECT id FROM curso WHERE id = ?1").bind(cursoId).first();
  if (!curso) return json({ error: "Curso no encontrado." }, 404);

  const { results: asignados } = await env.DB.prepare(
    "SELECT juego_id FROM asignacion WHERE curso_id = ?1"
  ).bind(cursoId).all();
  const idsAsignados = new Set((asignados || []).map((a) => a.juego_id));

  return json({
    juegos: Object.values(JUEGOS).map((j) => ({
      id: j.id, nombre: j.nombre, nivelPrincipal: j.nivelPrincipal,
      descripcion: j.descripcion, duracionMinutos: j.duracionMinutos,
      asignado: idsAsignados.has(j.id)
    }))
  });
}

/** PUT /api/docente/cursos/:id/juegos  { juegoIds: [...] } -- remplaza la asignacion completa. */
export async function asignarJuegos(request, env, cursoId) {
  const curso = await env.DB.prepare("SELECT id FROM curso WHERE id = ?1").bind(cursoId).first();
  if (!curso) return json({ error: "Curso no encontrado." }, 404);

  const body = await leerJson(request);
  const juegoIds = Array.isArray(body.juegoIds) ? body.juegoIds : null;
  if (!juegoIds) return json({ error: "Falta 'juegoIds' (puede ser [])." }, 400);
  for (const id of juegoIds) {
    if (!existeJuego(id)) return json({ error: `Juego desconocido: ${id}` }, 400);
  }

  const t = ahora();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM asignacion WHERE curso_id = ?1").bind(cursoId),
    ...juegoIds.map((id) =>
      env.DB.prepare("INSERT INTO asignacion (curso_id, juego_id, updated_at) VALUES (?1, ?2, ?3)").bind(cursoId, id, t)
    )
  ]);

  return listarJuegosDeCurso(env, cursoId);
}

/** GET /api/docente/juegos/:juegoId/sumo-primero?nivel=2-basico */
export async function obtenerSumoPrimero(env, juegoId, nivel) {
  if (!existeJuego(juegoId)) return json({ error: "Juego no encontrado." }, 404);
  if (!NIVELES_VALIDOS.includes(nivel)) return json({ error: "Nivel invalido." }, 400);

  const fila = await env.DB.prepare(
    "SELECT tomo, capitulo, titulo, paginas FROM juego_sumo_primero WHERE juego_id = ?1 AND nivel = ?2"
  ).bind(juegoId, nivel).first();

  return json({
    sumoPrimero: fila
      ? { tomo: fila.tomo, capitulo: fila.capitulo, titulo: fila.titulo, paginas: fila.paginas }
      : { tomo: null, capitulo: null, titulo: null, paginas: null }
  });
}

/** PUT /api/docente/juegos/:juegoId/sumo-primero  { nivel, tomo?, capitulo?, titulo?, paginas? } */
export async function guardarSumoPrimero(request, env, juegoId) {
  if (!existeJuego(juegoId)) return json({ error: "Juego no encontrado." }, 404);

  const body = await leerJson(request);
  if (!NIVELES_VALIDOS.includes(body.nivel)) return json({ error: "Nivel invalido." }, 400);

  const campo = (v) => (v === undefined || v === null ? null : String(v).trim().slice(0, 120) || null);
  const t = ahora();

  await env.DB.prepare(
    "INSERT INTO juego_sumo_primero (juego_id, nivel, tomo, capitulo, titulo, paginas, updated_at) " +
    "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) " +
    "ON CONFLICT(juego_id, nivel) DO UPDATE SET tomo = ?3, capitulo = ?4, titulo = ?5, paginas = ?6, updated_at = ?7"
  ).bind(juegoId, body.nivel, campo(body.tomo), campo(body.capitulo), campo(body.titulo), campo(body.paginas), t).run();

  return obtenerSumoPrimero(env, juegoId, body.nivel);
}

/* -------------------------------- avance --------------------------------- */

/**
 * GET /api/docente/cursos/:id/avance
 * Agrega avance_oa (que llena el minijuego, etapa 4) por estudiante, por
 * mesa y por OA. Con avance_oa vacio (todavia no hay juegos) devuelve listas
 * vacias, no un error: el panel debe mostrar "Sin datos todavia".
 */
export async function obtenerAvance(env, cursoId) {
  const curso = await env.DB.prepare("SELECT id FROM curso WHERE id = ?1").bind(cursoId).first();
  if (!curso) return json({ error: "Curso no encontrado." }, 404);

  const { results: porEstudiante } = await env.DB.prepare(
    "SELECT e.id AS estudiante_id, e.nombre, e.inicial_apellido, e.mesa, " +
    "  COALESCE(SUM(a.intentos_total), 0) AS intentos_total, " +
    "  COALESCE(SUM(a.preguntas_total), 0) AS preguntas_total, " +
    "  COALESCE(SUM(a.preguntas_correctas), 0) AS preguntas_correctas " +
    "FROM estudiante e LEFT JOIN avance_oa a ON a.estudiante_id = e.id " +
    "WHERE e.curso_id = ?1 AND e.activo = 1 " +
    "GROUP BY e.id ORDER BY e.nombre COLLATE NOCASE"
  ).bind(cursoId).all();

  const { results: porMesa } = await env.DB.prepare(
    "SELECT COALESCE(e.mesa, '(sin mesa)') AS mesa, " +
    "  COUNT(DISTINCT e.id) AS total_estudiantes, " +
    "  COALESCE(SUM(a.intentos_total), 0) AS intentos_total, " +
    "  COALESCE(SUM(a.preguntas_total), 0) AS preguntas_total, " +
    "  COALESCE(SUM(a.preguntas_correctas), 0) AS preguntas_correctas " +
    "FROM estudiante e LEFT JOIN avance_oa a ON a.estudiante_id = e.id " +
    "WHERE e.curso_id = ?1 AND e.activo = 1 " +
    "GROUP BY mesa ORDER BY mesa COLLATE NOCASE"
  ).bind(cursoId).all();

  const { results: porOA } = await env.DB.prepare(
    "SELECT a.oa_code, " +
    "  COUNT(DISTINCT a.estudiante_id) AS total_estudiantes, " +
    "  COALESCE(SUM(a.intentos_total), 0) AS intentos_total, " +
    "  COALESCE(SUM(a.preguntas_total), 0) AS preguntas_total, " +
    "  COALESCE(SUM(a.preguntas_correctas), 0) AS preguntas_correctas " +
    "FROM avance_oa a JOIN estudiante e ON e.id = a.estudiante_id " +
    "WHERE e.curso_id = ?1 AND e.activo = 1 " +
    "GROUP BY a.oa_code ORDER BY a.oa_code"
  ).bind(cursoId).all();

  // Desglose de errores tipicos (solo juegos con detalle por salto, ver
  // cloudflare/intentos.mjs): cuantas veces cada tipo_error aparecio, por OA.
  const { results: erroresCrudos } = await env.DB.prepare(
    "SELECT i.oa_code, sa.tipo_error, COUNT(*) AS cantidad " +
    "FROM salto sa JOIN intento i ON i.id = sa.intento_id JOIN estudiante e ON e.id = i.estudiante_id " +
    "WHERE e.curso_id = ?1 AND e.activo = 1 AND sa.correcto = 0 AND sa.tipo_error IS NOT NULL " +
    "GROUP BY i.oa_code, sa.tipo_error"
  ).bind(cursoId).all();

  const erroresPorOA = {};
  for (const fila of erroresCrudos || []) {
    if (!fila.oa_code) continue;
    erroresPorOA[fila.oa_code] ??= {};
    erroresPorOA[fila.oa_code][fila.tipo_error] = fila.cantidad;
  }

  function conPrecision({ intentosTotal, preguntasTotal, preguntasCorrectas, ...resto }) {
    const total = Number(preguntasTotal) || 0;
    const correctas = Number(preguntasCorrectas) || 0;
    return {
      ...resto,
      intentosTotal,
      preguntasTotal,
      preguntasCorrectas,
      precision: total > 0 ? Math.round((correctas / total) * 100) / 100 : 0
    };
  }

  return json({
    porEstudiante: (porEstudiante || []).map((f) => conPrecision({
      estudianteId: f.estudiante_id, nombre: f.nombre, inicialApellido: f.inicial_apellido, mesa: f.mesa,
      intentosTotal: f.intentos_total, preguntasTotal: f.preguntas_total, preguntasCorrectas: f.preguntas_correctas
    })),
    porMesa: (porMesa || []).map((f) => conPrecision({
      mesa: f.mesa, totalEstudiantes: f.total_estudiantes,
      intentosTotal: f.intentos_total, preguntasTotal: f.preguntas_total, preguntasCorrectas: f.preguntas_correctas
    })),
    porOA: (porOA || []).map((f) => conPrecision({
      oaCode: f.oa_code, totalEstudiantes: f.total_estudiantes,
      intentosTotal: f.intentos_total, preguntasTotal: f.preguntas_total, preguntasCorrectas: f.preguntas_correctas,
      erroresPorTipo: erroresPorOA[f.oa_code] || {}
    }))
  });
}
