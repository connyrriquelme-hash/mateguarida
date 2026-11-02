/**
 * contexto.js — icono SVG que se repite en el apoyo de "Guarida salta los
 * techos", uno por cada paso de conteo (1, 2, 5 o 10). Antes eran emojis de
 * texto; mismo estilo sticker (trazo grueso en tinta, color plano) que el
 * resto de la plataforma.
 */

const TINTA = '#2B1633';

export function iconoPasoSVG(paso) {
  if (paso === '2') {
    // calcetin
    return `<svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M15 4 L25 4 L25 20 Q34 22 34 30 Q34 36 26 36 L14 36 Q8 36 8 28 L8 10 Q8 4 15 4 Z"
        fill="#3D83BC" stroke="${TINTA}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M8 16 L25 16" stroke="${TINTA}" stroke-width="2" opacity=".5"/>
      <path d="M26 36 Q34 36 34 30 Q34 25 28 22" fill="#fff" stroke="${TINTA}" stroke-width="2" stroke-linejoin="round" opacity=".9"/>
    </svg>`;
  }
  if (paso === '5') {
    // mano (unidad de conteo, no literalmente 5 dedos)
    return `<svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M14 36 L14 18 Q14 15 16.5 15 Q19 15 19 18 L19 10 Q19 7 21.5 7 Q24 7 24 10 L24 18 Q24 14 26.5 14 Q29 14 29 17 L29 20 Q29 17 31.5 17 Q34 17 34 20 L34 30 Q34 36 28 36 Z"
        fill="#FFB302" stroke="${TINTA}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M14 36 Q10 36 10 30 L10 24 Q10 21 12.5 21 Q15 21 15 24 L15 30" fill="#FFB302" stroke="${TINTA}" stroke-width="2.4" stroke-linejoin="round"/>
    </svg>`;
  }
  if (paso === '10') {
    // moneda de $10
    return `<svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="16" fill="#FFB302" stroke="${TINTA}" stroke-width="2.6"/>
      <circle cx="20" cy="20" r="10" fill="none" stroke="${TINTA}" stroke-width="1.6" opacity=".6"/>
      <text x="20" y="25" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="11" fill="${TINTA}">10</text>
    </svg>`;
  }
  // paso '1': bolita
  return `<svg viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="14" fill="#F03264" stroke="${TINTA}" stroke-width="2.6"/>
    <circle cx="15" cy="15" r="3.5" fill="#fff" opacity=".5"/>
  </svg>`;
}
