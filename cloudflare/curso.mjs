/**
 * curso.mjs
 * API de entrada de los estudiantes: codigo de curso -> lista de nombres ->
 * tocar su nombre -> jugar. Sin PIN (se quito en la etapa 3: un nino
 * peleando con un PIN antes de jugar era friccion que no aportaba nada).
 *
 * El "codigo" vive en la tabla curso (columna codigo), no como secreto del
 * Worker, porque Mateguarida puede tener mas de un curso a la vez. Se genera
 * solo (cloudflare/codigos.mjs) y esta protegido de fuerza bruta por IP
 * (cloudflare/limitador.mjs: 5 intentos fallidos -> bloqueo de unos minutos).
 *
 * Crear cursos/estudiantes es cosa del panel docente (cloudflare/docente.mjs,
 * protegido con Cloudflare Access); aqui solo se entra a los que ya existen.
 */

import { obtenerIp, revisarBloqueo, registrarFallo, limpiarFallos } from "./limitador.mjs";

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
  const ip = obtenerIp(request);
  const bloqueo = await revisarBloqueo(env, ip);
  if (bloqueo.bloqueada) {
    return json({ error: `Demasiados intentos. Espera ${bloqueo.minutosRestantes} minuto(s) y vuelve a intentar.` }, 429);
  }

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

  if (!curso) {
    await registrarFallo(env, ip);
    return json({ error: "Codigo incorrecto." }, 401);
  }
  await limpiarFallos(env, ip);

  const { results: estudiantes } = await env.DB.prepare(
    "SELECT id, nombre, inicial_apellido " +
    "FROM estudiante WHERE curso_id = ?1 AND activo = 1 ORDER BY nombre COLLATE NOCASE"
  ).bind(curso.id).all();

  return json({
    curso: { id: curso.id, nombre: curso.nombre, nivel: curso.nivel },
    estudiantes: (estudiantes || []).map((e) => ({
      id: e.id,
      nombre: e.nombre,
      inicialApellido: e.inicial_apellido || null
    }))
  });
}

/** POST /api/estudiantes/:id/entrar  -> { estudiante, token } */
export async function manejarEntrarEstudiante(request, env, estudianteId) {
  const estudiante = await env.DB.prepare(
    "SELECT e.id, e.nombre " +
    "FROM estudiante e JOIN curso c ON c.id = e.curso_id " +
    "WHERE e.id = ?1 AND e.activo = 1 AND c.activo = 1"
  ).bind(estudianteId).first();

  if (!estudiante) return json({ error: "Perfil no encontrado." }, 404);

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + DURACION_SESION_HORAS * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO sesion_estudiante (token, estudiante_id, expires_at) VALUES (?1, ?2, ?3)"
  ).bind(token, estudiante.id, expiresAt).run();

  return json({ estudiante: { id: estudiante.id, nombre: estudiante.nombre }, token });
}
