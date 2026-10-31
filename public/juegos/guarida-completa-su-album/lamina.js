/**
 * lamina.js
 * Sobre (10 láminas) y lámina suelta (1), dibujados en SVG inline con el
 * mismo estilo "sticker" del gato (public/entrada/mascota.js): contorno
 * grueso en tinta, relleno plano, sin fotos ni emojis ni marcas.
 *
 * "Álbum de láminas" es un termino generico (no una marca): sobres
 * cerrados para las decenas, láminas sueltas para las unidades.
 *
 * Modulo puro, igual convencion que mascota.js y pan.js: devuelve texto SVG.
 */

const TINTA = '#2B1633';
const SOBRE_PAPEL = '#E8C27A';
const SOBRE_SOLAPA = '#D9A24B';
const LAMINA_FONDO = '#DCEBF7';
const LAMINA_MARCO = '#3D83BC';

export function sobreSVG() {
  return `<svg class="sobre" viewBox="0 0 56 42" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sobre de diez láminas">
    <rect x="3" y="8" width="50" height="31" rx="3" fill="${SOBRE_PAPEL}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M3 10 L28 27 L53 10" fill="none" stroke="${TINTA}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3 10 L28 27 L53 10 L53 11 L28 28 L3 11 Z" fill="${SOBRE_SOLAPA}"/>
  </svg>`;
}

export function laminaSVG() {
  return `<svg class="lamina" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lámina suelta">
    <rect x="3" y="3" width="28" height="38" rx="4" fill="${LAMINA_FONDO}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="8" y="8" width="18" height="18" rx="2" fill="none" stroke="${LAMINA_MARCO}" stroke-width="2.4"/>
    <path d="M10 33 L24 33 M10 37 L20 37" stroke="${LAMINA_MARCO}" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
}

/** Una lamina "repetida" (para el intercambio): mismo dibujo, con una marca. */
export function laminaRepetidaSVG() {
  return `<svg class="lamina lamina--repetida" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lámina repetida">
    <rect x="3" y="3" width="28" height="38" rx="4" fill="${LAMINA_FONDO}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="8" y="8" width="18" height="18" rx="2" fill="none" stroke="${LAMINA_MARCO}" stroke-width="2.4"/>
    <path d="M10 33 L24 33 M10 37 L20 37" stroke="${LAMINA_MARCO}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="25" cy="10" r="6" fill="#FFB302" stroke="${TINTA}" stroke-width="2"/>
    <text x="25" y="13" font-size="8" font-weight="800" text-anchor="middle" fill="${TINTA}">2</text>
  </svg>`;
}
