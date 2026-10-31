/**
 * curso.mjs
 * API de entrada de los estudiantes: codigo de curso -> lista de nombres ->
 * elegir nombre (con PIN si el perfil tiene uno). Sin PIN de curso: el
 * "codigo" vive en la tabla curso (columna codigo), no como secreto del
 * Worker, porque Mateguarida puede tener mas de un curso a la vez.
 *
 * Esto es la base que la etapa 3 (panel docente) necesita para funcionar;
 * por ahora no hay forma de CREAR cursos/estudiantes desde aqui, solo de
 * entrar a los que ya existen en D1 (se agregan a mano o con un seed, ver
 * cloudflare/seed-demo.sql, mientras no exista el panel).
 */

import { pinCoincide } from "./pin.mjs";

const DURACION_SESION_HORAS = 12;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function normalizarCodigo(valor) {
  return String(valor || "").trim().toUpperCase();
}

/** POST /api/entrada  { codigo } -> { curso, estudiantes } */
export async function manejarEntrada(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Cuerpo invalido." }, 400);
  }

  const codigo = normalizarCodigo(body.codigo);
  if (!codigo) return json({ error: "Falta el codigo del curso." }, 400);

  const curso = await env.DB.prepare(
    "SELECT id, nombre, nivel FROM curso WHERE codigo = ?1 AND activo = 1"
  ).bind(codigo).first();

  if (!curso) return json({ error: "Codigo incorrecto." }, 401);

  const { results: estudiantes } = await env.DB.prepare(
    "SELECT id, nombre, (pin_hash IS NOT NULL AND pin_hash != '') AS tiene_pin " +
    "FROM estudiante WHERE curso_id = ?1 AND activo = 1 ORDER BY nombre COLLATE NOCASE"
  ).bind(curso.id).all();

  return json({
    curso: { id: curso.id, nombre: curso.nombre, nivel: curso.nivel },
    estudiantes: (estudiantes || []).map((e) => ({
      id: e.id,
      nombre: e.nombre,
      tienePin: Boolean(e.tiene_pin)
    }))
  });
}

/** POST /api/estudiantes/:id/entrar  { pin? } -> { estudiante, token } */
export async function manejarEntrarEstudiante(request, env, estudianteId) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // cuerpo vacio es valido: un perfil sin PIN entra sin mandar nada
  }

  const estudiante = await env.DB.prepare(
    "SELECT e.id, e.nombre, e.pin_salt, e.pin_hash " +
    "FROM estudiante e JOIN curso c ON c.id = e.curso_id " +
    "WHERE e.id = ?1 AND e.activo = 1 AND c.activo = 1"
  ).bind(estudianteId).first();

  if (!estudiante) return json({ error: "Perfil no encontrado." }, 404);

  const tienePin = Boolean(estudiante.pin_salt && estudiante.pin_hash);
  if (tienePin) {
    const coincide = await pinCoincide(body.pin, estudiante.pin_salt, estudiante.pin_hash);
    if (!coincide) return json({ error: "PIN incorrecto. Intenta otra vez con calma." }, 401);
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + DURACION_SESION_HORAS * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO sesion_estudiante (token, estudiante_id, expires_at) VALUES (?1, ?2, ?3)"
  ).bind(token, estudiante.id, expiresAt).run();

  return json({ estudiante: { id: estudiante.id, nombre: estudiante.nombre }, token });
}
