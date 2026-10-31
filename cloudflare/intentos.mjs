/**
 * intentos.mjs
 * Recibe una partida terminada (POST /api/intentos) desde un juego.
 *
 * El servidor NO confia en el estudiante_id ni en el OA que mande el
 * cliente: el estudiante se identifica por su token de sesion (el que
 * devuelve /api/estudiantes/:id/entrar) y el OA se deduce del juego y del
 * nivel del curso (cloudflare/curriculo.mjs), igual que Lectoguarida.
 *
 * `rondas` es generico (ver cloudflare/schema.sql: tabla `ronda`): cada
 * juego manda `variante` y `tipoError` como texto libre con sus propios
 * valores, no una lista cerrada compartida -- cada OA tiene sus propios
 * errores tipicos.
 *
 * id lo puede mandar el cliente (uuid): reenviar el mismo intento tras una
 * caida de red no duplica filas (INSERT OR IGNORE). Si el intento ya
 * existia, no se insertan las rondas de nuevo ni se recalcula el avance:
 * ya se habian procesado la primera vez.
 */

import { existeJuego } from "./juegos.mjs";
import { oaDeJuego } from "./curriculo.mjs";

const MAX_RONDAS = 30; // margen holgado sobre las 9 de una partida normal
const MAX_LARGO_TEXTO = 40; // variante / tipoError: textos cortos, no HTML

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function textoCorto(valor) {
  return typeof valor === "string" && valor.length <= MAX_LARGO_TEXTO ? valor : null;
}

function validarRonda(r, i) {
  if (!r || typeof r !== "object") return `ronda ${i}: invalida.`;
  if (!Number.isInteger(r.numero) || r.numero < 1) return `ronda ${i}: numero invalido.`;
  if (!Number.isInteger(r.nivel) || r.nivel < 1 || r.nivel > 4) return `ronda ${i}: nivel invalido.`;
  if (typeof r.correcto !== "boolean") return `ronda ${i}: correcto invalido.`;
  if (r.variante !== undefined && r.variante !== null && textoCorto(String(r.variante)) === null) {
    return `ronda ${i}: variante invalida.`;
  }
  if (!r.correcto && r.tipoError !== undefined && r.tipoError !== null && textoCorto(String(r.tipoError)) === null) {
    return `ronda ${i}: tipoError invalido.`;
  }
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

  const rondas = Array.isArray(body.rondas) ? body.rondas : null;
  if (!rondas || rondas.length === 0) return json({ error: "Falta 'rondas'." }, 400);
  if (rondas.length > MAX_RONDAS) return json({ error: "Demasiadas rondas en un solo intento." }, 400);
  for (let i = 0; i < rondas.length; i += 1) {
    const err = validarRonda(rondas[i], i);
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
  const preguntasTotal = rondas.length;
  const preguntasCorrectas = rondas.filter((r) => r.correcto).length;

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
    const sentenciasRondas = rondas.map((r) => env.DB.prepare(
      "INSERT INTO ronda (id, intento_id, numero, variante, nivel, correcto, uso_apoyo, tipo_error, ocurrido_en) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
    ).bind(
      crypto.randomUUID(), intentoId, r.numero,
      r.variante !== undefined && r.variante !== null ? String(r.variante) : null,
      r.nivel, r.correcto ? 1 : 0, r.usoApoyo ? 1 : 0,
      r.correcto ? null : (r.tipoError ? String(r.tipoError) : null), ahoraIso
    ));
    await env.DB.batch(sentenciasRondas);

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
