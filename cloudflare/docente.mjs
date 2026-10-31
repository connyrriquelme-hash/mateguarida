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

const NIVELES_VALIDOS = ["NT1", "NT2", "1-basico", "2-basico", "3-basico", "4-basico"];

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
    mesa: e.mesa || null,
    activo: Boolean(e.activo)
  };
}

/* ------------------------------- cursos --------------------------------- */

/** GET /api/docente/cursos */
export async function listarCursos(env) {
  const { results } = await env.DB.prepare(
    "SELECT c.id, c.nombre, c.nivel, c.codigo, c.activo, " +
    "  (SELECT COUNT(*) FROM estudiante e WHERE e.curso_id = c.id AND e.activo = 1) AS total_estudiantes " +
    "FROM curso c ORDER BY c.nombre COLLATE NOCASE"
  ).all();
  return json({
    cursos: (results || []).map((c) => ({
      id: c.id, nombre: c.nombre, nivel: c.nivel, codigo: c.codigo,
      activo: Boolean(c.activo), totalEstudiantes: c.total_estudiantes
    }))
  });
}

/** POST /api/docente/cursos  { nombre, nivel, codigo } */
export async function crearCurso(request, env) {
  const body = await leerJson(request);
  const nombre = String(body.nombre || "").trim();
  const nivel = String(body.nivel || "").trim();
  const codigo = String(body.codigo || "").trim().toUpperCase();

  if (!nombre || nombre.length > 60) return json({ error: "El nombre del curso debe tener entre 1 y 60 caracteres." }, 400);
  if (!NIVELES_VALIDOS.includes(nivel)) return json({ error: "Nivel invalido." }, 400);
  if (codigo.length < 4 || codigo.length > 24) return json({ error: "El codigo debe tener entre 4 y 24 caracteres." }, 400);

  const id = crypto.randomUUID();
  const t = ahora();
  try {
    await env.DB.prepare(
      "INSERT INTO curso (id, nombre, nivel, codigo, activo, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 1, ?5, ?5)"
    ).bind(id, nombre, nivel, codigo, t).run();
  } catch (error) {
    if (String(error.message || "").includes("UNIQUE")) {
      return json({ error: "Ya existe un curso con ese codigo." }, 409);
    }
    throw error;
  }
  return json({ curso: { id, nombre, nivel, codigo, activo: true, totalEstudiantes: 0 } }, 201);
}

/** GET /api/docente/cursos/:id */
export async function obtenerCurso(env, cursoId) {
  const curso = await env.DB.prepare("SELECT id, nombre, nivel, codigo, activo FROM curso WHERE id = ?1").bind(cursoId).first();
  if (!curso) return json({ error: "Curso no encontrado." }, 404);

  const { results: estudiantes } = await env.DB.prepare(
    "SELECT id, nombre, inicial_apellido, mesa, activo FROM estudiante WHERE curso_id = ?1 ORDER BY nombre COLLATE NOCASE"
  ).bind(cursoId).all();

  return json({
    curso: { id: curso.id, nombre: curso.nombre, nivel: curso.nivel, codigo: curso.codigo, activo: Boolean(curso.activo) },
    estudiantes: (estudiantes || []).map(filaEstudiante)
  });
}

/** PATCH /api/docente/cursos/:id  { nombre?, nivel?, codigo?, activo? } */
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
    if (codigo.length < 4 || codigo.length > 24) return json({ error: "Codigo invalido." }, 400);
    campos.push("codigo = ?"); valores.push(codigo);
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
 *   { pegado: "Ana R.\nBruno\nCaro M.", mesa?: "Mesa 1" }  -- carga masiva
 *   { nombre: "Ana", inicialApellido: "R", mesa: "Mesa 1" } -- uno solo
 */
export async function agregarEstudiantes(request, env, cursoId) {
  const curso = await env.DB.prepare("SELECT id FROM curso WHERE id = ?1").bind(cursoId).first();
  if (!curso) return json({ error: "Curso no encontrado." }, 404);

  const body = await leerJson(request);
  let candidatos;
  if (typeof body.pegado === "string" && body.pegado.trim()) {
    candidatos = parsearListado(body.pegado).map((c) => ({ ...c, mesa: body.mesa || null }));
  } else if (body.nombre) {
    const nombre = String(body.nombre).trim();
    if (!nombre) return json({ error: "Falta el nombre." }, 400);
    candidatos = [{ nombre, inicialApellido: body.inicialApellido || null, mesa: body.mesa || null }];
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
  const existente = await env.DB.prepare("SELECT id FROM estudiante WHERE id = ?1").bind(estudianteId).first();
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
    const mesa = body.mesa ? String(body.mesa).trim().slice(0, 30) : null;
    campos.push("mesa = ?"); valores.push(mesa);
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
      intentosTotal: f.intentos_total, preguntasTotal: f.preguntas_total, preguntasCorrectas: f.preguntas_correctas
    }))
  });
}
