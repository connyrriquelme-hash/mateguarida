/**
 * iconos.js
 * Catalogo cerrado de 36 iconos de estudiante (forma + nombre, sin fotos):
 * 18 fauna chilena + 18 animales conocidos, para que un nino que todavia no
 * lee (Transicion) entre tocando su dibujo en vez de su nombre.
 *
 * Modulo puro, igual patron que mascota.js: cada entrada de ICONOS tiene
 * {nombre, grupo, svg} y `svg` es el marcado SVG ya armado (no una funcion
 * que haya que llamar), para que iconoSVG(clave) sea una sola consulta.
 *
 * El SERVIDOR (cloudflare/iconos.mjs) mantiene su propia lista de las
 * mismas 36 claves, en el MISMO ORDEN, para la asignacion automatica y la
 * validacion -- no puede importar este archivo (vive en public/, se sirve
 * al navegador, no al Worker), asi que si se agrega o quita un icono hay
 * que actualizar los dos archivos.
 *
 * Diseño: silueta reconocible SIN color (orejas/hocico/pico propios,
 * revisado en blanco y negro y a 80px), con volumen (zona clara y oscura),
 * expresion (cejas, parpados, doble brillo, mejillas) y un rasgo propio por
 * especie (bigotes, dientes, astas, collar, etc.).
 */

const T = '#2B1633';
const BLUSH = '#F0B6C2';

function ojo(cx, cy, r, iris, opts) {
  opts = opts || {};
  r = r || 7;
  const out = [];
  out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${T}" stroke-width="${(r * 0.32).toFixed(1)}"/>`);
  out.push(`<circle cx="${cx}" cy="${cy + r * 0.12}" r="${(r * 0.58).toFixed(1)}" fill="${iris}"/>`);
  out.push(`<circle cx="${cx}" cy="${cy + r * 0.12}" r="${(r * 0.3).toFixed(1)}" fill="${T}"/>`);
  out.push(`<circle cx="${cx - r * 0.3}" cy="${cy - r * 0.24}" r="${(r * 0.17).toFixed(1)}" fill="#fff"/>`);
  out.push(`<circle cx="${cx + r * 0.22}" cy="${cy + r * 0.04}" r="${(r * 0.09).toFixed(1)}" fill="#fff" opacity=".85"/>`);
  if (opts.parpado) {
    out.push(`<path d="M${cx - r * 0.95} ${cy - r * 0.55} Q${cx} ${cy - r * 1.35} ${cx + r * 0.95} ${cy - r * 0.55}" stroke="${T}" stroke-width="${(r * 0.26).toFixed(1)}" fill="none" stroke-linecap="round"/>`);
  }
  return out.join('');
}

function ojoOvalado(cx, cy, iris, opts) {
  opts = opts || {};
  const out = [
    `<ellipse cx="${cx}" cy="${cy}" rx="7.5" ry="6" fill="#fff" stroke="${T}" stroke-width="2.3"/>`,
    `<ellipse cx="${cx}" cy="${cy + 1}" rx="4.2" ry="4.6" fill="${iris}"/>`,
    `<ellipse cx="${cx}" cy="${cy + 1}" rx="1.5" ry="4.2" fill="${T}"/>`,
    `<circle cx="${cx - 2.2}" cy="${cy - 1.8}" r="1.1" fill="#fff"/>`,
    `<circle cx="${cx + 2}" cy="${cy + 1.4}" r="0.7" fill="#fff" opacity=".85"/>`
  ];
  if (opts.pestanas) {
    out.push(`<path d="M${cx + 5} ${cy - 5} L${cx + 9} ${cy - 9} M${cx + 2} ${cy - 6.5} L${cx + 3} ${cy - 10}" stroke="${T}" stroke-width="1.3" stroke-linecap="round"/>`);
  }
  return out.join('');
}

function ceja(cx, cy, ancho, curva) {
  return `<path d="M${cx - ancho / 2} ${cy} Q${cx} ${cy + curva} ${cx + ancho / 2} ${cy}" stroke="${T}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`;
}

function mejillas(cx1, cx2, cy, r) {
  return `<ellipse cx="${cx1}" cy="${cy}" rx="${r}" ry="${(r * 0.68).toFixed(1)}" fill="${BLUSH}" opacity=".45"/>` +
    `<ellipse cx="${cx2}" cy="${cy}" rx="${r}" ry="${(r * 0.68).toFixed(1)}" fill="${BLUSH}" opacity=".45"/>`;
}

function bigotePuntos(cx, cy, lado) {
  const dx = lado === 'izq' ? -1 : 1;
  const out = [];
  [-6, 0, 6].forEach((dy) => {
    out.push(`<path d="M${cx} ${cy + dy * 0.6} L${cx + dx * 22} ${cy + dy}" stroke="${T}" stroke-width="1.3" stroke-linecap="round" opacity=".65"/>`);
    out.push(`<circle cx="${cx + dx * 22}" cy="${cy + dy}" r="1" fill="${T}" opacity=".65"/>`);
  });
  return out.join('');
}

function fosas(cx, cy, separacion) {
  return `<ellipse cx="${cx - separacion}" cy="${cy}" rx="1.6" ry="2.2" fill="${T}" opacity=".7"/>` +
    `<ellipse cx="${cx + separacion}" cy="${cy}" rx="1.6" ry="2.2" fill="${T}" opacity=".7"/>`;
}

function sombraBorde(oscuro) {
  return `<path d="M8 66 Q50 100 92 66 Q50 90 8 66 Z" fill="${oscuro}" opacity=".16"/>`;
}

function luzFrente(cx, cy, rx, ry) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".2"/>`;
}

function marco(clave, fondo, piezas) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true">` +
    `<defs><clipPath id="c-${clave}"><circle cx="50" cy="50" r="47"/></clipPath></defs>` +
    `<circle cx="50" cy="50" r="47" fill="${fondo}" stroke="${T}" stroke-width="4"/>` +
    `<g clip-path="url(#c-${clave})">${piezas.join('')}</g>` +
    `</svg>`;
}

export const ICONOS = {
  // ---------------------------- fauna chilena (18) ----------------------------
  'pudu': { nombre: 'Pudú', grupo: 'chile', svg: marco('pudu', '#A9794F', [
    '<ellipse cx="50" cy="58" rx="40" ry="38" fill="#A9794F"/>',
    sombraBorde('#5B3F26'), luzFrente(50, 68, 16, 14),
    '<ellipse cx="22" cy="24" rx="11" ry="13" fill="#8A5F39" stroke="' + T + '" stroke-width="3.5"/>',
    '<ellipse cx="78" cy="24" rx="11" ry="13" fill="#8A5F39" stroke="' + T + '" stroke-width="3.5"/>',
    '<ellipse cx="22" cy="26" rx="5" ry="7" fill="#D9BC95"/>', '<ellipse cx="78" cy="26" rx="5" ry="7" fill="#D9BC95"/>',
    ceja(36, 42, 14, -3), ceja(64, 42, 14, -3),
    ojo(36, 54, 8, '#3A2317', { parpado: true }), ojo(64, 54, 8, '#3A2317', { parpado: true }),
    mejillas(30, 70, 62, 6),
    '<ellipse cx="50" cy="76" rx="9" ry="7" fill="#5B4027" stroke="' + T + '" stroke-width="2.6"/>',
    fosas(50, 74, 3),
    '<path d="M44 84 Q50 88 56 84" stroke="' + T + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    '<path d="M14 60 Q10 62 14 66" stroke="' + T + '" stroke-width="1.3" fill="none" opacity=".3"/>'
  ]) },
  'huemul': { nombre: 'Huemul', grupo: 'chile', svg: marco('huemul', '#8C6A47', [
    '<ellipse cx="50" cy="62" rx="36" ry="34" fill="#8C6A47"/>',
    sombraBorde('#4A3420'), luzFrente(50, 72, 15, 12),
    '<path d="M30 30 Q24 4 14 2 Q20 14 16 22 M30 30 Q34 10 42 8 Q38 18 40 26" stroke="' + T + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M70 30 Q76 4 86 2 Q80 14 84 22 M70 30 Q66 10 58 8 Q62 18 60 26" stroke="' + T + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M18 8 L14 10 M20 16 L16 19 M78 8 L82 10 M80 16 L84 19" stroke="' + T + '" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>',
    ceja(36, 46, 13, -3), ceja(64, 46, 13, -3),
    ojo(36, 58, 8, '#3A2317', { parpado: true }), ojo(64, 58, 8, '#3A2317', { parpado: true }),
    mejillas(30, 70, 66, 6),
    '<ellipse cx="50" cy="80" rx="10" ry="8" fill="#6B4A33" stroke="' + T + '" stroke-width="2.6"/>',
    fosas(50, 78, 3.4),
    '<ellipse cx="50" cy="42" rx="7" ry="6" fill="#D9C2A1" opacity=".55"/>'
  ]) },
  'puma': { nombre: 'Puma', grupo: 'chile', svg: marco('puma', '#D8A86A', [
    '<ellipse cx="50" cy="60" rx="42" ry="40" fill="#D8A86A"/>',
    sombraBorde('#8A5E2E'), luzFrente(50, 70, 17, 14),
    '<polygon points="20,18 36,36 14,38" fill="#D8A86A" stroke="' + T + '" stroke-width="3.5" stroke-linejoin="round"/>',
    '<polygon points="80,18 64,36 86,38" fill="#D8A86A" stroke="' + T + '" stroke-width="3.5" stroke-linejoin="round"/>',
    '<polygon points="26,26 34,34 22,34" fill="#B9865A"/>', '<polygon points="74,26 66,34 78,34" fill="#B9865A"/>',
    ceja(39, 44, 14, -4), ceja(61, 44, 14, -4),
    ojo(36, 56, 8.5, '#7A4A16', { parpado: true }), ojo(64, 56, 8.5, '#7A4A16', { parpado: true }),
    mejillas(26, 74, 66, 7),
    '<path d="M44 46 L34 40 M56 46 L66 40" stroke="' + T + '" stroke-width="2" fill="none" stroke-linecap="round"/>',
    '<ellipse cx="50" cy="72" rx="8" ry="6" fill="#F3E4D2" stroke="' + T + '" stroke-width="2.3"/>',
    '<path d="M50 70 L46 78 M50 70 L54 78 M50 70 Q50 82 50 82" stroke="' + T + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    fosas(50, 68, 2.6),
    bigotePuntos(40, 72, 'izq'), bigotePuntos(60, 72, 'der')
  ]) },
  'guina': { nombre: 'Güiña', grupo: 'chile', svg: marco('guina', '#E0B274', [
    '<ellipse cx="50" cy="60" rx="38" ry="36" fill="#E0B274"/>',
    sombraBorde('#9A6A2E'), luzFrente(50, 68, 15, 12),
    '<polygon points="24,20 36,38 16,38" fill="#E0B274" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<polygon points="76,20 64,38 84,38" fill="#E0B274" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<polygon points="26,26 32,34 22,34" fill="' + T + '"/>', '<polygon points="74,26 68,34 78,34" fill="' + T + '"/>',
    ceja(38, 46, 12, -3), ceja(62, 46, 12, -3),
    ojo(37, 56, 7.5, '#C77F1E', { parpado: true }), ojo(63, 56, 7.5, '#C77F1E', { parpado: true }),
    mejillas(28, 72, 64, 6),
    '<ellipse cx="50" cy="72" rx="6.5" ry="5" fill="#F3E4D2" stroke="' + T + '" stroke-width="2.2"/>',
    fosas(50, 70, 2.2),
    '<g fill="#8A5A2B" opacity=".85"><circle cx="20" cy="50" r="2.6"/><circle cx="24" cy="62" r="2.6"/><circle cx="80" cy="50" r="2.6"/><circle cx="76" cy="62" r="2.6"/><circle cx="16" cy="70" r="2.2"/><circle cx="84" cy="70" r="2.2"/></g>',
    bigotePuntos(42, 72, 'izq'), bigotePuntos(58, 72, 'der')
  ]) },
  'zorro-culpeo': { nombre: 'Zorro culpeo', grupo: 'chile', svg: marco('zorro', '#F0591B', [
    '<ellipse cx="50" cy="60" rx="38" ry="36" fill="#F0591B"/>',
    sombraBorde('#A83912'), luzFrente(50, 68, 15, 12),
    '<polygon points="20,14 36,36 12,34" fill="#F0591B" stroke="' + T + '" stroke-width="3.5" stroke-linejoin="round"/>',
    '<polygon points="80,14 64,36 88,34" fill="#F0591B" stroke="' + T + '" stroke-width="3.5" stroke-linejoin="round"/>',
    '<polygon points="22,20 30,30 16,30" fill="#2B1633"/>', '<polygon points="78,20 70,30 84,30" fill="#2B1633"/>',
    ceja(37, 44, 12, -4), ceja(63, 44, 12, -4),
    ojo(37, 54, 7.5, '#3A2317', { parpado: true }), ojo(63, 54, 7.5, '#3A2317', { parpado: true }),
    '<path d="M32 86 Q50 100 68 86 Q50 92 32 86 Z" fill="#fff"/>',
    '<path d="M50 62 Q34 68 36 82 Q50 90 64 82 Q66 68 50 62 Z" fill="#F0591B" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<ellipse cx="50" cy="80" rx="5.5" ry="4" fill="' + T + '"/>',
    fosas(50, 78, 2.6),
    bigotePuntos(40, 80, 'izq'), bigotePuntos(60, 80, 'der')
  ]) },
  'guanaco': { nombre: 'Guanaco', grupo: 'chile', svg: marco('guanaco', '#D9B98A', [
    '<ellipse cx="50" cy="66" rx="30" ry="42" fill="#D9B98A"/>',
    sombraBorde('#9C7E52'), luzFrente(50, 54, 13, 20),
    '<path d="M30 20 Q34 6 44 8 Q38 16 40 26" fill="#D9B98A" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M70 20 Q66 6 56 8 Q62 16 60 26" fill="#D9B98A" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M34 12 Q38 8 42 12 M58 12 Q62 8 66 12" stroke="#B89A66" stroke-width="1.6" fill="none" opacity=".6"/>',
    ceja(38, 40, 11, -3), ceja(62, 40, 11, -3),
    ojoOvalado(38, 50, '#3A2317', { pestanas: true }), ojoOvalado(62, 50, '#3A2317', { pestanas: true }),
    mejillas(30, 70, 58, 5),
    '<ellipse cx="50" cy="92" rx="13" ry="16" fill="#D9B98A" stroke="' + T + '" stroke-width="3.3"/>',
    '<ellipse cx="50" cy="94" rx="4" ry="5" fill="#2B1633"/>',
    fosas(50, 86, 4),
    '<path d="M38 76 Q50 72 62 76" stroke="' + T + '" stroke-width="2" fill="none" opacity=".5"/>'
  ]) },
  'chinchilla': { nombre: 'Chinchilla', grupo: 'chile', svg: marco('chinchilla', '#8E8378', [
    '<circle cx="50" cy="58" r="42" fill="#8E8378"/>',
    sombraBorde('#55504A'), luzFrente(50, 68, 16, 13),
    '<circle cx="18" cy="26" r="16" fill="#D8CFC3" stroke="' + T + '" stroke-width="3.5"/>', '<circle cx="82" cy="26" r="16" fill="#D8CFC3" stroke="' + T + '" stroke-width="3.5"/>',
    '<circle cx="18" cy="28" r="7" fill="#A89E8F"/>', '<circle cx="82" cy="28" r="7" fill="#A89E8F"/>',
    ceja(36, 42, 14, -3), ceja(64, 42, 14, -3),
    ojo(36, 54, 9, '#3A2317', { parpado: true }), ojo(64, 54, 9, '#3A2317', { parpado: true }),
    mejillas(28, 72, 64, 7),
    '<ellipse cx="50" cy="74" rx="7" ry="5.5" fill="#D8CFC3" stroke="' + T + '" stroke-width="2.4"/>',
    fosas(50, 72, 2.6),
    bigotePuntos(40, 74, 'izq'), bigotePuntos(60, 74, 'der'),
    '<path d="M26 70 Q22 72 26 76" stroke="' + T + '" stroke-width="1.3" fill="none" opacity=".3"/>',
    '<path d="M74 70 Q78 72 74 76" stroke="' + T + '" stroke-width="1.3" fill="none" opacity=".3"/>'
  ]) },
  'chingue': { nombre: 'Chingue', grupo: 'chile', svg: marco('chingue', '#2B1633', [
    '<ellipse cx="50" cy="60" rx="38" ry="36" fill="' + T + '"/>',
    '<path d="M50 14 Q58 50 54 92 Q50 94 46 92 Q42 50 50 14 Z" fill="#FFF6EA"/>',
    sombraBorde('#000000'),
    '<ellipse cx="24" cy="30" rx="7" ry="9" fill="' + T + '" stroke="#000" stroke-width="2.6"/>', '<ellipse cx="76" cy="30" rx="7" ry="9" fill="' + T + '" stroke="#000" stroke-width="2.6"/>',
    ceja(37, 46, 12, -3), ceja(63, 46, 12, -3),
    ojo(37, 56, 7.5, '#3A2317', { parpado: true }), ojo(63, 56, 7.5, '#3A2317', { parpado: true }),
    '<ellipse cx="50" cy="74" rx="6" ry="4.6" fill="#3A2317"/>',
    fosas(50, 72, 2.2),
    bigotePuntos(42, 74, 'izq'), bigotePuntos(58, 74, 'der')
  ]) },
  'quique': { nombre: 'Quique', grupo: 'chile', svg: marco('quique', '#B8862E', [
    '<ellipse cx="50" cy="66" rx="40" ry="28" fill="#B8862E"/>',
    sombraBorde('#704E14'), luzFrente(66, 60, 12, 10),
    '<circle cx="24" cy="38" r="7" fill="#8E6420" stroke="' + T + '" stroke-width="2.6"/>', '<circle cx="76" cy="38" r="7" fill="#8E6420" stroke="' + T + '" stroke-width="2.6"/>',
    ceja(42, 48, 9, -3), ceja(70, 48, 9, -3),
    ojo(42, 54, 6.5, '#2B1633', { parpado: true }), ojo(70, 54, 6.5, '#2B1633', { parpado: true }),
    '<path d="M30 60 Q18 68 22 80 Q30 76 36 70 Z" fill="#B8862E" stroke="' + T + '" stroke-width="2.8" stroke-linejoin="round"/>',
    '<ellipse cx="20" cy="74" rx="3.4" ry="2.6" fill="' + T + '"/>',
    fosas(20, 72, 1.8),
    bigotePuntos(28, 72, 'izq')
  ]) },
  'chungungo': { nombre: 'Chungungo', grupo: 'chile', svg: marco('chungungo', '#6E5536', [
    '<circle cx="50" cy="58" r="42" fill="#6E5536"/>',
    sombraBorde('#3A2A18'), luzFrente(50, 70, 17, 14),
    '<circle cx="24" cy="34" r="8" fill="#5A4428" stroke="' + T + '" stroke-width="3"/>', '<circle cx="76" cy="34" r="8" fill="#5A4428" stroke="' + T + '" stroke-width="3"/>',
    ceja(36, 46, 14, -3), ceja(64, 46, 14, -3),
    ojo(36, 56, 9, '#2B1633', { parpado: true }), ojo(64, 56, 9, '#2B1633', { parpado: true }),
    mejillas(28, 72, 66, 7),
    '<ellipse cx="50" cy="76" rx="12" ry="8" fill="#D9CBB3" stroke="' + T + '" stroke-width="2.6"/>',
    fosas(50, 73, 3.4),
    bigotePuntos(42, 76, 'izq'), bigotePuntos(58, 76, 'der')
  ]) },
  'monito-del-monte': { nombre: 'Monito del monte', grupo: 'chile', svg: marco('monito', '#9C7E63', [
    '<circle cx="50" cy="60" r="38" fill="#9C7E63"/>',
    sombraBorde('#5A4530'), luzFrente(50, 70, 15, 12),
    '<circle cx="18" cy="30" r="17" fill="#C9A98C" stroke="' + T + '" stroke-width="3.5"/>', '<circle cx="82" cy="30" r="17" fill="#C9A98C" stroke="' + T + '" stroke-width="3.5"/>',
    '<circle cx="18" cy="32" r="8" fill="#F0DFC9"/>', '<circle cx="82" cy="32" r="8" fill="#F0DFC9"/>',
    mejillas(26, 74, 62, 6),
    ojo(36, 58, 11, '#3A2317', { parpado: true }), ojo(64, 58, 11, '#3A2317', { parpado: true }),
    '<ellipse cx="50" cy="76" rx="5" ry="4" fill="' + T + '"/>',
    fosas(50, 74, 2)
  ]) },
  'lobo-marino': { nombre: 'Lobo marino', grupo: 'chile', svg: marco('lobo', '#8C6A4A', [
    '<ellipse cx="50" cy="62" rx="42" ry="38" fill="#8C6A4A"/>',
    sombraBorde('#4E3A28'), luzFrente(50, 42, 16, 12),
    ceja(36, 38, 13, -3), ceja(64, 38, 13, -3),
    ojo(36, 48, 9, '#2B1633', { parpado: true }), ojo(64, 48, 9, '#2B1633', { parpado: true }),
    mejillas(26, 74, 62, 8),
    '<ellipse cx="50" cy="76" rx="18" ry="13" fill="#A98A63" stroke="' + T + '" stroke-width="3"/>',
    '<ellipse cx="50" cy="76" rx="6" ry="5" fill="#2B1633"/>',
    fosas(50, 72, 4),
    bigotePuntos(36, 78, 'izq'), bigotePuntos(64, 78, 'der')
  ]) },
  'armadillo': { nombre: 'Peludo (armadillo)', grupo: 'chile', svg: marco('armadillo', '#B9AA92', [
    '<ellipse cx="50" cy="64" rx="34" ry="30" fill="#B9AA92"/>',
    sombraBorde('#7A6B52'),
    '<path d="M20 50 Q50 34 80 50" stroke="' + T + '" stroke-width="2.4" fill="none" opacity=".5"/>',
    '<path d="M18 60 Q50 46 82 60" stroke="' + T + '" stroke-width="2.4" fill="none" opacity=".5"/>',
    '<path d="M22 70 Q50 58 78 70" stroke="' + T + '" stroke-width="2.2" fill="none" opacity=".4"/>',
    ceja(38, 54, 10, -2), ceja(62, 54, 10, -2),
    ojo(38, 62, 6, '#2B1633', { parpado: true }), ojo(62, 62, 6, '#2B1633', { parpado: true }),
    '<path d="M38 76 Q50 92 62 76 Q50 84 38 76 Z" fill="#B9AA92" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<ellipse cx="50" cy="86" rx="4" ry="3" fill="' + T + '"/>',
    fosas(50, 84, 2.2),
    '<circle cx="18" cy="48" r="6" fill="#B9AA92" stroke="' + T + '" stroke-width="2.4"/>', '<circle cx="82" cy="48" r="6" fill="#B9AA92" stroke="' + T + '" stroke-width="2.4"/>'
  ]) },
  'pato': { nombre: 'Pato jergón', grupo: 'chile', svg: marco('pato', '#5B5750', [
    '<circle cx="50" cy="56" r="42" fill="#5B5750"/>',
    sombraBorde('#2B1633'), luzFrente(50, 42, 16, 12),
    ceja(38, 38, 11, -2), ceja(62, 38, 11, -2),
    ojo(38, 46, 8, '#2B1633', { parpado: true }), ojo(62, 46, 8, '#2B1633', { parpado: true }),
    '<path d="M30 58 Q50 76 70 58 Q50 70 30 58 Z" fill="#FFB302" stroke="' + T + '" stroke-width="2.6" stroke-linejoin="round"/>',
    '<path d="M38 64 Q50 68 62 64" stroke="' + T + '" stroke-width="1.6" fill="none" opacity=".5"/>',
    '<ellipse cx="44" cy="60" rx="1.4" ry="1" fill="' + T + '" opacity=".6"/>'
  ]) },
  'pollito': { nombre: 'Pollito', grupo: 'chile', svg: marco('pollito', '#FFD24C', [
    '<circle cx="50" cy="58" r="42" fill="#FFD24C"/>',
    sombraBorde('#C98A00'), luzFrente(50, 68, 16, 13),
    '<path d="M44 16 Q50 6 56 16" stroke="#FFB302" stroke-width="5" fill="none" stroke-linecap="round"/>',
    ceja(37, 44, 9, -2), ceja(63, 44, 9, -2),
    ojo(37, 52, 8.5, '#2B1633', { parpado: true }), ojo(63, 52, 8.5, '#2B1633', { parpado: true }),
    mejillas(28, 72, 62, 6),
    '<polygon points="43,66 57,66 50,76" fill="#FFB302" stroke="' + T + '" stroke-width="2" stroke-linejoin="round"/>'
  ]) },
  'pinguino': { nombre: 'Pingüino de Humboldt', grupo: 'chile', svg: marco('pinguino', '#2B1633', [
    '<path d="M50 14 Q74 20 74 50 Q74 86 50 90 Q26 86 26 50 Q26 20 50 14 Z" fill="' + T + '"/>',
    '<path d="M50 30 Q64 34 64 54 Q64 78 50 82 Q36 78 36 54 Q36 34 50 30 Z" fill="#fff"/>',
    '<ellipse cx="38" cy="42" rx="7" ry="10" fill="#F2A6A0" opacity=".55"/>', '<ellipse cx="62" cy="42" rx="7" ry="10" fill="#F2A6A0" opacity=".55"/>',
    ojo(40, 40, 6.5, '#2B1633', { parpado: true }), ojo(60, 40, 6.5, '#2B1633', { parpado: true }),
    '<polygon points="50,40 56,46 50,50 44,46" fill="#FFB302" stroke="#C98A00" stroke-width="1.2" stroke-linejoin="round"/>',
    '<path d="M26 54 Q16 58 20 70" stroke="' + T + '" stroke-width="9" fill="none" stroke-linecap="round"/>',
    '<path d="M74 54 Q84 58 80 70" stroke="' + T + '" stroke-width="9" fill="none" stroke-linecap="round"/>'
  ]) },
  'condor': { nombre: 'Cóndor', grupo: 'chile', svg: marco('condor', '#2B1633', [
    '<circle cx="50" cy="60" r="42" fill="' + T + '"/>',
    '<path d="M14 66 Q50 92 86 66 Q50 82 14 66 Z" fill="#fff"/>',
    '<path d="M50 40 Q30 44 30 58 Q30 68 50 70 Q70 68 70 58 Q70 44 50 40 Z" fill="#C9A98C"/>',
    ceja(40, 50, 9, -2), ceja(60, 50, 9, -2),
    ojo(40, 56, 7, '#F0591B', { parpado: true }), ojo(60, 56, 7, '#F0591B', { parpado: true }),
    '<polygon points="42,66 58,66 50,78" fill="#5B5750" stroke="#C9A98C" stroke-width="1.6" stroke-linejoin="round"/>',
    '<path d="M20 36 Q10 30 8 18 M80 36 Q90 30 92 18" stroke="' + T + '" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>'
  ]) },
  'choroy': { nombre: 'Choroy', grupo: 'chile', svg: marco('choroy', '#0FA36D', [
    '<circle cx="50" cy="60" r="42" fill="#0FA36D"/>',
    sombraBorde('#0A6E4B'),
    '<path d="M32 26 Q50 16 68 26 Q66 38 50 38 Q34 38 32 26 Z" fill="#F0591B"/>',
    '<circle cx="18" cy="28" r="7" fill="#0C8259" stroke="' + T + '" stroke-width="2.6"/>', '<circle cx="82" cy="28" r="7" fill="#0C8259" stroke="' + T + '" stroke-width="2.6"/>',
    ojo(37, 50, 8, '#2B1633', { parpado: true }), ojo(63, 50, 8, '#2B1633', { parpado: true }),
    '<path d="M50 56 Q66 54 68 66 Q58 72 50 62 Z" fill="#FFB302" stroke="' + T + '" stroke-width="2.4" stroke-linejoin="round"/>',
    luzFrente(50, 74, 14, 10)
  ]) },

  // ---------------------------- animales conocidos (18) ----------------------------
  'perro': { nombre: 'Perro', grupo: 'conocido', svg: marco('perro', '#E3C08A', [
    '<ellipse cx="50" cy="62" rx="38" ry="36" fill="#E3C08A"/>',
    sombraBorde('#9E7A47'), luzFrente(50, 70, 16, 13),
    '<path d="M18 30 Q10 55 22 70 Q26 50 30 36 Z" fill="#C79A5C" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M82 30 Q90 55 78 70 Q74 50 70 36 Z" fill="#C79A5C" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    ceja(37, 44, 13, -3), ceja(63, 44, 13, -3),
    ojo(37, 56, 8, '#3A2317', { parpado: true }), ojo(63, 56, 8, '#3A2317', { parpado: true }),
    mejillas(28, 72, 66, 7),
    '<ellipse cx="50" cy="78" rx="12" ry="9" fill="#fff" stroke="' + T + '" stroke-width="2.6"/>',
    '<ellipse cx="50" cy="74" rx="5" ry="4" fill="' + T + '"/>',
    fosas(50, 72, 2.6),
    '<path d="M50 78 L50 84 M50 84 Q44 88 40 86 M50 84 Q56 88 60 86" stroke="' + T + '" stroke-width="2" fill="none" stroke-linecap="round"/>'
  ]) },
  'conejo': { nombre: 'Conejo', grupo: 'conocido', svg: marco('conejo', '#EFE6D8', [
    '<ellipse cx="50" cy="64" rx="34" ry="32" fill="#EFE6D8"/>',
    sombraBorde('#C9BCA4'), luzFrente(50, 72, 14, 12),
    '<path d="M32 30 Q28 -10 38 -12 Q42 20 44 34 Z" fill="#EFE6D8" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M68 30 Q72 -10 62 -12 Q58 20 56 34 Z" fill="#EFE6D8" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M35 10 Q38 -4 38 10" stroke="#F0B6C2" stroke-width="4" fill="none" opacity=".7"/>', '<path d="M65 10 Q62 -4 62 10" stroke="#F0B6C2" stroke-width="4" fill="none" opacity=".7"/>',
    ceja(39, 46, 10, -2), ceja(61, 46, 10, -2),
    ojo(38, 58, 8, '#8A5A2B', { parpado: true }), ojo(62, 58, 8, '#8A5A2B', { parpado: true }),
    mejillas(28, 72, 66, 7),
    '<ellipse cx="50" cy="76" rx="5.5" ry="4" fill="#F0B6C2" stroke="' + T + '" stroke-width="2.2"/>',
    '<rect x="45" y="82" width="4" height="7" rx="1" fill="#fff" stroke="' + T + '" stroke-width="1"/>', '<rect x="51" y="82" width="4" height="7" rx="1" fill="#fff" stroke="' + T + '" stroke-width="1"/>',
    bigotePuntos(42, 76, 'izq'), bigotePuntos(58, 76, 'der')
  ]) },
  'oveja': { nombre: 'Oveja', grupo: 'conocido', svg: marco('oveja', '#F2EEE6', [
    '<circle cx="50" cy="58" r="42" fill="#F2EEE6"/>',
    '<path d="M14 40 Q10 50 16 58" stroke="' + T + '" stroke-width="1.4" fill="none" opacity=".35"/>', '<path d="M18 28 Q12 34 16 42" stroke="' + T + '" stroke-width="1.4" fill="none" opacity=".35"/>',
    '<path d="M86 40 Q90 50 84 58" stroke="' + T + '" stroke-width="1.4" fill="none" opacity=".35"/>', '<path d="M82 28 Q88 34 84 42" stroke="' + T + '" stroke-width="1.4" fill="none" opacity=".35"/>',
    '<path d="M30 14 Q24 20 28 28" stroke="' + T + '" stroke-width="1.4" fill="none" opacity=".35"/>', '<path d="M70 14 Q76 20 72 28" stroke="' + T + '" stroke-width="1.4" fill="none" opacity=".35"/>',
    sombraBorde('#BBAE8E'),
    '<ellipse cx="50" cy="66" rx="24" ry="22" fill="#E7D9BE" stroke="' + T + '" stroke-width="3.3"/>',
    luzFrente(50, 60, 10, 8),
    ceja(39, 54, 9, -2), ceja(61, 54, 9, -2),
    ojoOvalado(39, 60, '#3A2317', { pestanas: true }), ojoOvalado(61, 60, '#3A2317', { pestanas: true }),
    mejillas(30, 70, 70, 6),
    '<ellipse cx="50" cy="78" rx="6" ry="4.5" fill="#D8A86A" stroke="' + T + '" stroke-width="2.2"/>',
    fosas(50, 76, 2.2)
  ]) },
  'vaca': { nombre: 'Vaca', grupo: 'conocido', svg: marco('vaca', '#F5EDE3', [
    '<ellipse cx="50" cy="62" rx="40" ry="36" fill="#F5EDE3"/>',
    sombraBorde('#B9A98A'),
    '<ellipse cx="28" cy="40" rx="10" ry="8" fill="' + T + '" opacity=".85"/>', '<ellipse cx="68" cy="50" rx="7" ry="6" fill="' + T + '" opacity=".85"/>',
    '<ellipse cx="22" cy="28" rx="9" ry="7" fill="#F5EDE3" stroke="' + T + '" stroke-width="3"/>', '<ellipse cx="78" cy="28" rx="9" ry="7" fill="#F5EDE3" stroke="' + T + '" stroke-width="3"/>',
    '<path d="M34 16 Q30 4 36 2 M66 16 Q70 4 64 2" stroke="' + T + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    '<path d="M36 6 Q33 4 35 2 M64 6 Q67 4 65 2" stroke="#D9C4AE" stroke-width="1.4" fill="none" opacity=".7"/>',
    ceja(37, 48, 12, -3), ceja(63, 48, 12, -3),
    ojoOvalado(37, 54, '#3A2317', { pestanas: true }), ojoOvalado(63, 54, '#3A2317', { pestanas: true }),
    luzFrente(50, 66, 12, 10),
    '<ellipse cx="50" cy="82" rx="17" ry="12" fill="#F0B6C2" stroke="' + T + '" stroke-width="2.8"/>',
    '<ellipse cx="43" cy="82" rx="2.6" ry="3.4" fill="' + T + '"/>', '<ellipse cx="57" cy="82" rx="2.6" ry="3.4" fill="' + T + '"/>'
  ]) },
  'caballo': { nombre: 'Caballo', grupo: 'conocido', svg: marco('caballo', '#8A5A2B', [
    '<ellipse cx="50" cy="70" rx="24" ry="40" fill="#8A5A2B"/>',
    sombraBorde('#4A2E12'), luzFrente(50, 54, 10, 22),
    '<path d="M30 20 Q50 10 70 20 Q66 6 50 4 Q34 6 30 20 Z" fill="#3A2317" stroke="' + T + '" stroke-width="2.6" stroke-linejoin="round"/>',
    '<path d="M34 10 Q38 6 42 10 M58 10 Q62 6 66 10" stroke="#5B3A20" stroke-width="1.6" fill="none" opacity=".6"/>',
    '<ellipse cx="26" cy="38" rx="7" ry="9" fill="#8A5A2B" stroke="' + T + '" stroke-width="2.8"/>', '<ellipse cx="74" cy="38" rx="7" ry="9" fill="#8A5A2B" stroke="' + T + '" stroke-width="2.8"/>',
    ceja(38, 46, 10, -2), ceja(62, 46, 10, -2),
    ojoOvalado(38, 52, '#2B1633', { pestanas: true }), ojoOvalado(62, 52, '#2B1633', { pestanas: true }),
    '<path d="M46 76 Q50 84 54 76" stroke="' + T + '" stroke-width="2" fill="none" opacity=".5"/>',
    fosas(42, 90, 4), fosas(58, 90, 0),
    '<ellipse cx="50" cy="98" rx="14" ry="10" fill="#6B4A1F" stroke="' + T + '" stroke-width="2.6"/>'
  ]) },
  'chancho': { nombre: 'Chancho', grupo: 'conocido', svg: marco('chancho', '#F2B9C4', [
    '<circle cx="50" cy="58" r="42" fill="#F2B9C4"/>',
    sombraBorde('#C77D91'), luzFrente(50, 42, 16, 12),
    '<ellipse cx="22" cy="36" rx="9" ry="10" fill="#F2B9C4" stroke="' + T + '" stroke-width="3"/>', '<ellipse cx="78" cy="36" rx="9" ry="10" fill="#F2B9C4" stroke="' + T + '" stroke-width="3"/>',
    ceja(38, 42, 11, -2), ceja(62, 42, 11, -2),
    ojo(38, 48, 8, '#2B1633', { parpado: true }), ojo(62, 48, 8, '#2B1633', { parpado: true }),
    mejillas(26, 74, 58, 7),
    '<ellipse cx="50" cy="76" rx="14" ry="10" fill="#E897A8" stroke="' + T + '" stroke-width="2.8"/>',
    '<ellipse cx="44" cy="76" rx="2.6" ry="3.4" fill="' + T + '"/>', '<ellipse cx="56" cy="76" rx="2.6" ry="3.4" fill="' + T + '"/>'
  ]) },
  'raton': { nombre: 'Ratón', grupo: 'conocido', svg: marco('raton', '#C8BFB4', [
    '<ellipse cx="50" cy="64" rx="30" ry="28" fill="#C8BFB4"/>',
    sombraBorde('#8A7F70'), luzFrente(50, 72, 12, 10),
    '<circle cx="20" cy="26" r="14" fill="#DCD5CA" stroke="' + T + '" stroke-width="3"/>', '<circle cx="80" cy="26" r="14" fill="#DCD5CA" stroke="' + T + '" stroke-width="3"/>',
    '<circle cx="20" cy="28" r="6" fill="#F0B6C2"/>', '<circle cx="80" cy="28" r="6" fill="#F0B6C2"/>',
    ceja(38, 52, 9, -2), ceja(62, 52, 9, -2),
    ojo(38, 60, 7, '#2B1633', { parpado: true }), ojo(62, 60, 7, '#2B1633', { parpado: true }),
    '<ellipse cx="50" cy="78" rx="5" ry="4" fill="#F0B6C2" stroke="' + T + '" stroke-width="2.2"/>',
    fosas(50, 76, 1.8),
    bigotePuntos(42, 78, 'izq'), bigotePuntos(58, 78, 'der')
  ]) },
  'oso': { nombre: 'Oso', grupo: 'conocido', svg: marco('oso', '#6B4A33', [
    '<circle cx="50" cy="60" r="42" fill="#6B4A33"/>',
    sombraBorde('#3A271A'), luzFrente(50, 70, 16, 13),
    '<circle cx="20" cy="22" r="11" fill="#6B4A33" stroke="' + T + '" stroke-width="3.3"/>', '<circle cx="80" cy="22" r="11" fill="#6B4A33" stroke="' + T + '" stroke-width="3.3"/>',
    '<circle cx="20" cy="24" r="4.5" fill="#4A3221"/>', '<circle cx="80" cy="24" r="4.5" fill="#4A3221"/>',
    ceja(37, 44, 13, -3), ceja(63, 44, 13, -3),
    ojo(37, 54, 8, '#2B1633', { parpado: true }), ojo(63, 54, 8, '#2B1633', { parpado: true }),
    mejillas(28, 72, 64, 7),
    '<ellipse cx="50" cy="78" rx="16" ry="12" fill="#8C6A4A" stroke="' + T + '" stroke-width="3"/>',
    '<ellipse cx="50" cy="74" rx="5" ry="4" fill="' + T + '"/>',
    fosas(50, 72, 2.6)
  ]) },
  'mono': { nombre: 'Mono', grupo: 'conocido', svg: marco('mono', '#8A5A2B', [
    '<circle cx="50" cy="60" r="42" fill="#8A5A2B"/>',
    sombraBorde('#4A3015'),
    '<circle cx="16" cy="54" r="13" fill="#8A5A2B" stroke="' + T + '" stroke-width="3.3"/>', '<circle cx="84" cy="54" r="13" fill="#8A5A2B" stroke="' + T + '" stroke-width="3.3"/>',
    '<circle cx="16" cy="54" r="7" fill="#C9A06B"/>', '<circle cx="84" cy="54" r="7" fill="#C9A06B"/>',
    '<ellipse cx="50" cy="62" rx="24" ry="22" fill="#C9A06B" stroke="' + T + '" stroke-width="3"/>',
    luzFrente(50, 48, 11, 8),
    ceja(39, 48, 9, -3), ceja(61, 48, 9, -3),
    ojo(39, 54, 7.5, '#2B1633', { parpado: true }), ojo(61, 54, 7.5, '#2B1633', { parpado: true }),
    '<ellipse cx="50" cy="74" rx="6" ry="4.5" fill="' + T + '"/>',
    fosas(50, 72, 2)
  ]) },
  'leon': { nombre: 'León', grupo: 'conocido', svg: marco('leon', '#E3A94C', [
    '<path d="M50 10 Q86 14 90 50 Q92 86 50 94 Q8 86 10 50 Q14 14 50 10 Z" fill="#B8762A"/>',
    '<path d="M50 10 Q82 14 86 48 M50 10 Q18 14 14 48" stroke="#9C611E" stroke-width="2" fill="none" opacity=".5"/>',
    '<circle cx="50" cy="56" r="34" fill="#E3A94C" stroke="' + T + '" stroke-width="3.3"/>',
    luzFrente(50, 64, 12, 9),
    ceja(38, 46, 11, -3), ceja(62, 46, 11, -3),
    ojo(38, 52, 8, '#2B1633', { parpado: true }), ojo(62, 52, 8, '#2B1633', { parpado: true }),
    mejillas(30, 70, 60, 6),
    '<ellipse cx="50" cy="70" rx="9" ry="7" fill="#C98A3A" stroke="' + T + '" stroke-width="2.4"/>',
    '<ellipse cx="50" cy="66" rx="3.6" ry="2.8" fill="' + T + '"/>',
    fosas(50, 64, 2.4),
    bigotePuntos(42, 70, 'izq'), bigotePuntos(58, 70, 'der')
  ]) },
  'buho': { nombre: 'Búho', grupo: 'conocido', svg: marco('buho', '#8C6A4A', [
    '<circle cx="50" cy="58" r="42" fill="#8C6A4A"/>',
    sombraBorde('#4E3A28'),
    '<path d="M18 50 Q50 38 82 50" stroke="' + T + '" stroke-width="2" fill="none" opacity=".35"/>',
    '<path d="M16 62 Q50 72 84 62" stroke="' + T + '" stroke-width="2" fill="none" opacity=".3"/>',
    '<polygon points="26,10 34,30 16,26" fill="#8C6A4A" stroke="' + T + '" stroke-width="2.8" stroke-linejoin="round"/>',
    '<polygon points="74,10 66,30 84,26" fill="#8C6A4A" stroke="' + T + '" stroke-width="2.8" stroke-linejoin="round"/>',
    '<circle cx="36" cy="52" r="15" fill="#fff" stroke="' + T + '" stroke-width="2.6"/>', '<circle cx="64" cy="52" r="15" fill="#fff" stroke="' + T + '" stroke-width="2.6"/>',
    '<circle cx="36" cy="52" r="8" fill="#FFB302"/>', '<circle cx="64" cy="52" r="8" fill="#FFB302"/>',
    '<circle cx="36" cy="52" r="4" fill="' + T + '"/>', '<circle cx="64" cy="52" r="4" fill="' + T + '"/>',
    '<circle cx="34" cy="49" r="1.4" fill="#fff"/>', '<circle cx="62" cy="49" r="1.4" fill="#fff"/>',
    '<polygon points="46,66 54,66 50,76" fill="#FFB302" stroke="' + T + '" stroke-width="1.6" stroke-linejoin="round"/>'
  ]) },
  'elefante': { nombre: 'Elefante', grupo: 'conocido', svg: marco('elefante', '#AEB3B8', [
    '<ellipse cx="50" cy="52" rx="38" ry="34" fill="#AEB3B8"/>',
    sombraBorde('#6E7378'), luzFrente(50, 44, 15, 12),
    '<path d="M16 46 Q14 54 20 60 M20 42 Q18 48 22 52 M80 46 Q86 54 80 60 M80 42 Q82 48 78 52" stroke="' + T + '" stroke-width="1.4" fill="none" opacity=".4"/>',
    '<ellipse cx="20" cy="42" rx="14" ry="20" fill="#AEB3B8" stroke="' + T + '" stroke-width="3"/>', '<ellipse cx="80" cy="42" rx="14" ry="20" fill="#AEB3B8" stroke="' + T + '" stroke-width="3"/>',
    ceja(38, 44, 10, -2), ceja(62, 44, 10, -2),
    ojo(38, 48, 7, '#2B1633', { parpado: true }), ojo(62, 48, 7, '#2B1633', { parpado: true }),
    '<path d="M44 60 Q40 86 48 96 Q54 98 52 90 Q48 78 50 62 Z" fill="#AEB3B8" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M45 68 Q48 70 45 72 M45 78 Q48 80 45 82" stroke="' + T + '" stroke-width="1.3" fill="none" opacity=".4"/>'
  ]) },
  'jirafa': { nombre: 'Jirafa', grupo: 'conocido', svg: marco('jirafa', '#EBCB7E', [
    '<ellipse cx="50" cy="66" rx="30" ry="30" fill="#EBCB7E"/>',
    sombraBorde('#B8964E'), luzFrente(50, 74, 12, 9),
    '<g fill="#B8762A" opacity=".85"><ellipse cx="34" cy="48" rx="6" ry="7"/><ellipse cx="62" cy="44" rx="5" ry="6"/><ellipse cx="50" cy="70" rx="7" ry="6"/><ellipse cx="70" cy="68" rx="5" ry="5"/></g>',
    '<path d="M38 24 L34 6 M38 24 Q34 10 30 8" stroke="' + T + '" stroke-width="3" fill="none" stroke-linecap="round"/>',
    '<circle cx="34" cy="6" r="4" fill="#EBCB7E" stroke="' + T + '" stroke-width="2.4"/>',
    '<path d="M58 24 L62 6 M58 24 Q62 10 66 8" stroke="' + T + '" stroke-width="3" fill="none" stroke-linecap="round"/>',
    '<circle cx="62" cy="6" r="4" fill="#EBCB7E" stroke="' + T + '" stroke-width="2.4"/>',
    ceja(40, 52, 9, -2), ceja(60, 52, 9, -2),
    ojoOvalado(40, 58, '#3A2317', { pestanas: true }), ojoOvalado(60, 58, '#3A2317', { pestanas: true }),
    '<path d="M36 50 Q32 46 36 42 M64 50 Q68 46 64 42" stroke="' + T + '" stroke-width="2" fill="none" opacity=".6"/>'
  ]) },
  'cabra': { nombre: 'Cabra', grupo: 'conocido', svg: marco('cabra', '#F0EAE0', [
    '<ellipse cx="50" cy="62" rx="32" ry="32" fill="#F0EAE0"/>',
    sombraBorde('#B9AC94'), luzFrente(50, 68, 13, 10),
    '<path d="M36 30 Q26 10 34 2 Q38 18 42 30 Z" fill="#E3DCCB" stroke="' + T + '" stroke-width="2.8" stroke-linejoin="round"/>',
    '<path d="M64 30 Q74 10 66 2 Q62 18 58 30 Z" fill="#E3DCCB" stroke="' + T + '" stroke-width="2.8" stroke-linejoin="round"/>',
    '<path d="M35 10 L39 12 M33 18 L38 19 M65 10 L61 12 M67 18 L62 19" stroke="#B9AC94" stroke-width="1.4" stroke-linecap="round"/>',
    '<ellipse cx="22" cy="46" rx="6" ry="10" fill="#F0EAE0" stroke="' + T + '" stroke-width="2.6"/>', '<ellipse cx="78" cy="46" rx="6" ry="10" fill="#F0EAE0" stroke="' + T + '" stroke-width="2.6"/>',
    ceja(39, 50, 9, -2), ceja(61, 50, 9, -2),
    '<ellipse cx="39" cy="58" rx="7" ry="5.5" fill="#fff" stroke="' + T + '" stroke-width="2.2"/>', '<ellipse cx="61" cy="58" rx="7" ry="5.5" fill="#fff" stroke="' + T + '" stroke-width="2.2"/>',
    '<rect x="37" y="55" width="4" height="7" fill="' + T + '"/>', '<rect x="59" y="55" width="4" height="7" fill="' + T + '"/>',
    '<path d="M46 80 Q50 90 54 80" fill="#E3DCCB" stroke="' + T + '" stroke-width="2.4" stroke-linejoin="round"/>',
    '<ellipse cx="50" cy="74" rx="5" ry="3.6" fill="#D8A86A" stroke="' + T + '" stroke-width="2"/>'
  ]) },
  'rana': { nombre: 'Rana', grupo: 'conocido', svg: marco('rana', '#4FAE6E', [
    '<ellipse cx="50" cy="66" rx="40" ry="32" fill="#4FAE6E"/>',
    sombraBorde('#226B40'), luzFrente(50, 74, 14, 10),
    '<circle cx="28" cy="30" r="13" fill="#4FAE6E" stroke="' + T + '" stroke-width="3.3"/>', '<circle cx="72" cy="30" r="13" fill="#4FAE6E" stroke="' + T + '" stroke-width="3.3"/>',
    '<circle cx="28" cy="30" r="6" fill="#fff" stroke="' + T + '" stroke-width="2"/>', '<circle cx="72" cy="30" r="6" fill="#fff" stroke="' + T + '" stroke-width="2"/>',
    '<circle cx="29" cy="31" r="2.6" fill="' + T + '"/>', '<circle cx="73" cy="31" r="2.6" fill="' + T + '"/>',
    '<circle cx="26" cy="28" r="1.3" fill="#fff"/>', '<circle cx="70" cy="28" r="1.3" fill="#fff"/>',
    '<path d="M28 70 Q50 86 72 70" stroke="' + T + '" stroke-width="3" fill="none" stroke-linecap="round"/>',
    '<path d="M18 80 Q10 74 14 66 M82 80 Q90 74 86 66" stroke="#4FAE6E" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>'
  ]) },
  'koala': { nombre: 'Koala', grupo: 'conocido', svg: marco('koala', '#9FA6A3', [
    '<ellipse cx="50" cy="62" rx="36" ry="32" fill="#9FA6A3"/>',
    sombraBorde('#5B6360'), luzFrente(50, 70, 15, 12),
    '<ellipse cx="14" cy="42" rx="14" ry="18" fill="#9FA6A3" stroke="' + T + '" stroke-width="3.3"/>', '<ellipse cx="86" cy="42" rx="14" ry="18" fill="#9FA6A3" stroke="' + T + '" stroke-width="3.3"/>',
    '<ellipse cx="14" cy="42" rx="7" ry="10" fill="#C7CBC8"/>', '<ellipse cx="86" cy="42" rx="7" ry="10" fill="#C7CBC8"/>',
    ceja(39, 48, 10, -2), ceja(61, 48, 10, -2),
    ojo(39, 54, 7, '#2B1633', { parpado: true }), ojo(61, 54, 7, '#2B1633', { parpado: true }),
    '<ellipse cx="50" cy="72" rx="9" ry="7" fill="' + T + '"/>',
    fosas(50, 68, 3)
  ]) },
  'panda': { nombre: 'Panda', grupo: 'conocido', svg: marco('panda', '#FFFFFF', [
    '<circle cx="50" cy="58" r="42" fill="#fff" stroke="' + T + '" stroke-width="4"/>',
    sombraBorde('#BFBFBF'), luzFrente(50, 70, 14, 11),
    '<circle cx="20" cy="26" r="12" fill="' + T + '"/>', '<circle cx="80" cy="26" r="12" fill="' + T + '"/>',
    '<ellipse cx="37" cy="54" rx="11" ry="14" fill="' + T + '"/>', '<ellipse cx="63" cy="54" rx="11" ry="14" fill="' + T + '"/>',
    '<circle cx="39" cy="54" r="5.5" fill="#fff"/>', '<circle cx="61" cy="54" r="5.5" fill="#fff"/>',
    '<circle cx="40" cy="55" r="2.6" fill="' + T + '"/>', '<circle cx="62" cy="55" r="2.6" fill="' + T + '"/>',
    '<circle cx="38" cy="52" r="1.1" fill="#fff"/>', '<circle cx="60" cy="52" r="1.1" fill="#fff"/>',
    mejillas(30, 70, 66, 6),
    '<ellipse cx="50" cy="76" rx="6" ry="4.5" fill="' + T + '"/>',
    fosas(50, 74, 2.2)
  ]) },
  'tortuga': { nombre: 'Tortuga', grupo: 'conocido', svg: marco('tortuga', '#8CA86A', [
    '<circle cx="50" cy="60" r="42" fill="#8CA86A"/>',
    sombraBorde('#4E6734'),
    '<path d="M24 60 Q16 54 24 44 Q34 40 50 42 Q66 40 76 44 Q84 54 76 60 Q66 66 50 66 Q34 66 24 60 Z" fill="#6E8A4E" stroke="' + T + '" stroke-width="3" stroke-linejoin="round"/>',
    '<path d="M50 42 L50 66 M34 44 L40 64 M66 44 L60 64" stroke="' + T + '" stroke-width="1.6" fill="none" opacity=".5"/>',
    ojo(38, 56, 6.5, '#2B1633', { parpado: true }), ojo(62, 56, 6.5, '#2B1633', { parpado: true }),
    '<path d="M38 72 Q50 82 62 72" stroke="' + T + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
  ]) }
};

/** Mismo orden que cloudflare/iconos.mjs (CLAVES_ICONOS). */
export const CLAVES_ICONOS = Object.keys(ICONOS);

/** SVG (texto) del icono, o null si la clave no esta en el catalogo. */
export function iconoSVG(clave) {
  const entrada = ICONOS[clave];
  return entrada ? entrada.svg : null;
}
