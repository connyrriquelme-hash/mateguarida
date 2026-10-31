/**
 * mascota.js
 * Guarida, el gato del logo, dibujado en SVG inline.
 *
 * Anatomia sacada de public/assets/logo.png: cara naranja, contorno rosado
 * grueso, orejas con un triangulo rosado adentro, ojos azules almendrados,
 * nariz rosada y bigotes.
 *
 * Tres animos:
 *   normal  ojos abiertos, sonrisa chica
 *   feliz   ojos cerrados en arco, boca abierta, mejillas rosadas
 *   ups     ojos grandes, cejas preocupadas, boca ondulada y una gota
 *
 * Es un modulo puro: devuelve texto SVG y no toca el DOM salvo en `montarGato`.
 */

export const COLORES = {
  naranja: '#F0591B',
  rosado: '#F03264',
  azul: '#3D83BC',
  tinta: '#2B1633',
  blanco: '#FFFFFF'
};

export const ANIMOS = ['normal', 'feliz', 'ups'];

const DESCRIPCION = {
  normal: 'Guarida, el gato, te mira',
  feliz: 'Guarida, el gato, está feliz',
  ups: 'Guarida, el gato, dice ups'
};

const { naranja, rosado, azul, tinta, blanco } = COLORES;

function ojos(animo) {
  if (animo === 'feliz') {
    // Ojos cerrados en arco: "^ ^".
    return `
      <path d="M33 68 Q44 54 55 68" fill="none" stroke="${tinta}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M65 68 Q76 54 87 68" fill="none" stroke="${tinta}" stroke-width="4.5" stroke-linecap="round"/>`;
  }
  if (animo === 'ups') {
    // Ojos redondos y grandes, con la pupila chica.
    return `
      <ellipse cx="44" cy="66" rx="10" ry="11" fill="${blanco}" stroke="${tinta}" stroke-width="2.5"/>
      <ellipse cx="76" cy="66" rx="10" ry="11" fill="${blanco}" stroke="${tinta}" stroke-width="2.5"/>
      <circle cx="44" cy="68" r="4.2" fill="${azul}" stroke="${tinta}" stroke-width="1.5"/>
      <circle cx="76" cy="68" r="4.2" fill="${azul}" stroke="${tinta}" stroke-width="1.5"/>
      <path d="M32 55 L53 49" stroke="${tinta}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M88 55 L67 49" stroke="${tinta}" stroke-width="3.2" stroke-linecap="round"/>`;
  }
  // Normal: almendrados y azules, como en el logo.
  return `
      <path d="M32 66 Q44 54 56 66 Q44 77 32 66 Z" fill="${azul}" stroke="${tinta}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M64 66 Q76 54 88 66 Q76 77 64 66 Z" fill="${azul}" stroke="${tinta}" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="44" cy="66" rx="3.4" ry="6" fill="${tinta}"/>
      <ellipse cx="76" cy="66" rx="3.4" ry="6" fill="${tinta}"/>
      <circle cx="45.4" cy="63.6" r="1.4" fill="${blanco}"/>
      <circle cx="77.4" cy="63.6" r="1.4" fill="${blanco}"/>`;
}

function boca(animo) {
  if (animo === 'feliz') {
    return `
      <path d="M46 85 Q60 103 74 85 Z" fill="${tinta}" stroke="${tinta}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M53 92 Q60 98 67 92 Q60 89 53 92 Z" fill="${rosado}"/>
      <circle cx="30" cy="80" r="6" fill="${rosado}" opacity=".45"/>
      <circle cx="90" cy="80" r="6" fill="${rosado}" opacity=".45"/>`;
  }
  if (animo === 'ups') {
    return `<path d="M50 92 Q55 86 60 92 Q65 98 70 92" fill="none" stroke="${tinta}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<path d="M60 84 L60 88 M60 88 Q54 94 47 89 M60 88 Q66 94 73 89" fill="none" stroke="${tinta}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function gota(animo) {
  if (animo !== 'ups') return '';
  return `<path d="M100 36 Q108 48 100 54 Q92 48 100 36 Z" fill="${azul}" stroke="${tinta}" stroke-width="2.4" stroke-linejoin="round"/>`;
}

/**
 * SVG del gato como texto.
 * `decorativo` (por defecto) lo oculta a los lectores de pantalla: la reaccion
 * ya se anuncia con texto en la pantalla del juego.
 */
export function gatoSVG(animo = 'normal', { decorativo = true } = {}) {
  const a = ANIMOS.includes(animo) ? animo : 'normal';
  const acc = decorativo
    ? 'aria-hidden="true" focusable="false"'
    : `role="img" aria-label="${DESCRIPCION[a]}"`;

  return `<svg class="gato gato--${a}" data-animo="${a}" viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg" ${acc}>
    <g stroke-linejoin="round" stroke-linecap="round">
      <polygon points="22,58 19,3 62,40" fill="${naranja}" stroke="${rosado}" stroke-width="6"/>
      <polygon points="98,58 101,3 58,40" fill="${naranja}" stroke="${rosado}" stroke-width="6"/>
      <polygon points="30,46 31,22 46,35" fill="${rosado}"/>
      <polygon points="90,46 89,22 74,35" fill="${rosado}"/>
      <ellipse cx="60" cy="68" rx="43" ry="35" fill="${naranja}" stroke="${rosado}" stroke-width="6.5"/>
      <path d="M60 36 L60 45 M51 38 L52.5 45 M69 38 L67.5 45" fill="none" stroke="${azul}" stroke-width="3.6"/>
    </g>
    ${ojos(a)}
    <path d="M54 78 Q60 74 66 78 Q60 87 54 78 Z" fill="${rosado}" stroke="${tinta}" stroke-width="2" stroke-linejoin="round"/>
    ${boca(a)}
    <g stroke="${azul}" stroke-width="2.6" stroke-linecap="round" fill="none">
      <path d="M27 76 L6 71 M27 81 L6 83"/>
      <path d="M93 76 L114 71 M93 81 L114 83"/>
    </g>
    ${gota(a)}
  </svg>`;
}

/** Pone al gato en un contenedor. Devuelve una funcion para cambiarle el animo. */
export function montarGato(contenedor, animo = 'normal', opciones = {}) {
  contenedor.innerHTML = gatoSVG(animo, opciones);
  return (nuevoAnimo) => {
    contenedor.innerHTML = gatoSVG(nuevoAnimo, opciones);
  };
}
