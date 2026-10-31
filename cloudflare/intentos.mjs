/**
 * intentos.mjs
 * Recibe una partida terminada (POST /api/intentos) desde un juego.
 *
 * El servidor NO confia en el estudiante_id ni en el OA que mande el
 * cliente: el estudiante se identifica por su token de sesion (el que
 * devuelve /api/estudiantes/:id/entrar) y el OA se deduce del juego y del
 * nivel del curso (cloudflare/curriculo.mjs), igual que Lectoguarida.
 *
 * id lo puede mandar el cliente (uuid): reenviar el mismo intento tras una
 * caida de red no duplica filas (INSERT OR IGNORE). Si el intento ya
 * existia, no se insertan los saltos de nuevo ni se recalcula el avance:
 * ya se habian procesado la primera vez.
 */

import { existeJuego } from "./juegos.mjs";
import { oaDeJuego } from "./curriculo.mjs";

const TIPOS_CONTEO = ["2", "5", "10"];
const DIRECCIONES = ["adelante", "atras"];
const TIPOS_ERROR = ["cuenta_de_uno", "salto_equivocado", "confunde_decena"];
const MAX_SALTOS = 30; // margen holgado sobre los 9 de una partida normal

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function validarSalto(s, i) {
  if (!s || typeof s !== "object") return `salto ${i}: invalido.`;
  if (!Number.isInteger(s.numero) || s.numero < 1) return `salto ${i}: numero invalido.`;
  if (!TIPOS_CONTEO.includes(String(s.tipoConteo))) return `salto ${i}: tipoConteo invalido.`;
  if (!DIRECCIONES.includes(s.direccion)) return `salto ${i}: direccion invalida.`;
  if (!Number.isInteger(s.nivel) || s.nivel < 1 || s.nivel > 4) return `salto ${i}: nivel invalido.`;
  if (typeof s.correcto !== "boolean") return `salto ${i}: correcto invalido.`;
  if (!s.correcto && s.tipoError && !TIPOS_ERROR.includes(s.tipoError)) return `salto ${i}: tipoError invalido.`;
  return null;
}

/** POST /api/intentos */
export async function manejarIntento(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Cuerpo invalido." }, 400);
  }

  const token = String(body.token || "");
  if (!token) return json({ error: "Falta el token de sesion." }, 401);

  const sesion = await env.DB.prepare(
    "SELECT estudiante_id, expires_at FROM sesion_estudiante WHERE token = ?1"
  ).bind(token).first();
  if (!sesion || new Date(sesion.expires_at) < new Date()) {
    return json({ error: "La sesion ya no es valida. Vuelve a entrar." }, 401);
  }

  const estudiante = await env.DB.prepare(
    "SELECT e.id, c.nivel FROM estudiante e JOIN curso c ON c.id = e.curso_id WHERE e.id = ?1 AND e.activo = 1 AND c.activo = 1"
  ).bind(sesion.estudiante_id).first();
  if (!estudiante) return json({ error: "Perfil no encontrado." }, 404);

  const juegoId = String(body.juegoId || "");
  if (!existeJuego(juegoId)) return json({ error: "Juego no reconocido." }, 400);

  const saltos = Array.isArray(body.saltos) ? body.saltos : null;
  if (!saltos || saltos.length === 0) return json({ error: "Falta 'saltos'." }, 400);
  if (saltos.length > MAX_SALTOS) return json({ error: "Demasiados saltos en un solo intento." }, 400);
  for (let i = 0; i < saltos.length; i += 1) {
    const err = validarSalto(saltos[i], i);
    if (err) return json({ error: err }, 400);
  }

  const duracionMs = Number.isInteger(body.duracionMs) && body.duracionMs >= 0 ? body.duracionMs : null;
  const dispositivo = ["tablet", "pizarra", "otro"].includes(body.dispositivo) ? body.dispositivo : null;

  // El OA se deduce del juego + nivel del CURSO del estudiante, nunca de lo
  // que mande el cliente.
  const oas = oaDeJuego(juegoId, estudiante.nivel);
  const oaCode = oas[0] || null;

  const intentoId = typeof body.id === "string" && body.id ? body.id : crypto.randomUUID();
  const ahoraIso = new Date().toISOString();
  const preguntasTotal = saltos.length;
  const preguntasCorrectas = saltos.filter((s) => s.correcto).length;

  const resultadoInsert = await env.DB.prepare(
    "INSERT OR IGNORE INTO intento " +
    "(id, estudiante_id, juego_id, oa_code, preguntas_total, preguntas_correctas, duracion_ms, completado, dispositivo, ocurrido_en, recibido_en) " +
    "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8, ?9, ?10)"
  ).bind(
    intentoId, estudiante.id, juegoId, oaCode, preguntasTotal, preguntasCorrectas,
    duracionMs, dispositivo, String(body.ocurridoEn || ahoraIso), ahoraIso
  ).run();

  const yaExistia = resultadoInsert.meta.changes === 0;
  if (!yaExistia) {
    const sentenciasSaltos = saltos.map((s) => env.DB.prepare(
      "INSERT INTO salto (id, intento_id, numero, tipo_conteo, direccion, nivel, correcto, uso_apoyo, tipo_error, ocurrido_en) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    ).bind(
      crypto.randomUUID(), intentoId, s.numero, String(s.tipoConteo), s.direccion, s.nivel,
      s.correcto ? 1 : 0, s.usoApoyo ? 1 : 0, s.correcto ? null : (s.tipoError || null), ahoraIso
    ));
    await env.DB.batch(sentenciasSaltos);

    if (oaCode) await recalcularAvanceOA(env, estudiante.id, oaCode);
  }

  return json({ ok: true, preguntasTotal, preguntasCorrectas }, yaExistia ? 200 : 201);
}

async function recalcularAvanceOA(env, estudianteId, oaCode) {
  const agregado = await env.DB.prepare(
    "SELECT COUNT(*) AS intentos_total, COALESCE(SUM(preguntas_total), 0) AS preguntas_total, " +
    "  COALESCE(SUM(preguntas_correctas), 0) AS preguntas_correctas, MAX(ocurrido_en) AS ultimo " +
    "FROM intento WHERE estudiante_id = ?1 AND oa_code = ?2"
  ).bind(estudianteId, oaCode).first();

  const total = Number(agregado.preguntas_total) || 0;
  const correctas = Number(agregado.preguntas_correctas) || 0;
  const precision = total > 0 ? Math.round((correctas / total) * 100) / 100 : 0;

  await env.DB.prepare(
    "INSERT INTO avance_oa (estudiante_id, oa_code, intentos_total, preguntas_total, preguntas_correctas, precision, ultimo_intento_en, updated_at) " +
    "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) " +
    "ON CONFLICT(estudiante_id, oa_code) DO UPDATE SET " +
    "  intentos_total = ?3, preguntas_total = ?4, preguntas_correctas = ?5, precision = ?6, ultimo_intento_en = ?7, updated_at = ?8"
  ).bind(
    estudianteId, oaCode, agregado.intentos_total, total, correctas, precision, agregado.ultimo, new Date().toISOString()
  ).run();
}
