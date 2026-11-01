/**
 * juego.js — "Guarida salta los techos"
 * Conteo de 2 en 2, de 5 en 5 y de 10 en 10 (MA02-OA-01, ver data/juegos-oa.json).
 *
 * Guarida (el gato de Lectoguarida, mascota de toda Mateguarida tambien)
 * salta de techo en techo por una calle de colores. Una partida = 9 saltos
 * (3 de cada tipo, en orden mezclado). Cada salto muestra 4 opciones: la
 * correcta y 3 distractores DIAGNOSTICOS (no al azar), cada uno
 * representando un error tipico:
 *   - cuenta_de_uno:      sumar/restar 1 en vez del salto (confunde el
 *                         conteo de 1 en 1 con el salteado)
 *   - salto_equivocado:   usar otro de los tres saltos (2/5/10)
 *   - confunde_decena:    se equivoca en la decena (+/-10 del correcto)
 *
 * Nivel 1-2: el punto de partida es siempre multiplo del salto, solo hacia
 * adelante. Nivel 3-4: el punto de partida puede ser cualquier numero (el
 * OA dice "empezando por cualquier numero menor que 1000") y a veces
 * Guarida cuenta hacia atras. Sube de nivel tras 2 saltos acertados a la
 * primera seguidos; baja tras 2 saltos fallados (que necesitaron mas de un
 * intento) seguidos -- nunca tras uno solo. OJO: este "nivel" (1-4) es la
 * dificultad DENTRO de la partida, no el nivel curricular -- ver niveles.json.
 *
 * Apoyo: si el nino falla 2 veces el MISMO salto, aparece el conteo
 * concreto (objetos apareciendo de a uno) antes de dejarlo intentar de
 * nuevo. Eso no lo saca del juego ni le pone un limite de tiempo.
 *
 * Voz: cada salto se lee con speechSynthesis (es-CL). Si el equipo no tiene
 * ninguna voz en español, aparece un aviso discreto (el juego sigue
 * jugable en silencio) y un boton para repetir la voz en cada salto.
 *
 * Que pasos usar, hasta donde llegar y como se llama/dibuja cada paso varia
 * por nivel CURRICULAR (1-basico cuenta de 1 en 1 tambien, 3-basico suma
 * pasos de 3/4/100...): eso vive en niveles.json, una fila por nivel, para
 * no duplicar este archivo por cada nivel. El nivel curricular del
 * estudiante se guarda en localStorage al entrar (ver entrada/app.js).
 */

import { h } from '../../entrada/dom.js';
import { gatoSVG } from '../../entrada/mascota.js';
import { CLAVE_TOKEN, CLAVE_NIVEL } from '../../entrada/api.js';
import { decir, hayVozEspanol } from '../../entrada/voz.js';

const TOTAL_SALTOS = 9;
const SALTOS_PARA_SUBIR = 2;
const SALTOS_PARA_BAJAR = 2;
const NIVEL_POR_DEFECTO = '2-basico'; // si falta el dato (sesion vieja) o el nivel no tiene fila en niveles.json todavia

/** Colores de la calle, uno por techo (misma paleta que /styles.css). */
const COLORES_TECHO = ['naranja', 'rosado', 'verde', 'morado', 'amarillo', 'azul'];

/* --------------------------- generar un salto ---------------------------- */

function entero(min, maxExclusivo) {
  return min + Math.floor(Math.random() * (maxExclusivo - min));
}

function elegir(lista) {
  return lista[entero(0, lista.length)];
}

function mezclar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = entero(0, i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Genera el punto de partida y la direccion segun el nivel. */
function generarPunto(paso, nivel, config) {
  const techo = config.techoPorDificultad[nivel - 1];
  let anterior;
  if (nivel <= 2) {
    // multiplo exacto del paso, para que el patron sea obvio.
    const maxMultiplos = Math.floor((techo - paso) / paso);
    anterior = entero(0, maxMultiplos + 1) * paso;
  } else {
    anterior = entero(0, techo - paso);
  }

  let direccion = 'adelante';
  if (nivel >= 3 && anterior - paso >= 0 && Math.random() < 0.5) direccion = 'atras';

  return { anterior, direccion };
}

/** { correcto, opciones: [{valor, tipoError|null}], ... } */
function generarSalto(numero, nivel, tipoConteo, config) {
  const paso = Number(tipoConteo);
  const { anterior, direccion } = generarPunto(paso, nivel, config);
  const signo = direccion === 'adelante' ? 1 : -1;
  const correcto = anterior + signo * paso;

  const otroPaso = Number(elegir(config.pasos.filter((p) => p !== tipoConteo)));

  const valores = new Set([correcto]);
  function valorUnico(candidato) {
    let v = candidato;
    let vueltas = 0;
    while (valores.has(v) || v < 0) {
      v = candidato + (vueltas % 2 === 0 ? 1 : -1) * (Math.floor(vueltas / 2) + 1);
      vueltas += 1;
      if (vueltas > 20) break; // margen de seguridad, no deberia pasar
    }
    valores.add(v);
    return v;
  }

  const distractores = [
    { valor: valorUnico(anterior + signo * 1), tipoError: 'cuenta_de_uno' },
    { valor: valorUnico(anterior + signo * otroPaso), tipoError: 'salto_equivocado' },
    { valor: valorUnico(correcto >= 10 ? correcto - 10 : correcto + 10), tipoError: 'confunde_decena' }
  ];

  const opciones = mezclar([{ valor: correcto, tipoError: null }, ...distractores]);

  return { numero, tipoConteo, direccion, nivel, anterior, correcto, opciones };
}

function generarSecuenciaDeSaltos(pasos) {
  // Reparte TOTAL_SALTOS entre los pasos disponibles lo mas parejo posible
  // (con 3 pasos y 9 saltos: 3 de cada uno), despues mezcla el orden.
  const secuencia = Array.from({ length: TOTAL_SALTOS }, (_, i) => pasos[i % pasos.length]);
  return mezclar(secuencia);
}

/* --------------------------------- juego ---------------------------------- */

export async function iniciarJuego(raiz, deps = {}) {
  const doc = raiz.ownerDocument;
  const almacen = deps.almacen || window.localStorage;
  const enviar = deps.enviar || ((...args) => fetch(...args));
  const pedirConfig = deps.pedirConfig || ((...args) => fetch(...args));

  function obtenerNivelCurricular() {
    try { return almacen.getItem(CLAVE_NIVEL) || NIVEL_POR_DEFECTO; } catch { return NIVEL_POR_DEFECTO; }
  }

  let todosLosNiveles = {};
  try {
    const respuesta = await pedirConfig('./niveles.json');
    todosLosNiveles = await respuesta.json();
  } catch {
    // Sin internet o archivo no disponible: se sigue con el nivel por
    // defecto mas abajo, el juego no se rompe por esto.
  }
  const config = todosLosNiveles[obtenerNivelCurricular()] || todosLosNiveles[NIVEL_POR_DEFECTO];
  if (!config) {
    // Sin internet y sin cache: no hay de donde sacar pasos/rangos. Se
    // avisa en vez de romper el juego con una excepcion.
    raiz.textContent = '';
    raiz.append(h(doc, 'section', { class: 'pantalla' },
      h(doc, 'h1', { class: 'titulo', texto: 'No pudimos cargar el juego', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto', texto: 'Revisa tu conexión a internet e inténtalo de nuevo.' }),
      h(doc, 'a', { class: 'boton', href: '/entrada/', texto: 'Volver' })));
    raiz.querySelector('[data-foco]')?.focus({ preventScroll: false });
    return { estado: null };
  }

  const estado = {
    nivel: 1,
    aciertosSeguidos: 0,
    erroresSeguidos: 0,
    indice: 0,
    tiposPendientes: generarSecuenciaDeSaltos(config.pasos),
    resultados: [],
    inicioMs: Date.now(),
    ultimoSalto: null
  };

  function gato(animo, clase) {
    const caja = h(doc, 'div', { class: clase, 'aria-hidden': 'true' });
    caja.innerHTML = gatoSVG(animo);
    return caja;
  }

  function mostrar(pantalla) {
    raiz.textContent = '';
    raiz.append(pantalla);
    const foco = pantalla.querySelector('[data-foco]');
    if (foco) foco.focus({ preventScroll: false });
  }

  function obtenerToken() {
    try { return almacen.getItem(CLAVE_TOKEN) || ''; } catch { return ''; }
  }

  function pantallaSinSesion() {
    mostrar(h(doc, 'section', { class: 'pantalla' },
      gato('normal', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: 'Primero entra a tu curso', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto', texto: 'Pídele a tu profesora que te ayude a entrar desde la pantalla principal.' }),
      h(doc, 'a', { class: 'boton', href: '/entrada/', texto: 'Ir a la entrada' })));
  }

  /** Aviso discreto + boton de repetir, solo si el aparato no tiene voz en español. */
  function barraDeVoz(repetir) {
    if (hayVozEspanol()) {
      return h(doc, 'button', { class: 'boton-voz', type: 'button', 'aria-label': 'Repetir la voz', onclick: repetir }, '🔊');
    }
    return h(doc, 'div', { class: 'aviso-sin-voz' },
      h(doc, 'span', { texto: 'Este aparato no tiene voz en español. El juego funciona igual.' }),
      h(doc, 'button', { class: 'boton-voz', type: 'button', 'aria-label': 'Repetir la voz', onclick: repetir }, '🔊'));
  }

  function jugarSalto() {
    // El orden de tipos (3/3/3 mezclado) ya esta fijo desde el inicio; el
    // nivel actual (que sube o baja segun el progreso) decide el rango,
    // si el punto de partida es redondo y si hay saltos hacia atras.
    const tipoConteo = estado.tiposPendientes[estado.indice];
    const salto = generarSalto(estado.indice + 1, estado.nivel, tipoConteo, config);
    estado.ultimoSalto = salto;
    pintarSalto(salto, { intentos: 0, primerError: null, apoyoMostrado: false });
  }

  function textoPregunta(salto) {
    return salto.direccion === 'adelante'
      ? `Desde el ${salto.anterior}, ¿a qué número salta Guarida?`
      : `Ahora para atrás, desde el ${salto.anterior}. ¿Dónde cae?`;
  }

  function pintarSalto(salto, progreso) {
    const ctx = config.contexto[salto.tipoConteo];

    const avisoAviso = h(doc, 'p', { class: 'error', role: 'alert', 'data-aviso': '' });

    const calle = h(doc, 'div', { class: 'calle' },
      h(doc, 'div', { class: `techo techo--anterior techo--${COLORES_TECHO[salto.numero % COLORES_TECHO.length]}` },
        h(doc, 'span', { class: 'numero-grande', texto: String(salto.anterior) })),
      gato('normal', 'gato-saltando'),
      h(doc, 'div', { class: `techo techo--blanco techo--${COLORES_TECHO[(salto.numero + 1) % COLORES_TECHO.length]}`, 'data-foco': '', tabindex: '-1' },
        h(doc, 'span', { class: 'numero-grande', texto: '?' })));

    const botonesOpciones = salto.opciones.map((op) =>
      h(doc, 'button', {
        class: 'boton-salto numero-grande', type: 'button', texto: String(op.valor),
        onclick: () => elegirOpcion(salto, progreso, op)
      })
    );

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      h(doc, 'p', { class: 'escena-etiqueta', texto: `${ctx.escena} · de ${salto.tipoConteo} en ${salto.tipoConteo}` }),
      calle,
      h(doc, 'p', { class: 'texto', texto: textoPregunta(salto) }),
      barraDeVoz(() => decir(textoPregunta(salto), { token: obtenerToken() })),
      avisoAviso,
      h(doc, 'div', { class: 'opciones' }, botonesOpciones),
      h(doc, 'p', { class: 'progreso', texto: `Salto ${salto.numero} de ${TOTAL_SALTOS}` })));

    decir(textoPregunta(salto), { token: obtenerToken() });
  }

  function mostrarApoyo(salto, progreso, despues) {
    const ctx = config.contexto[salto.tipoConteo];
    const grupos = Math.round(Math.abs(salto.correcto - salto.anterior) / ctx.porGrupo);
    const filas = [];
    for (let g = 0; g < grupos; g += 1) {
      filas.push(h(doc, 'div', { class: 'grupo-apoyo' }, ctx.icono.repeat(ctx.porGrupo)));
    }

    const texto = `${salto.anterior} ${salto.direccion === 'adelante' ? 'más' : 'menos'} ${salto.tipoConteo} es ${salto.correcto}`;

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      gato('normal', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: 'Contemos juntos', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto', texto: `Desde ${salto.anterior}, cada grupo de ${ctx.nombrePlural} suma ${salto.tipoConteo}.` }),
      h(doc, 'div', { class: 'grupos-apoyo' }, filas),
      h(doc, 'p', { class: 'texto texto--grande numero-grande', texto: `${salto.anterior} ${salto.direccion === 'adelante' ? '+' : '−'} ${salto.tipoConteo} = ${salto.correcto}` }),
      barraDeVoz(() => decir(texto, { token: obtenerToken() })),
      h(doc, 'button', { class: 'boton', type: 'button', texto: 'Intentar de nuevo', onclick: despues })));

    decir(texto, { token: obtenerToken() });
    progreso.apoyoMostrado = true;
  }

  function elegirOpcion(salto, progreso, opcion) {
    if (opcion.tipoError === null) {
      // acierto
      const primeraVez = progreso.intentos === 0;
      decir('¡Muy bien!', { clave: 'muy-bien' });
      estado.resultados.push({
        // variante: contrato generico de D1 (tabla ronda), ver cloudflare/schema.sql.
        numero: salto.numero, variante: `${salto.tipoConteo}-${salto.direccion}`, nivel: salto.nivel,
        correcto: primeraVez, usoApoyo: progreso.apoyoMostrado,
        tipoError: primeraVez ? null : progreso.primerError
      });
      ajustarNivel(primeraVez);
      siguienteSaltoOFin();
      return;
    }

    // error
    progreso.intentos += 1;
    if (!progreso.primerError) progreso.primerError = opcion.tipoError;
    decir('¡Casi! Inténtalo de nuevo', { clave: 'casi-de-nuevo' });
    const aviso = raiz.querySelector('[data-aviso]');
    if (aviso) aviso.textContent = 'Casi. Mira desde qué techo salta Guarida.';
    const gatoCaja = raiz.querySelector('.gato-saltando');
    if (gatoCaja) gatoCaja.innerHTML = gatoSVG('ups');

    if (progreso.intentos >= 2 && !progreso.apoyoMostrado) {
      mostrarApoyo(salto, progreso, () => pintarSalto(salto, progreso));
    }
  }

  function ajustarNivel(acerto) {
    if (acerto) {
      estado.aciertosSeguidos += 1;
      estado.erroresSeguidos = 0;
      if (estado.aciertosSeguidos >= SALTOS_PARA_SUBIR && estado.nivel < 4) {
        estado.nivel += 1;
        estado.aciertosSeguidos = 0;
      }
    } else {
      estado.erroresSeguidos += 1;
      estado.aciertosSeguidos = 0;
      if (estado.erroresSeguidos >= SALTOS_PARA_BAJAR && estado.nivel > 1) {
        estado.nivel -= 1;
        estado.erroresSeguidos = 0;
      }
    }
  }

  function siguienteSaltoOFin() {
    estado.indice += 1;
    if (estado.indice >= TOTAL_SALTOS) {
      terminarPartida();
    } else {
      jugarSalto();
    }
  }

  async function terminarPartida() {
    const correctos = estado.resultados.filter((r) => r.correcto).length;
    const duracionMs = Date.now() - estado.inicioMs;

    mostrar(h(doc, 'section', { class: 'pantalla-juego pantalla-juego--cierre' },
      gato('feliz', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: '¡Llegamos al final!', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto texto--grande', texto: `Guarida dio ${TOTAL_SALTOS} saltos contigo.` }),
      h(doc, 'p', { class: 'texto', texto: `Acertaste ${correctos} de ${TOTAL_SALTOS} a la primera.` }),
      barraDeVoz(() => decir('¡Llegamos al final!', { clave: 'cierre-techos' })),
      h(doc, 'a', { class: 'boton', href: '/entrada/', texto: 'Volver' })));

    decir('¡Llegamos al final!', { clave: 'cierre-techos' });

    const token = obtenerToken();
    if (!token) return; // no deberia pasar (ya se valido al entrar), pero no se rompe el cierre si pasa.

    try {
      await enviar('/api/intentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, juegoId: 'guarida-salta-los-techos', duracionMs, dispositivo: 'tablet',
          rondas: estado.resultados
        })
      });
    } catch {
      // Sin internet: se pierde este resultado. Mejora futura (como
      // evidence-sink.js de Lectoguarida): guardar en IndexedDB y
      // reintentar. Por ahora el cierre ya se mostro, no se bloquea al nino.
    }
  }

  if (!obtenerToken()) {
    pantallaSinSesion();
    return { estado };
  }

  jugarSalto();
  return { estado };
}

if (typeof document !== 'undefined') {
  const raiz = document.getElementById('mg-juego-raiz');
  if (raiz) iniciarJuego(raiz);
}
