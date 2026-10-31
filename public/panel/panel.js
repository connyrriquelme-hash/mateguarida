/**
 * panel.js
 * Panel docente: cursos, estudiantes (con mesa e inicial de apellido) y
 * avance por estudiante / por mesa / por OA. Protegido por Cloudflare
 * Access -- si esta pantalla carga, Access ya confirmo que eres
 * connyrriquelme@gmail.com.
 */

import { h } from '../entrada/dom.js';
import { api, ErrorApi } from './api.js';

const NIVELES = [
  ['NT1', 'NT1 (prekínder)'],
  ['NT2', 'NT2 (kínder)'],
  ['1-basico', '1º básico'],
  ['2-basico', '2º básico'],
  ['3-basico', '3º básico'],
  ['4-basico', '4º básico']
];
const NOMBRE_NIVEL = Object.fromEntries(NIVELES);

export function iniciar(raiz) {
  const doc = raiz.ownerDocument;
  const estado = { vista: 'cursos', cursoId: null };

  function mostrar(pantalla) {
    raiz.textContent = '';
    raiz.append(pantalla);
    const foco = pantalla.querySelector('[data-foco]');
    if (foco) foco.focus({ preventScroll: false });
  }

  function mensajeError(error) {
    return error instanceof ErrorApi ? error.message : 'No pudimos conectarnos. Revisa el internet e inténtalo de nuevo.';
  }

  /* -------------------------------- cursos -------------------------------- */

  async function pantallaCursos() {
    estado.vista = 'cursos';
    mostrar(h(doc, 'section', { class: 'panel-pantalla', 'aria-busy': 'true' },
      h(doc, 'h1', { texto: 'Cursos', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { texto: 'Cargando…' })));

    try {
      const { cursos } = await api.listarCursos();
      pintarCursos(cursos);
    } catch (error) {
      mostrar(h(doc, 'section', { class: 'panel-pantalla' },
        h(doc, 'h1', { texto: 'Cursos', tabindex: '-1', 'data-foco': '' }),
        h(doc, 'p', { class: 'panel-error', role: 'alert', texto: mensajeError(error) })));
    }
  }

  function pintarCursos(cursos) {
    const tabla = cursos.length
      ? h(doc, 'table', { class: 'panel-tabla' },
        h(doc, 'thead', {}, h(doc, 'tr', {},
          h(doc, 'th', { texto: 'Curso' }), h(doc, 'th', { texto: 'Nivel' }),
          h(doc, 'th', { texto: 'Código' }), h(doc, 'th', { texto: 'Estudiantes' }), h(doc, 'th', {}))),
        h(doc, 'tbody', {}, cursos.map((c) => h(doc, 'tr', {},
          h(doc, 'td', { texto: c.nombre }),
          h(doc, 'td', { texto: NOMBRE_NIVEL[c.nivel] || c.nivel }),
          h(doc, 'td', {}, h(doc, 'code', { texto: c.codigo })),
          h(doc, 'td', { texto: String(c.totalEstudiantes) }),
          h(doc, 'td', {},
            h(doc, 'button', { class: 'panel-boton panel-boton--chico', type: 'button', texto: 'Ver', onclick: () => pantallaCurso(c.id) }),
            h(doc, 'button', { class: 'panel-boton panel-boton--chico panel-boton--peligro', type: 'button', texto: 'Eliminar', onclick: () => confirmarEliminarCurso(c) })))) ))
      : h(doc, 'p', { class: 'panel-vacio', texto: 'Todavía no hay cursos. Crea el primero abajo.' });

    mostrar(h(doc, 'section', { class: 'panel-pantalla' },
      h(doc, 'h1', { texto: 'Cursos', tabindex: '-1', 'data-foco': '' }),
      tabla,
      formularioCurso()));
  }

  function formularioCurso() {
    const nombre = h(doc, 'input', { id: 'f-nombre', name: 'nombre', type: 'text', maxlength: '60', required: true, placeholder: 'Ej: 2º Básico A' });
    const nivel = h(doc, 'select', { id: 'f-nivel', name: 'nivel', required: true },
      h(doc, 'option', { value: '', texto: 'Elige un nivel' }),
      NIVELES.map(([valor, etiqueta]) => h(doc, 'option', { value: valor, texto: etiqueta })));
    const cantidadMesas = h(doc, 'input', {
      id: 'f-mesas', name: 'mesas', type: 'number', min: '1', max: '60', value: '8', required: true
    });
    const aviso = h(doc, 'p', { class: 'panel-error', role: 'alert' });
    const boton = h(doc, 'button', { class: 'panel-boton', type: 'submit', texto: 'Crear curso' });

    const formulario = h(doc, 'form', { class: 'panel-formulario', novalidate: true },
      h(doc, 'h2', { texto: 'Crear curso' }),
      h(doc, 'label', { for: 'f-nombre', texto: 'Nombre' }), nombre,
      h(doc, 'label', { for: 'f-nivel', texto: 'Nivel' }), nivel,
      h(doc, 'label', { for: 'f-mesas', texto: 'Cantidad de mesas' }), cantidadMesas,
      h(doc, 'p', { class: 'panel-ayuda', texto: 'El código de entrada se genera solo; lo vas a ver apenas se cree el curso.' }),
      aviso, boton);

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      aviso.textContent = '';
      boton.disabled = true;
      try {
        const { curso } = await api.crearCurso({
          nombre: nombre.value.trim(), nivel: nivel.value, cantidadMesas: Number(cantidadMesas.value)
        });
        doc.defaultView.alert(`Curso "${curso.nombre}" creado.\n\nCódigo de entrada: ${curso.codigo}\n\nEscríbelo una vez en cada tablet del curso.`);
        pantallaCursos();
      } catch (error) {
        boton.disabled = false;
        aviso.textContent = mensajeError(error);
      }
    });

    return formulario;
  }

  async function confirmarEliminarCurso(curso) {
    if (!doc.defaultView.confirm(`¿Eliminar "${curso.nombre}" y a todos sus estudiantes? No se puede deshacer.`)) return;
    try {
      await api.eliminarCurso(curso.id);
      pantallaCursos();
    } catch (error) {
      doc.defaultView.alert(mensajeError(error));
    }
  }

  /* ------------------------------- un curso -------------------------------- */

  async function pantallaCurso(cursoId) {
    estado.vista = 'curso';
    estado.cursoId = cursoId;
    mostrar(h(doc, 'section', { class: 'panel-pantalla', 'aria-busy': 'true' }, h(doc, 'p', { texto: 'Cargando…' })));
    try {
      const { curso, estudiantes } = await api.obtenerCurso(cursoId);
      pintarCurso(curso, estudiantes);
    } catch (error) {
      mostrar(h(doc, 'section', { class: 'panel-pantalla' },
        h(doc, 'p', { class: 'panel-error', role: 'alert', texto: mensajeError(error) }),
        botonVolver()));
    }
  }

  function botonVolver() {
    return h(doc, 'button', { class: 'panel-boton panel-boton--claro', type: 'button', texto: '← Volver a cursos', onclick: pantallaCursos });
  }

  /** <select> con "Sin mesa" + 1..cantidadMesas. */
  function selectorMesa(cantidadMesas, valorActual, etiquetaAria) {
    const opciones = [h(doc, 'option', { value: '', texto: 'Sin mesa' })];
    for (let n = 1; n <= cantidadMesas; n += 1) {
      opciones.push(h(doc, 'option', { value: String(n), texto: `Mesa ${n}` }));
    }
    const select = h(doc, 'select', { 'aria-label': etiquetaAria }, opciones);
    select.value = valorActual ? String(valorActual) : '';
    return select;
  }

  function pintarCurso(curso, estudiantes) {
    const filasEstudiantes = estudiantes.length
      ? estudiantes.map((e) => filaEstudiante(curso, e))
      : [h(doc, 'tr', {}, h(doc, 'td', { colspan: '5', class: 'panel-vacio', texto: 'Todavía no hay estudiantes. Pégalos abajo.' }))];

    const regenerar = h(doc, 'button', { class: 'panel-boton panel-boton--chico panel-boton--claro', type: 'button', texto: 'Generar código nuevo' });
    regenerar.addEventListener('click', async () => {
      if (!doc.defaultView.confirm('¿Generar un código nuevo? El código anterior deja de funcionar.')) return;
      try {
        const { curso: actualizado } = await api.regenerarCodigo(curso.id);
        doc.defaultView.alert(`Código nuevo: ${actualizado.codigo}`);
        pantallaCurso(curso.id);
      } catch (error) {
        doc.defaultView.alert(mensajeError(error));
      }
    });

    mostrar(h(doc, 'section', { class: 'panel-pantalla' },
      botonVolver(),
      h(doc, 'h1', { tabindex: '-1', 'data-foco': '', texto: curso.nombre }),
      h(doc, 'p', { texto: `${NOMBRE_NIVEL[curso.nivel] || curso.nivel} · código ` }, h(doc, 'code', { texto: curso.codigo }), ' ', regenerar),

      h(doc, 'div', { class: 'panel-pestanas' },
        h(doc, 'button', { class: 'panel-boton panel-boton--claro', type: 'button', texto: 'Ver avance', onclick: () => pantallaAvance(curso.id) })),

      h(doc, 'h2', { texto: 'Estudiantes' }),
      h(doc, 'table', { class: 'panel-tabla' },
        h(doc, 'thead', {}, h(doc, 'tr', {},
          h(doc, 'th', { texto: 'Nombre' }), h(doc, 'th', { texto: 'Inicial apellido' }),
          h(doc, 'th', { texto: 'Mesa' }), h(doc, 'th', { texto: 'Activo' }), h(doc, 'th', {}))),
        h(doc, 'tbody', {}, filasEstudiantes)),

      formularioPegarLista(curso)));
  }

  function filaEstudiante(curso, e) {
    const nombre = h(doc, 'input', { type: 'text', value: e.nombre, maxlength: '60', 'aria-label': `Nombre de ${e.nombre}` });
    const inicial = h(doc, 'input', { type: 'text', value: e.inicialApellido || '', maxlength: '4', class: 'panel-input--chico', 'aria-label': `Inicial del apellido de ${e.nombre}` });
    const mesa = selectorMesa(curso.cantidadMesas, e.mesa, `Mesa de ${e.nombre}`);
    const activo = h(doc, 'input', { type: 'checkbox', checked: e.activo || undefined, 'aria-label': `${e.nombre} activo` });

    async function guardar(cambios) {
      try {
        await api.actualizarEstudiante(e.id, cambios);
      } catch (error) {
        doc.defaultView.alert(mensajeError(error));
        pantallaCurso(curso.id);
      }
    }

    nombre.addEventListener('change', () => guardar({ nombre: nombre.value.trim() }));
    inicial.addEventListener('change', () => guardar({ inicialApellido: inicial.value.trim() || null }));
    mesa.addEventListener('change', () => guardar({ mesa: mesa.value ? Number(mesa.value) : null }));
    activo.addEventListener('change', () => guardar({ activo: activo.checked }));

    const eliminar = h(doc, 'button', { class: 'panel-boton panel-boton--chico panel-boton--peligro', type: 'button', texto: 'Eliminar' });
    eliminar.addEventListener('click', async () => {
      if (!doc.defaultView.confirm(`¿Eliminar a ${e.nombre} del curso?`)) return;
      try {
        await api.eliminarEstudiante(e.id);
        pantallaCurso(curso.id);
      } catch (error) {
        doc.defaultView.alert(mensajeError(error));
      }
    });

    return h(doc, 'tr', {},
      h(doc, 'td', {}, nombre), h(doc, 'td', {}, inicial), h(doc, 'td', {}, mesa),
      h(doc, 'td', {}, activo), h(doc, 'td', {}, eliminar));
  }

  function formularioPegarLista(curso) {
    const pegado = h(doc, 'textarea', {
      id: 'f-pegado', name: 'pegado', rows: '6',
      placeholder: 'Un nombre por línea. Para la inicial del apellido, escríbela al final: Ana R.'
    });
    const mesa = selectorMesa(curso.cantidadMesas, null, 'Mesa para todos los de esta lista');
    const aviso = h(doc, 'p', { class: 'panel-error', role: 'alert' });
    const boton = h(doc, 'button', { class: 'panel-boton', type: 'submit', texto: 'Agregar estudiantes' });

    const formulario = h(doc, 'form', { class: 'panel-formulario', novalidate: true },
      h(doc, 'h2', { texto: 'Agregar estudiantes' }),
      h(doc, 'label', { for: 'f-pegado', texto: 'Pega la lista del curso' }), pegado,
      h(doc, 'label', { texto: 'Mesa (opcional, se aplica a todos los de esta lista)' }), mesa,
      aviso, boton);

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      aviso.textContent = '';
      if (!pegado.value.trim()) { aviso.textContent = 'Escribe al menos un nombre.'; return; }
      boton.disabled = true;
      try {
        await api.agregarEstudiantes(curso.id, { pegado: pegado.value, mesa: mesa.value ? Number(mesa.value) : undefined });
        pantallaCurso(curso.id);
      } catch (error) {
        boton.disabled = false;
        aviso.textContent = mensajeError(error);
      }
    });

    return formulario;
  }

  /* -------------------------------- avance --------------------------------- */

  async function pantallaAvance(cursoId) {
    mostrar(h(doc, 'section', { class: 'panel-pantalla', 'aria-busy': 'true' }, h(doc, 'p', { texto: 'Cargando…' })));
    try {
      const avance = await api.obtenerAvance(cursoId);
      pintarAvance(cursoId, avance);
    } catch (error) {
      mostrar(h(doc, 'section', { class: 'panel-pantalla' },
        h(doc, 'p', { class: 'panel-error', role: 'alert', texto: mensajeError(error) }),
        h(doc, 'button', { class: 'panel-boton panel-boton--claro', type: 'button', texto: '← Volver al curso', onclick: () => pantallaCurso(cursoId) })));
    }
  }

  function tablaAvance(filas, columnas) {
    if (!filas.length) return h(doc, 'p', { class: 'panel-vacio', texto: 'Sin datos todavía. Van a aparecer cuando los estudiantes jueguen.' });
    return h(doc, 'table', { class: 'panel-tabla' },
      h(doc, 'thead', {}, h(doc, 'tr', {}, columnas.map(([, etiqueta]) => h(doc, 'th', { texto: etiqueta })))),
      h(doc, 'tbody', {}, filas.map((f) => h(doc, 'tr', {}, columnas.map(([clave]) => h(doc, 'td', { texto: String(f[clave]) }))))));
  }

  function pintarAvance(cursoId, { porEstudiante, porMesa, porOA }) {
    mostrar(h(doc, 'section', { class: 'panel-pantalla' },
      h(doc, 'button', { class: 'panel-boton panel-boton--claro', type: 'button', texto: '← Volver al curso', onclick: () => pantallaCurso(cursoId) }),
      h(doc, 'h1', { tabindex: '-1', 'data-foco': '', texto: 'Avance' }),

      h(doc, 'h2', { texto: 'Por estudiante' }),
      tablaAvance(porEstudiante.map((f) => ({
        nombre: f.inicialApellido ? `${f.nombre} ${f.inicialApellido}.` : f.nombre,
        mesa: f.mesa || '—', intentos: f.intentosTotal, precision: `${Math.round(f.precision * 100)}%`
      })), [['nombre', 'Nombre'], ['mesa', 'Mesa'], ['intentos', 'Intentos'], ['precision', 'Precisión']]),

      h(doc, 'h2', { texto: 'Por mesa' }),
      tablaAvance(porMesa.map((f) => ({
        mesa: f.mesa, estudiantes: f.totalEstudiantes, intentos: f.intentosTotal, precision: `${Math.round(f.precision * 100)}%`
      })), [['mesa', 'Mesa'], ['estudiantes', 'Estudiantes'], ['intentos', 'Intentos'], ['precision', 'Precisión']]),

      h(doc, 'h2', { texto: 'Por OA' }),
      tablaAvance(porOA.map((f) => ({
        oa: f.oaCode, estudiantes: f.totalEstudiantes, intentos: f.intentosTotal, precision: `${Math.round(f.precision * 100)}%`
      })), [['oa', 'OA'], ['estudiantes', 'Estudiantes'], ['intentos', 'Intentos'], ['precision', 'Precisión']])));
  }

  pantallaCursos();
  return { estado };
}

if (typeof document !== 'undefined') {
  const raiz = document.getElementById('panel-raiz');
  if (raiz) iniciar(raiz);
}
