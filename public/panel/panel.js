/**
 * panel.js
 * Panel docente: cursos, estudiantes (con mesa e inicial de apellido) y
 * avance por estudiante / por mesa / por OA. Protegido por Cloudflare
 * Access -- si esta pantalla carga, Access ya confirmo que eres
 * connyrriquelme@gmail.com.
 */

import { h } from '../entrada/dom.js';
import { ICONOS } from '../entrada/iconos.js';
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
      const [{ curso, estudiantes }, { juegos }] = await Promise.all([
        api.obtenerCurso(cursoId),
        api.listarJuegosDeCurso(cursoId)
      ]);
      pintarCurso(curso, estudiantes, juegos);
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

  function seccionJuegos(curso, juegos) {
    if (!juegos.length) {
      return h(doc, 'section', {},
        h(doc, 'h2', { texto: 'Juegos' }),
        h(doc, 'p', { class: 'panel-vacio', texto: 'Todavía no hay juegos para asignar.' }));
    }

    const casillas = juegos.map((j) => {
      const casilla = h(doc, 'input', { type: 'checkbox', checked: j.asignado || undefined, id: `juego-${j.id}` });
      return h(doc, 'div', { class: 'panel-juego' },
        h(doc, 'label', { for: `juego-${j.id}` }, casilla, ` ${j.nombre}`),
        h(doc, 'p', { class: 'panel-ayuda', texto: `${j.descripcion} (${j.duracionMinutos} min)` }),
        formularioSumoPrimero(j.id, curso.nivel, j.asignado));
    });

    const boton = h(doc, 'button', { class: 'panel-boton', type: 'button', texto: 'Guardar juegos asignados' });
    boton.addEventListener('click', async () => {
      const seleccionados = juegos
        .map((j) => doc.getElementById(`juego-${j.id}`))
        .filter((c) => c && c.checked)
        .map((c) => c.id.replace('juego-', ''));
      boton.disabled = true;
      try {
        await api.asignarJuegos(curso.id, seleccionados);
        pantallaCurso(curso.id);
      } catch (error) {
        boton.disabled = false;
        doc.defaultView.alert(mensajeError(error));
      }
    });

    return h(doc, 'section', {},
      h(doc, 'h2', { texto: 'Juegos' }),
      h(doc, 'p', { class: 'panel-ayuda', texto: 'Marca los juegos que este curso puede ver al entrar.' }),
      casillas, boton);
  }

  /** Formulario pequeño para la referencia de Sumo Primero (editable, opcional). */
  function formularioSumoPrimero(juegoId, nivel, visibleAlInicio) {
    const detalle = h(doc, 'details', { open: visibleAlInicio || undefined, class: 'panel-sumo' },
      h(doc, 'summary', { texto: 'Referencia a Sumo Primero (opcional)' }));

    const cargando = h(doc, 'p', { texto: 'Cargando…' });
    detalle.append(cargando);

    detalle.addEventListener('toggle', async function alAbrir() {
      if (!detalle.open) return;
      detalle.removeEventListener('toggle', alAbrir);
      try {
        const { sumoPrimero } = await api.obtenerSumoPrimero(juegoId, nivel);
        cargando.remove();
        pintarFormularioSumoPrimero(detalle, juegoId, nivel, sumoPrimero);
      } catch (error) {
        cargando.textContent = mensajeError(error);
      }
    });

    if (visibleAlInicio) detalle.dispatchEvent(new Event('toggle'));
    return detalle;
  }

  function pintarFormularioSumoPrimero(detalle, juegoId, nivel, actual) {
    const tomo = h(doc, 'input', { type: 'text', value: actual.tomo || '', placeholder: 'Tomo', maxlength: '20' });
    const capitulo = h(doc, 'input', { type: 'text', value: actual.capitulo || '', placeholder: 'Capítulo', maxlength: '20' });
    const titulo = h(doc, 'input', { type: 'text', value: actual.titulo || '', placeholder: 'Título del capítulo', maxlength: '120' });
    const paginas = h(doc, 'input', { type: 'text', value: actual.paginas || '', placeholder: 'Páginas', maxlength: '20' });
    const aviso = h(doc, 'p', { class: 'panel-error', role: 'alert' });
    const boton = h(doc, 'button', { class: 'panel-boton panel-boton--chico', type: 'button', texto: 'Guardar referencia' });

    boton.addEventListener('click', async () => {
      aviso.textContent = '';
      boton.disabled = true;
      try {
        await api.guardarSumoPrimero(juegoId, {
          nivel, tomo: tomo.value.trim(), capitulo: capitulo.value.trim(),
          titulo: titulo.value.trim(), paginas: paginas.value.trim()
        });
        boton.disabled = false;
        boton.textContent = 'Guardado ✓';
        setTimeout(() => { boton.textContent = 'Guardar referencia'; }, 1500);
      } catch (error) {
        boton.disabled = false;
        aviso.textContent = mensajeError(error);
      }
    });

    detalle.append(
      h(doc, 'div', { class: 'panel-formulario panel-formulario--compacto' },
        h(doc, 'label', { texto: 'Tomo' }), tomo,
        h(doc, 'label', { texto: 'Capítulo' }), capitulo,
        h(doc, 'label', { texto: 'Título del capítulo' }), titulo,
        h(doc, 'label', { texto: 'Páginas' }), paginas,
        aviso, boton)
    );
  }

  function pintarCurso(curso, estudiantes, juegos) {
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
          h(doc, 'th', { texto: 'Ícono' }), h(doc, 'th', { texto: 'Nombre' }), h(doc, 'th', { texto: 'Inicial apellido' }),
          h(doc, 'th', { texto: 'Mesa' }), h(doc, 'th', { texto: 'Activo' }), h(doc, 'th', {}))),
        h(doc, 'tbody', {}, filasEstudiantes)),

      formularioPegarLista(curso),

      seccionJuegos(curso, juegos)));
  }

  /** Vista del icono actual (o un marcador vacio), tamaño chico, redonda. */
  function vistaIcono(claveIcono) {
    const entrada = claveIcono ? ICONOS[claveIcono] : null;
    if (!entrada) return h(doc, 'span', { class: 'panel-icono-vacio', texto: 'sin ícono' });
    const caja = h(doc, 'span', { class: 'panel-icono-vista' });
    caja.innerHTML = entrada.svg;
    return caja;
  }

  /**
   * Dialogo con los 36 iconos del catalogo: los que ya usa otro estudiante
   * ACTIVO de este curso quedan apagados (no se pueden elegir), salvo el que
   * ya tiene este mismo estudiante (se marca como actual, igual elegible por
   * si se quiere re-confirmar). Al tocar uno se guarda altiro.
   */
  async function abrirSelectorIcono(curso, estudiante, alGuardar) {
    const dialogo = h(doc, 'dialog', { class: 'panel-dialog-iconos' },
      h(doc, 'h2', { texto: `Ícono de ${estudiante.nombre}` }),
      h(doc, 'p', { class: 'panel-ayuda', texto: 'Cargando…' }));
    doc.body.append(dialogo);
    dialogo.showModal();
    dialogo.addEventListener('close', () => dialogo.remove());

    let usados;
    try {
      const { iconos } = await api.obtenerIconosDeCurso(curso.id);
      usados = new Set(iconos.filter((i) => i.usado).map((i) => i.clave));
    } catch (error) {
      dialogo.querySelector('.panel-ayuda').textContent = mensajeError(error);
      return;
    }

    const botones = Object.entries(ICONOS).map(([clave, entrada]) => {
      const esActual = clave === estudiante.icono;
      const estaUsado = usados.has(clave) && !esActual;
      const boton = h(doc, 'button', {
        type: 'button',
        class: `panel-icono-opcion${estaUsado ? ' panel-icono-opcion--usado' : ''}${esActual ? ' panel-icono-opcion--actual' : ''}`,
        disabled: estaUsado || undefined,
        'aria-label': entrada.nombre,
        title: entrada.nombre
      });
      boton.innerHTML = entrada.svg;
      boton.addEventListener('click', async () => {
        dialogo.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        try {
          await api.actualizarEstudiante(estudiante.id, { icono: clave });
          dialogo.close();
          alGuardar(clave);
        } catch (error) {
          doc.defaultView.alert(mensajeError(error));
          dialogo.close();
        }
      });
      return boton;
    });

    dialogo.textContent = '';
    dialogo.append(
      h(doc, 'h2', { texto: `Ícono de ${estudiante.nombre}` }),
      h(doc, 'p', { class: 'panel-ayuda', texto: 'Los apagados ya los usa otro estudiante de este curso.' }),
      h(doc, 'div', { class: 'panel-grilla-iconos' }, botones),
      h(doc, 'button', { class: 'panel-boton panel-boton--claro panel-boton--chico', type: 'button', texto: 'Cerrar', onclick: () => dialogo.close() }));
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

    let vistaActual = vistaIcono(e.icono);
    const cambiarIcono = h(doc, 'button', { class: 'panel-boton panel-boton--chico panel-boton--claro', type: 'button', texto: 'Cambiar' });
    cambiarIcono.addEventListener('click', () => {
      abrirSelectorIcono(curso, e, (claveNueva) => {
        e.icono = claveNueva;
        const nuevaVista = vistaIcono(claveNueva);
        vistaActual.replaceWith(nuevaVista);
        vistaActual = nuevaVista;
      });
    });
    const celdaIcono = h(doc, 'td', { class: 'panel-icono-celda' }, vistaActual, cambiarIcono);

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
      celdaIcono, h(doc, 'td', {}, nombre), h(doc, 'td', {}, inicial), h(doc, 'td', {}, mesa),
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
      })), [['oa', 'OA'], ['estudiantes', 'Estudiantes'], ['intentos', 'Intentos'], ['precision', 'Precisión']]),
      seccionErroresPorOA(porOA)));
  }

  const ETIQUETA_ERROR = {
    cuenta_de_uno: 'Cuenta de 1 en 1 en vez del salto',
    salto_equivocado: 'Confunde el tipo de salto (2/5/10)',
    confunde_decena: 'Se equivoca en la decena'
  };

  /** Que errores tipicos se repiten mas, por OA (solo juegos con ese detalle). */
  function seccionErroresPorOA(porOA) {
    const conErrores = porOA.filter((f) => Object.keys(f.erroresPorTipo || {}).length > 0);
    if (!conErrores.length) return null;

    return h(doc, 'div', {},
      h(doc, 'h2', { texto: 'En qué se equivocan' }),
      conErrores.map((f) => h(doc, 'p', { class: 'panel-errores' },
        `${f.oaCode}: `,
        Object.entries(f.erroresPorTipo)
          .sort((a, b) => b[1] - a[1])
          .map(([tipo, cantidad]) => `${ETIQUETA_ERROR[tipo] || tipo} (${cantidad})`)
          .join(' · '))));
  }

  pantallaCursos();
  return { estado };
}

if (typeof document !== 'undefined') {
  const raiz = document.getElementById('panel-raiz');
  if (raiz) iniciar(raiz);
}
