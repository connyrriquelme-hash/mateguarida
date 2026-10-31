/**
 * curriculo.mjs
 * Que OA trabaja cada juego en cada nivel, para el servidor. Misma idea que
 * curriculo.mjs de Lectoguarida: el servidor NO confia en los OA que manda
 * el cliente al enviar un intento -- los deduce del juego y del nivel con
 * juegosOA. Si el cliente miente sobre el OA, se ignora.
 */

import juegosOA from "../data/juegos-oa.json" with { type: "json" };

/** Codigos OA que trabaja un juego en un nivel ([] si no hay ninguno declarado). */
export function oaDeJuego(juegoId, nivelId) {
  const e = juegosOA.juegos[juegoId]?.[nivelId];
  return e ? e.oa.slice() : [];
}

/** { oa: [codigos], porQue, alcance } de un juego en un nivel, o null. */
export function anclaDeJuego(juegoId, nivelId) {
  const e = juegosOA.juegos[juegoId]?.[nivelId];
  return e ? { oa: e.oa.slice(), porQue: e.porQue, alcance: e.alcance || "completo" } : null;
}
