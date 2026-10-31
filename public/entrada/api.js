/**
 * api.js
 * Cliente de la API para la entrada del estudiante.
 *
 * Codigo de curso: se pide una vez por dispositivo y queda en localStorage.
 * No se guarda nada mas del estudiante en el dispositivo: ni su nombre, ni su
 * id, ni el navegador, ni la resolucion de pantalla. (Mismo principio que
 * Lectoguarida.)
 */

export const CLAVE_CODIGO = 'mg_codigo_curso';
export const CLAVE_TOKEN = 'mg_token_estudiante';

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

/** localStorage puede lanzar (modo privado, sitio bloqueado): siempre con try. */
export function almacenDelNavegador() {
  return {
    get(clave) {
      try { return window.localStorage.getItem(clave) || ''; } catch { return ''; }
    },
    set(clave, valor) {
      try { window.localStorage.setItem(clave, valor); } catch { /* almacenamiento bloqueado */ }
    },
    quitar(clave) {
      try { window.localStorage.removeItem(clave); } catch { /* idem */ }
    }
  };
}

/** Deja el codigo como se escribe en la ficha: sin espacios y en mayusculas. */
export function normalizarCodigo(texto) {
  return String(texto || '').trim().toLocaleUpperCase('es-CL');
}

export function crearApi({ fetchFn, almacen } = {}) {
  const pedir = fetchFn || ((...args) => fetch(...args));
  const guardado = almacen || almacenDelNavegador();

  async function llamar(ruta, { metodo = 'GET', cuerpo } = {}) {
    let respuesta;
    try {
      respuesta = await pedir(ruta, {
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

  return {
    codigo: () => guardado.get(CLAVE_CODIGO),
    tieneCodigo: () => Boolean(guardado.get(CLAVE_CODIGO)),
    guardarCodigo: (c) => guardado.set(CLAVE_CODIGO, c),
    olvidarCodigo: () => guardado.quitar(CLAVE_CODIGO),

    /** El token de sesion del estudiante, para que el juego lo use al enviar su resultado. */
    guardarToken: (t) => guardado.set(CLAVE_TOKEN, t),

    /** Valida un codigo (recien escrito, o el guardado) y trae curso + nombres + juegos asignados. */
    cargarEntrada: (codigo) => llamar('/api/entrada', { metodo: 'POST', cuerpo: { codigo } }),

    /** El estudiante entra solo eligiendo su nombre. Sin PIN. */
    entrar: (idEstudiante) =>
      llamar(`/api/estudiantes/${encodeURIComponent(idEstudiante)}/entrar`, { metodo: 'POST', cuerpo: {} })
  };
}
