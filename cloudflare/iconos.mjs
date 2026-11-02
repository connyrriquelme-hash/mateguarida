/**
 * iconos.mjs
 * Catalogo cerrado de 36 iconos de estudiante (forma + nombre, sin fotos):
 * 18 fauna chilena + 18 animales conocidos. El dibujo (SVG) de cada uno
 * vive en public/entrada/iconos.js -- este archivo no lo necesita, solo
 * sabe que CLAVES existen (para validar y asignar), en el MISMO ORDEN que
 * ese archivo. Si se agrega o quita un icono, hay que actualizar los dos.
 */

export const CLAVES_ICONOS = [
  // fauna chilena (18)
  'pudu', 'huemul', 'puma', 'guina', 'zorro-culpeo', 'guanaco', 'chinchilla', 'chingue', 'quique',
  'chungungo', 'monito-del-monte', 'lobo-marino', 'armadillo', 'pato', 'pollito', 'pinguino', 'condor', 'choroy',
  // animales conocidos (18)
  'perro', 'conejo', 'oveja', 'vaca', 'caballo', 'chancho', 'raton', 'oso', 'mono',
  'leon', 'buho', 'elefante', 'jirafa', 'cabra', 'rana', 'koala', 'panda', 'tortuga'
];

export function existeIcono(clave) {
  return CLAVES_ICONOS.includes(clave);
}

/**
 * El primer icono del catalogo que ningun estudiante ACTIVO de este curso
 * tenga ya asignado. `usadosExtra` son claves reservadas en el mismo lote
 * (ej. al pegar varios nombres de una vez, antes de que queden guardados en
 * la base) para no repetir dentro del mismo pegado. null si los 36 estan
 * usados (no deberia pasar en un curso real).
 */
export async function asignarIconoAutomatico(env, cursoId, usadosExtra) {
  const { results } = await env.DB.prepare(
    "SELECT icono FROM estudiante WHERE curso_id = ?1 AND activo = 1 AND icono IS NOT NULL"
  ).bind(cursoId).all();
  const usados = new Set((results || []).map((r) => r.icono));
  if (usadosExtra) for (const c of usadosExtra) usados.add(c);
  return CLAVES_ICONOS.find((c) => !usados.has(c)) || null;
}
