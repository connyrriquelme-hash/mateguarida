/**
 * api.js (panel)
 * Cliente de la API docente. No maneja su propio login: Cloudflare Access ya
 * autentico la peticion antes de que llegue aqui (si no, el Worker responde
 * 401 y esta pantalla lo muestra como cualquier otro error).
 */

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

async function llamar(ruta, { metodo = 'GET', cuerpo } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    });
  } catch {
    throw new ErrorApi('Sin conexión', 0);
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new ErrorApi(datos.error || 'No fue posible completar la acción', respuesta.status);
  return datos;
}

export const api = {
  listarCursos: () => llamar('/api/docente/cursos'),
  crearCurso: (curso) => llamar('/api/docente/cursos', { metodo: 'POST', cuerpo: curso }),
  obtenerCurso: (id) => llamar(`/api/docente/cursos/${encodeURIComponent(id)}`),
  actualizarCurso: (id, cambios) => llamar(`/api/docente/cursos/${encodeURIComponent(id)}`, { metodo: 'PATCH', cuerpo: cambios }),
  eliminarCurso: (id) => llamar(`/api/docente/cursos/${encodeURIComponent(id)}`, { metodo: 'DELETE' }),
  regenerarCodigo: (id) => llamar(`/api/docente/cursos/${encodeURIComponent(id)}/regenerar-codigo`, { metodo: 'POST' }),

  agregarEstudiantes: (cursoId, datos) =>
    llamar(`/api/docente/cursos/${encodeURIComponent(cursoId)}/estudiantes`, { metodo: 'POST', cuerpo: datos }),
  actualizarEstudiante: (id, cambios) => llamar(`/api/docente/estudiantes/${encodeURIComponent(id)}`, { metodo: 'PATCH', cuerpo: cambios }),
  eliminarEstudiante: (id) => llamar(`/api/docente/estudiantes/${encodeURIComponent(id)}`, { metodo: 'DELETE' }),

  obtenerAvance: (cursoId) => llamar(`/api/docente/cursos/${encodeURIComponent(cursoId)}/avance`)
};
