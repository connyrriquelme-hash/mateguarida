/**
 * curriculo.mjs
 * Que OA trabaja cada RONDA (no el juego completo), para el servidor.
 * Misma idea que curriculo.mjs de Lectoguarida: el servidor NO confia en el
 * OA que manda el cliente -- lo deduce del juego, del nivel y de la
 * variante de la ronda con juegosOA. Si el cliente miente, se ignora.
 *
 * Un juego puede tocar mas de un OA en la misma partida (ej. "Guarida
 * completa su album" mezcla OA-09/OA-06 en niveles 1-3 y OA-07 en el modo
 * "arma_numero" del nivel 4): por eso la atribucion es por RONDA, segun el
 * primer tramo de su `variante` (antes del primer "-"), no una lista fija
 * por juego+nivel.
 */

import juegosOA from "../data/juegos-oa.json" with { type: "json" };

/**
 * OA que trabaja una ronda en particular, o null si el juego/nivel no
 * declara ninguno. `variante` tiene la forma "<tipo>-<resto>" (ej.
 * "arma_numero-nivel4", "5-adelante"); solo se mira <tipo>.
 */
export function oaDeRonda(juegoId, nivelId, variante) {
  const e = juegosOA.juegos[juegoId]?.[nivelId];
  if (!e) return null;
  const tipo = String(variante || "").split("-")[0];
  return e.oaPorVariante?.[tipo] || e.oaPorDefecto || null;
}

/**
 * Ficha completa de un juego en un nivel (para mostrar en el panel o en
 * documentacion): todos los OA que puede llegar a declarar, por que, y el
 * alcance frente a cada uno. No se usa para calcular avance (eso es
 * oaDeRonda, por ronda), solo para describir el juego.
 */
export function anclaDeJuego(juegoId, nivelId) {
  const e = juegosOA.juegos[juegoId]?.[nivelId];
  if (!e) return null;
  const oaUnicos = [...new Set([e.oaPorDefecto, ...Object.values(e.oaPorVariante || {})].filter(Boolean))];
  return { oa: oaUnicos, porQue: e.porQue, alcance: e.alcance || "completo" };
}
