/**
 * app.js
 * Entrada de Mateguarida para los estudiantes. Adaptado de Lectoguarida
 * (public/app.js): codigo de curso, tocar el nombre, jugar. Sin PIN.
 *
 * Flujo:
 *   1. codigo del curso (una vez por dispositivo, queda en localStorage)
 *   2. rejilla con los nombres del curso -> toca su nombre -> entra
 *      (sin PIN: se quito en la etapa 3, un nino peleando con un PIN antes
 *      de jugar era friccion que no aportaba nada)
 *   3. por ahora: "Muy pronto" (todavia no existen juegos; eso es la etapa 4)
 *
 * Todo el texto llega al DOM con textContent, nunca con innerHTML: los
 * nombres de los niños son datos de menores y no se interpretan como HTML.
 */

import { crearApi, ErrorApi, normalizarCodigo } from './api.js';
import { h } from './dom.js';

export function iniciar(raiz, deps = {}) {
  const doc = raiz.ownerDocument;
  const api = deps.api || crearApi();

  const estado = { vista: 'cargando', datos: null, nino: null };

  function pintarBarra() {
    const barra = doc.getElementById('mg-barra');
    if (!barra) return;
    barra.textContent = '';
    barra.append(
      h(doc, 'a', { class: 'marca', href: '/', 'aria-label': 'Mateguarida, ir al inicio' },
        h(doc, 'span', { class: 'marca-icono', 'aria-hidden': 'true', texto: '🔢' }),
        h(doc, 'span', { class: 'marca-texto', texto: 'Mateguarida' }))
    );
  }

  function mostrar(vista, pantalla) {
    estado.vista = vista;
    raiz.textContent = '';
    raiz.append(pantalla);
    const foco = pantalla.querySelector('[data-foco]');
    if (foco) foco.focus({ preventScroll: false });
  }

  /* ------------------------------ pantallas ------------------------------ */

  function pantallaCargando() {
    mostrar('cargando', h(doc, 'section', { class: 'pantalla', 'aria-busy': 'true' },
      h(doc, 'h1', { class: 'titulo', texto: 'Un momento…', tabindex: '-1', 'data-foco': '' })));
  }

  function pantallaError(mensaje, reintentar) {
    mostrar('error', h(doc, 'section', { class: 'pantalla' },
      h(doc, 'h1', { class: 'titulo', texto: 'Ups', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto', role: 'alert', texto: mensaje }),
      h(doc, 'button', { class: 'boton', type: 'button', texto: 'Intentar otra vez', onclick: reintentar })));
  }

  function pantallaCodigo(mensajeError = '') {
    const campo = h(doc, 'input', {
      id: 'codigo', name: 'codigo', type: 'text', inputmode: 'text', maxlength: '24',
      autocomplete: 'off', autocapitalize: 'characters', enterkeyhint: 'go', required: true,
      placeholder: 'Código del curso'
    });
    const aviso = h(doc, 'p', { class: 'error', role: 'alert', 'data-error': '', texto: mensajeError });
    const boton = h(doc, 'button', { class: 'boton', type: 'submit', texto: 'Entrar' });
    const formulario = h(doc, 'form', { class: 'formulario', novalidate: true },
      h(doc, 'label', { for: 'codigo', class: 'etiqueta', texto: 'Código del curso' }), campo, aviso, boton);

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const codigo = normalizarCodigo(campo.value);
      if (!codigo) { aviso.textContent = 'Escribe el código del curso.'; campo.focus(); return; }
      boton.disabled = true;
      aviso.textContent = '';
      try {
        const datos = await api.cargarEntrada(codigo);
        api.guardarCodigo(codigo);
        estado.datos = datos;
        pantallaNombres();
      } catch (error) {
        boton.disabled = false;
        if (error instanceof ErrorApi && error.estado === 401) {
          aviso.textContent = 'Ese código no es correcto. Revísalo y prueba otra vez.';
        } else if (error instanceof ErrorApi && error.estado === 429) {
          aviso.textContent = error.message || 'Demasiados intentos. Espera unos minutos y vuelve a intentar.';
        } else {
          aviso.textContent = 'No pudimos conectarnos. Revisa el internet e inténtalo de nuevo.';
        }
        campo.focus();
      }
    });

    mostrar('codigo', h(doc, 'section', { class: 'pantalla pantalla--angosta' },
      h(doc, 'h1', { class: 'titulo', texto: 'Código del curso', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto', texto: 'Pídeselo a tu profesora. Se escribe una sola vez en este aparato.' }),
      formulario));
  }

  function pantallaNombres() {
    const { curso, estudiantes } = estado.datos;
    estado.nino = null;

    const cuerpo = estudiantes.length
      ? h(doc, 'ul', { class: 'nombres' }, estudiantes.map((e, i) =>
        h(doc, 'li', {},
          h(doc, 'button', { class: 'nombre', type: 'button', 'data-color': i % 6, onclick: () => elegirNino(e) },
            h(doc, 'span', { class: 'nombre-inicial', 'aria-hidden': 'true', texto: (e.nombre[0] || '?').toLocaleUpperCase('es-CL') }),
            h(doc, 'span', { class: 'nombre-texto', texto: e.inicialApellido ? `${e.nombre} ${e.inicialApellido}.` : e.nombre })))))
      : h(doc, 'p', { class: 'texto vacio', texto: 'Todavía no hay nombres en este curso. Pídele a tu profesora que los agregue.' });

    mostrar('nombres', h(doc, 'section', { class: 'pantalla' },
      h(doc, 'p', { class: 'etiqueta-curso', texto: curso.nombre }),
      h(doc, 'h1', { class: 'titulo', texto: '¡Hola! ¿Quién eres?', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto', texto: 'Toca tu nombre.' }),
      h(doc, 'p', { class: 'error', role: 'alert', 'data-error': '' }),
      cuerpo));
  }

  async function entrarComo(estudiante) {
    const sesion = await api.entrar(estudiante.id);
    estado.nino = { id: sesion.estudiante.id, nombre: sesion.estudiante.nombre };
    pantallaProximamente();
  }

  async function elegirNino(estudiante) {
    const aviso = raiz.querySelector('[data-error]');
    raiz.querySelectorAll('.nombre').forEach((b) => { b.disabled = true; });
    try {
      await entrarComo(estudiante);
    } catch (error) {
      if (error instanceof ErrorApi && error.estado === 401) {
        api.olvidarCodigo();
        pantallaCodigo('El código ya no sirve. Pídele a tu profesora el nuevo.');
        return;
      }
      raiz.querySelectorAll('.nombre').forEach((b) => { b.disabled = false; });
      if (aviso) {
        aviso.textContent = error instanceof ErrorApi && error.estado === 404
          ? 'Ese nombre ya no está en la lista. Toca otro o pídele ayuda a tu profesora.'
          : 'No pudimos conectarnos. Revisa el internet e inténtalo de nuevo.';
      }
    }
  }

  function pantallaProximamente() {
    mostrar('proximamente', h(doc, 'section', { class: 'pantalla' },
      h(doc, 'h1', { class: 'titulo', texto: `¡Hola, ${estado.nino.nombre}!`, tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto', texto: 'Muy pronto vas a poder jugar aquí. Vuelve a entrar más adelante.' }),
      h(doc, 'div', { class: 'acciones' },
        h(doc, 'button', { class: 'boton boton--claro', type: 'button', texto: '← No soy yo', onclick: pantallaNombres }))));
  }

  /* ------------------------------ navegacion ----------------------------- */

  async function cargarEntrada() {
    pantallaCargando();
    try {
      estado.datos = await api.cargarEntrada(api.codigo());
      return true;
    } catch (error) {
      if (error instanceof ErrorApi && error.estado === 401) {
        api.olvidarCodigo();
        pantallaCodigo('El código ya no sirve. Pídele a tu profesora el nuevo.');
      } else if (error instanceof ErrorApi && error.estado === 429) {
        pantallaError(error.message || 'Demasiados intentos. Espera unos minutos y vuelve a intentar.', arrancar);
      } else {
        pantallaError('No pudimos conectarnos. Revisa el internet e inténtalo de nuevo.', arrancar);
      }
      return false;
    }
  }

  async function arrancar() {
    pintarBarra();
    if (!api.tieneCodigo()) { pantallaCodigo(); return; }
    if (await cargarEntrada()) pantallaNombres();
  }

  const listo = arrancar();
  return { estado, listo };
}

if (typeof document !== 'undefined') {
  const raiz = document.getElementById('mg-raiz');
  if (raiz && !raiz.hasAttribute('data-sin-arranque')) iniciar(raiz);
}
