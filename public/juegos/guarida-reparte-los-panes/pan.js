/**
 * pan.js
 * Marraqueta y hallulla, dibujadas en SVG inline con el mismo estilo
 * "sticker" del gato (public/entrada/mascota.js): contorno grueso en tinta,
 * relleno plano, sin fotos ni emojis.
 *
 * Marraqueta: dos bollos unidos con una marca al medio (el "corte" que la
 * distingue de la hallulla). Hallulla: disco chato con las perforaciones
 * en cruz que se le hacen antes de hornear.
 *
 * Modulo puro, igual convencion que mascota.js: devuelve texto SVG.
 */

const TINTA = '#2B1633';
const CORTEZA = '#D9A24B';
const CORTEZA_CLARA = '#E8C27A';
const SOMBRA_CORTEZA = '#B9823A';

function marraquetaSVG() {
  return `<svg class="pan pan--marraqueta" viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Marraqueta">
    <path d="M6 24 Q2 13 15 10 Q26 5 32 13 Q38 5 49 10 Q62 13 58 24 Q62 31 49 33 Q38 37 32 29 Q26 37 15 33 Q2 31 6 24 Z"
      fill="${CORTEZA}" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 12 L32 30" stroke="${TINTA}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M13 17 Q17 21 13 25" fill="none" stroke="${SOMBRA_CORTEZA}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M51 17 Q47 21 51 25" fill="none" stroke="${SOMBRA_CORTEZA}" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

function hallullaSVG() {
  return `<svg class="pan pan--hallulla" viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hallulla">
    <ellipse cx="32" cy="26" rx="27" ry="18" fill="${CORTEZA_CLARA}" stroke="${TINTA}" stroke-width="3"/>
    <g fill="${TINTA}">
      <circle cx="20" cy="20" r="1.8"/>
      <circle cx="32" cy="16" r="1.8"/>
      <circle cx="44" cy="20" r="1.8"/>
      <circle cx="20" cy="30" r="1.8"/>
      <circle cx="32" cy="26" r="1.8"/>
      <circle cx="44" cy="30" r="1.8"/>
      <circle cx="26" cy="36" r="1.8"/>
      <circle cx="38" cy="36" r="1.8"/>
    </g>
  </svg>`;
}

/** panSVG('marraqueta' | 'hallulla') -> texto SVG. */
export function panSVG(tipo) {
  return tipo === 'hallulla' ? hallullaSVG() : marraquetaSVG();
}

export const TIPOS_PAN = ['marraqueta', 'hallulla'];
