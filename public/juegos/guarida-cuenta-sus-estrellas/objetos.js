/**
 * objetos.js — SVG de los objetos que se cuentan ("Guarida cuenta sus
 * estrellas") y de la balanza para comparar. Mismo estilo sticker (trazo
 * grueso en tinta, color plano) que pan.js y lamina.js.
 */

export const TEMAS = ['estrella', 'conchita', 'manzana'];

const TINTA = '#2B1633';

/** Un objeto contable, chico, con marco circular como los iconos de estudiante. */
export function objetoSVG(tema) {
  if (tema === 'conchita') {
    return `<svg viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="27" fill="#0E7C7C" stroke="${TINTA}" stroke-width="3.5"/>
      <path d="M30 14 Q42 20 42 34 Q42 44 30 46 Q18 44 18 34 Q18 20 30 14 Z" fill="#C9A98C" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M30 18 L30 44 M24 22 L26 42 M36 22 L34 42" stroke="${TINTA}" stroke-width="1.6" fill="none" opacity=".5"/>
    </svg>`;
  }
  if (tema === 'manzana') {
    return `<svg viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="27" fill="#F03264" stroke="${TINTA}" stroke-width="3.5"/>
      <path d="M30 24 Q18 22 18 34 Q18 46 30 46 Q42 46 42 34 Q42 22 30 24 Z" fill="#F0591B" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M30 24 L30 16 Q34 14 36 17" stroke="${TINTA}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="34" cy="16" rx="4" ry="2.4" fill="#0FA36D" stroke="${TINTA}" stroke-width="1.6" transform="rotate(-30 34 16)"/>
      <ellipse cx="25" cy="32" rx="3" ry="4" fill="#fff" opacity=".4"/>
    </svg>`;
  }
  // estrella (por defecto)
  return `<svg viewBox="0 0 60 60" aria-hidden="true">
    <circle cx="30" cy="30" r="27" fill="#FFB302" stroke="${TINTA}" stroke-width="3.5"/>
    <path d="M30 14 L35 25 L47 26 L38 34 L41 46 L30 39 L19 46 L22 34 L13 26 L25 25 Z" fill="#F0591B" stroke="${TINTA}" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`;
}

/** Igual que objetoSVG, pero con una marca de "ya lo conté" encima. */
export function objetoContadoSVG(tema) {
  return objetoSVG(tema).replace('</svg>',
    `<circle cx="46" cy="14" r="11" fill="#0FA36D" stroke="${TINTA}" stroke-width="2.5"/>
     <path d="M41 14 L45 18 L52 10" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`);
}

/** La balanza, siempre nivelada (es una de las 3 opciones al comparar, no se anima). */
export function balanzaSVG() {
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect x="46" y="20" width="8" height="54" rx="3" fill="#8C6A4A" stroke="${TINTA}" stroke-width="3"/>
    <rect x="20" y="24" width="60" height="6" rx="3" fill="#8C6A4A" stroke="${TINTA}" stroke-width="3"/>
    <path d="M20 30 L12 52 Q20 58 28 52 Z" fill="#C9A98C" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M80 30 L72 52 Q80 58 88 52 Z" fill="#C9A98C" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M20 30 L20 24 M80 30 L80 24" stroke="${TINTA}" stroke-width="2.5"/>
    <ellipse cx="50" cy="80" rx="16" ry="8" fill="#8C6A4A" stroke="${TINTA}" stroke-width="3"/>
  </svg>`;
}
