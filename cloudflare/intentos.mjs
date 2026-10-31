/**
 * intentos.mjs
 * Recibe una partida terminada (POST /api/intentos) desde un juego.
 *
 * El servidor NO confia en el estudiante_id ni en el OA que mande el
 * cliente: el estudiante se identifica por su token de sesion (el que
 * devuelve /api/estudiantes/:id/entrar) y el OA se deduce POR RONDA, del
 * juego, el nivel del curso y la `variante` de esa ronda
 * (cloudflare/curriculo.mjs: oaDeRonda), igual que Lectoguarida.
 *
 * `rondas` es generico (ver cloudflare/schema.sql: tabla `ronda`): cada
 * juego manda `variante` y `tipoError` como texto libre con sus propios
 * valores, no una lista cerrada compartida -- cada OA tiene sus propios
 * errores tipicos. El avance por OA (avance_oa) se recalcula desde las
 * rondas, no desde el intento completo: un mismo intento puede alimentar
 * mas de un OA si mezcla variantes de distinto tipo.
 *
 * id lo puede mandar el cliente (uuid): reenviar el mismo intento tras una
 * caida de red no duplica filas (INSERT OR IGNORE). Si el intento ya
 * existia, no se insertan las rondas de nuevo ni se recalcula el avance:
 * ya se habian procesado la primera vez.
 */

import { existeJuego } from "./juegos.mjs";
import { oaDeRonda } from "./curriculo.mjs";

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

  const intentoId = typeof body.id === "string" && body.id ? body.id : crypto.randomUUID();
  const ahoraIso = new Date().toISOString();
  const preguntasTotal = rondas.length;
  const preguntasCorrectas = rondas.filter((r) => r.correcto).length;

  const resultadoInsert = await env.DB.prepare(
    "INSERT OR IGNORE INTO intento " +
    "(id, estudiante_id, juego_id, preguntas_total, preguntas_correctas, duracion_ms, completado, dispositivo, ocurrido_en, recibido_en) " +
    "VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8, ?9)"
  ).bind(
    intentoId, estudiante.id, juegoId, preguntasTotal, preguntasCorrectas,
    duracionMs, dispositivo, String(body.ocurridoEn || ahoraIso), ahoraIso
  ).run();

  const yaExistia = resultadoInsert.meta.changes === 0;
  if (!yaExistia) {
    // El OA se deduce por RONDA, del juego + nivel del CURSO + variante de
    // esa ronda (nunca de lo que mande el cliente): un mismo juego puede
    // mezclar OA distintos segun el tipo de problema (ver curriculo.mjs).
    const oaPorRonda = rondas.map((r) => oaDeRonda(juegoId, estudiante.nivel, r.variante));
    const sentenciasRondas = rondas.map((r, i) => env.DB.prepare(
      "INSERT INTO ronda (id, intento_id, numero, variante, oa_code, nivel, correcto, uso_apoyo, tipo_error, ocurrido_en) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    ).bind(
      crypto.randomUUID(), intentoId, r.numero,
      r.variante !== undefined && r.variante !== null ? String(r.variante) : null,
      oaPorRonda[i],
      r.nivel, r.correcto ? 1 : 0, r.usoApoyo ? 1 : 0,
      r.correcto ? null : (r.tipoError ? String(r.tipoError) : null), ahoraIso
    ));
    await env.DB.batch(sentenciasRondas);

    const oasDistintos = [...new Set(oaPorRonda.filter(Boolean))];
    for (const codigo of oasDistintos) await recalcularAvanceOA(env, estudiante.id, codigo);
  }

  return json({ ok: true, preguntasTotal, preguntasCorrectas }, yaExistia ? 200 : 201);
}

async function recalcularAvanceOA(env, estudianteId, oaCode) {
  const agregado = await env.DB.prepare(
    "SELECT COUNT(DISTINCT r.intento_id) AS intentos_total, COUNT(*) AS preguntas_total, " +
    "  COALESCE(SUM(r.correcto), 0) AS preguntas_correctas, MAX(r.ocurrido_en) AS ultimo " +
    "FROM ronda r JOIN intento i ON i.id = r.intento_id " +
    "WHERE i.estudiante_id = ?1 AND r.oa_code = ?2"
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
