/**
 * juego.js — "Guarida cuenta sus estrellas"
 * Transicion (NT1/NT2): conteo 1 a 1 tocando objetos y comparar cantidades,
 * sin texto en pantalla -- todo por voz e imagen (NT-PM-OA-06 y
 * NT-PM-OA-04, ver data/juegos-oa.json).
 *
 * Objetos: estrella, conchita o manzana, elegidos al azar por ronda
 * (objetos.js). Una partida mezcla dos tipos de ronda:
 *
 *   'contar'   (mayoria): aparecen N objetos sueltos. El nino los TOCA uno
 *              a uno -- cada toque los marca y dice el numero en voz alta
 *              ("uno", "dos"...). Al tocar a Guarida (el "ya conte"), se
 *              congela lo tocado y Guarida pregunta "¿Cuántas hay?": el
 *              nino elige entre 4 numeros grandes (NT1 muestra puntos
 *              debajo de cada numero, NT2 solo el numeral). Guarida NO
 *              cuenta en voz alta durante la ronda -- eso queda solo para
 *              el apoyo, tras 2 fallos.
 *   'comparar' (el resto): dos grupos de objetos lado a lado y una balanza.
 *              Guarida pregunta "¿Dónde hay más?" o "¿Dónde hay menos?"; el
 *              nino toca el grupo izquierdo, el derecho o la balanza (si
 *              son iguales). Los grupos son iguales al azar, pero SIEMPRE
 *              al menos una vez por partida. Algunas rondas ponen el grupo
 *              mas chico mas esparcido en el espacio, a proposito, para
 *              detectar si el nino juzga por el espacio que ocupa en vez
 *              de por la cantidad real.
 *
 * Nivel 1-4 (dificultad DENTRO de la partida, sube/baja solo tras 2
 * aciertos/errores seguidos -- igual criterio que los otros 4 juegos) y
 * cuantas rondas de cada tipo hay por partida (NT1: 6 = 4+2; NT2: 9 = 6+3)
 * viven en niveles.json, una fila por nivel curricular.
 *
 * Distractores diagnosticos:
 *   contar:   cuenta_de_mas, cuenta_de_menos, invierte_cifras (N de dos
 *             cifras) o numero_al_azar (N de una cifra), y los de PROCESO
 *             se_salto_alguno / toco_de_mas (tienen prioridad sobre los
 *             anteriores si ocurrieron, son la explicacion mas precisa).
 *   comparar: confunde_mas_menos, no_distingue_cantidad, y
 *             juzga_por_espacio (cuando la ronda esparcio el grupo chico y
 *             el nino lo elige de todos modos).
 *
 * Apoyo (tras 2 fallos en la misma ronda): en 'contar', Guarida recuenta
 * todos los objetos en voz alta, mas lento. En 'comparar', los objetos de
 * ambos grupos se alinean en pares para ver cual sobra.
 */

import { h } from '../../entrada/dom.js';
import { gatoSVG } from '../../entrada/mascota.js';
import { objetoSVG, objetoContadoSVG, balanzaSVG, TEMAS } from './objetos.js';
import { CLAVE_TOKEN, CLAVE_NIVEL } from '../../entrada/api.js';
import { decir, hayVozEspanol } from '../../entrada/voz.js';

const SALTOS_PARA_SUBIR = 2;
const SALTOS_PARA_BAJAR = 2;
const NIVEL_POR_DEFECTO = 'NT1';

const NUMERO_PALABRA = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'
];

/* --------------------------- generar una ronda ---------------------------- */

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

function invertirDigitos(n) {
  const decenas = Math.floor(n / 10);
  const unidades = n % 10;
  return unidades * 10 + decenas;
}

function crearValorUnico(evitarCero) {
  const vistos = new Set();
  return (candidato) => {
    let v = Math.max(evitarCero ? 1 : 0, Math.round(candidato));
    let vueltas = 0;
    while (vistos.has(v)) {
      v = Math.max(evitarCero ? 1 : 0, candidato + (vueltas % 2 === 0 ? 1 : -1) * (Math.floor(vueltas / 2) + 1));
      vueltas += 1;
      if (vueltas > 20) break;
    }
    vistos.add(v);
    return v;
  };
}

function generarRondaContar(numero, nivel, config) {
  const { min, max } = config.contarPorDificultad[nivel - 1];
  const total = entero(min, max + 1);
  const tema = elegir(TEMAS);

  const valorUnico = crearValorUnico(true);
  valorUnico(total);
  const distractorTercero = total >= 10
    ? { valor: valorUnico(invertirDigitos(total)), tipoError: 'invierte_cifras' }
    : { valor: valorUnico(total + (Math.random() < 0.5 ? 3 : -3)), tipoError: 'numero_al_azar' };

  const opciones = mezclar([
    { valor: total, tipoError: null },
    { valor: valorUnico(total + 1), tipoError: 'cuenta_de_mas' },
    { valor: valorUnico(total - 1), tipoError: 'cuenta_de_menos' },
    distractorTercero
  ]);

  return { numero, modo: 'contar', nivel, tema, total, opciones };
}

function generarRondaComparar(numero, nivel, config, forzarIgual) {
  const { min, max } = config.compararPorDificultad[nivel - 1];
  const tema = elegir(TEMAS);
  const a = entero(min, max + 1);
  const b = forzarIgual ? a : entero(min, max + 1);
  const pregunta = elegir(['mas', 'menos']);

  let correctoLado;
  if (a === b) correctoLado = 'balanza';
  else if (pregunta === 'mas') correctoLado = a > b ? 'izquierda' : 'derecha';
  else correctoLado = a > b ? 'derecha' : 'izquierda';

  // La mitad de las veces (cuando no son iguales), el lado con MENOS objetos
  // se dibuja mas esparcido -- para ver si el nino juzga por el espacio.
  let ladoEspaciado = null;
  if (a !== b && Math.random() < 0.5) ladoEspaciado = a < b ? 'izquierda' : 'derecha';

  return { numero, modo: 'comparar', nivel, tema, a, b, pregunta, correctoLado, ladoEspaciado };
}

function generarSecuenciaDeModos(contarRondas, compararRondas) {
  const lista = [];
  for (let i = 0; i < contarRondas; i += 1) lista.push('contar');
  for (let i = 0; i < compararRondas; i += 1) lista.push('comparar');
  return mezclar(lista);
}

/* --------------------------------- juego ---------------------------------- */

export async function iniciarJuego(raiz, deps = {}) {
  const doc = raiz.ownerDocument;
  const almacen = deps.almacen || window.localStorage;
  const enviar = deps.enviar || ((...args) => fetch(...args));
  const pedirConfig = deps.pedirConfig || ((...args) => fetch(...args));

  function obtenerToken() {
    try { return almacen.getItem(CLAVE_TOKEN) || ''; } catch { return ''; }
  }

  function nivelDeRespaldo() {
    try { return almacen.getItem(CLAVE_NIVEL) || NIVEL_POR_DEFECTO; } catch { return NIVEL_POR_DEFECTO; }
  }

  async function obtenerNivelCurricular() {
    const token = obtenerToken();
    if (token) {
      try {
        const respuesta = await enviar('/api/mi-sesion', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
        });
        if (respuesta.ok) {
          const datos = await respuesta.json();
          if (datos.nivel) {
            try { almacen.setItem(CLAVE_NIVEL, datos.nivel); } catch { /* respaldo best-effort */ }
            return datos.nivel;
          }
        }
      } catch { /* sin internet: cae al respaldo de abajo */ }
    }
    return nivelDeRespaldo();
  }

  const [todosLosNiveles, nivelCurricular] = await Promise.all([
    pedirConfig('./niveles.json').then((r) => r.json()).catch(() => ({})),
    obtenerNivelCurricular()
  ]);
  const config = todosLosNiveles[nivelCurricular] || todosLosNiveles[NIVEL_POR_DEFECTO];
  if (!config) {
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
    secuenciaModos: generarSecuenciaDeModos(config.contarRondas, config.compararRondas),
    indiceCompararForzado: entero(0, config.compararRondas), // cual ronda "comparar" (en orden de aparicion) es siempre igual
    compararVistos: 0,
    resultados: [],
    inicioMs: Date.now()
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

  function pantallaSinSesion() {
    mostrar(h(doc, 'section', { class: 'pantalla' },
      gato('normal', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: 'Primero entra a tu curso', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto', texto: 'Pídele a tu profesora que te ayude a entrar desde la pantalla principal.' }),
      h(doc, 'a', { class: 'boton', href: '/entrada/', texto: 'Ir a la entrada' })));
  }

  function barraDeVoz(repetir) {
    if (hayVozEspanol()) {
      return h(doc, 'button', { class: 'boton-voz', type: 'button', 'aria-label': 'Repetir la voz', onclick: repetir }, '🔊');
    }
    return h(doc, 'div', { class: 'aviso-sin-voz' },
      h(doc, 'span', { texto: 'Este aparato no tiene voz en español. El juego funciona igual.' }),
      h(doc, 'button', { class: 'boton-voz', type: 'button', 'aria-label': 'Repetir la voz', onclick: repetir }, '🔊'));
  }

  function jugarRonda() {
    const modo = estado.secuenciaModos[estado.indice];
    if (modo === 'contar') {
      const ronda = generarRondaContar(estado.indice + 1, estado.nivel, config);
      pintarContar(ronda, { intentos: 0, primerError: null, apoyoMostrado: false, tocados: new Set(), retoques: 0 });
    } else {
      const forzar = estado.compararVistos === estado.indiceCompararForzado;
      estado.compararVistos += 1;
      const ronda = generarRondaComparar(estado.indice + 1, estado.nivel, config, forzar);
      pintarComparar(ronda, { intentos: 0, primerError: null, apoyoMostrado: false });
    }
  }

  /* ------------------------------- contar ---------------------------- */

  function pintarContar(ronda, progreso) {
    const objetos = Array.from({ length: ronda.total }, (_, i) => i);

    const grilla = h(doc, 'div', { class: 'grilla-objetos' },
      objetos.map((i) => {
        const marcado = progreso.tocados.has(i);
        const caja = h(doc, 'button', {
          type: 'button', class: `objeto-boton${marcado ? ' objeto-boton--contado' : ''}`,
          'aria-label': marcado ? 'Ya contado' : 'Tocar para contar',
          onclick: () => tocarObjeto(ronda, progreso, i)
        });
        caja.innerHTML = marcado ? objetoContadoSVG(ronda.tema) : objetoSVG(ronda.tema);
        return caja;
      }));

    const listo = h(doc, 'button', { type: 'button', class: 'boton-listo', onclick: () => terminarDeContar(ronda, progreso) },
      gato('normal', 'gato-listo'), h(doc, 'span', { class: 'boton-listo-texto', texto: 'Listo' }));

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      grilla,
      listo,
      h(doc, 'p', { class: 'progreso', texto: `Ronda ${ronda.numero} de ${config.totalRondas}` })));
  }

  function tocarObjeto(ronda, progreso, i) {
    if (progreso.tocados.has(i)) {
      progreso.retoques += 1;
      return;
    }
    progreso.tocados.add(i);
    const n = progreso.tocados.size;
    decir(NUMERO_PALABRA[n] || String(n), { token: obtenerToken() });
    pintarContar(ronda, progreso);
  }

  function terminarDeContar(ronda, progreso) {
    pintarPreguntaContar(ronda, progreso);
  }

  function pintarPreguntaContar(ronda, progreso) {
    const botonesOpciones = ronda.opciones.map((op) =>
      h(doc, 'button', {
        class: 'boton-numero numero-grande', type: 'button',
        onclick: () => elegirOpcionContar(ronda, progreso, op)
      },
        h(doc, 'span', { texto: String(op.valor) }),
        config.puntos ? puntosDeNumero(op.valor) : null));

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      gato('normal', 'saludo-gato'),
      barraDeVoz(() => decir('¿Cuántas hay?', { clave: 'cuantas-hay' })),
      h(doc, 'div', { class: 'opciones opciones--contar' }, botonesOpciones),
      h(doc, 'p', { class: 'progreso', texto: `Ronda ${ronda.numero} de ${config.totalRondas}` })));

    decir('¿Cuántas hay?', { clave: 'cuantas-hay' });
  }

  /** Puntos tipo marco de diez, en filas de hasta 5 (0-10, el tope de NT1). */
  function puntosDeNumero(n) {
    const filas = [];
    for (let inicio = 0; inicio < n; inicio += 5) {
      const enEstaFila = Math.min(5, n - inicio);
      filas.push(h(doc, 'div', { class: 'fila-puntos' },
        Array.from({ length: enEstaFila }, () => h(doc, 'span', { class: 'punto' }))));
    }
    return h(doc, 'div', { class: 'patron-puntos', 'aria-hidden': 'true' }, filas);
  }

  function elegirOpcionContar(ronda, progreso, opcion) {
    const correcto = opcion.tipoError === null;
    if (correcto) {
      const primeraVez = progreso.intentos === 0;
      decir('¡Muy bien!', { clave: 'muy-bien' });
      estado.resultados.push({
        numero: ronda.numero, variante: `contar-${ronda.tema}`, nivel: ronda.nivel,
        correcto: primeraVez, usoApoyo: progreso.apoyoMostrado,
        tipoError: primeraVez ? null : progreso.primerError
      });
      ajustarNivel(primeraVez);
      siguienteRondaOFin();
      return;
    }

    progreso.intentos += 1;
    // Los errores de PROCESO (se salto uno, toco de mas) explican mejor el
    // fallo que cual numero eligio -- tienen prioridad sobre el tipo de la
    // opcion elegida.
    let tipo = opcion.tipoError;
    if (progreso.tocados.size < ronda.total) tipo = 'se_salto_alguno';
    else if (progreso.retoques > 0) tipo = 'toco_de_mas';
    if (!progreso.primerError) progreso.primerError = tipo;

    decir('¡Casi! Inténtalo de nuevo', { clave: 'casi-de-nuevo' });

    if (progreso.intentos >= 2 && !progreso.apoyoMostrado) {
      mostrarApoyoContar(ronda, progreso);
    } else {
      pintarPreguntaContar(ronda, progreso);
    }
  }

  function mostrarApoyoContar(ronda, progreso) {
    progreso.apoyoMostrado = true;
    const grilla = h(doc, 'div', { class: 'grilla-objetos grilla-objetos--apoyo' },
      Array.from({ length: ronda.total }, (_, i) => {
        const caja = h(doc, 'span', { class: 'objeto-boton', id: `apoyo-objeto-${i}` });
        caja.innerHTML = objetoSVG(ronda.tema);
        return caja;
      }));

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      gato('normal', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: 'Contemos juntos', tabindex: '-1', 'data-foco': '' }),
      grilla,
      h(doc, 'button', { class: 'boton', type: 'button', texto: 'Intentar de nuevo', onclick: () => pintarPreguntaContar(ronda, progreso) })));

    for (let i = 0; i < ronda.total; i += 1) {
      setTimeout(() => {
        const nodo = doc.getElementById(`apoyo-objeto-${i}`);
        if (nodo) { nodo.innerHTML = objetoContadoSVG(ronda.tema); nodo.classList.add('objeto-boton--contado'); }
        decir(NUMERO_PALABRA[i + 1] || String(i + 1), { token: obtenerToken() });
      }, i * 700);
    }
  }

  /* ------------------------------- comparar ---------------------------- */

  function grupoObjetos(cantidad, tema, esparcido) {
    return h(doc, 'div', { class: `grupo-objetos${esparcido ? ' grupo-objetos--esparcido' : ''}` },
      Array.from({ length: cantidad }, (_, i) => {
        const caja = h(doc, 'span', { class: 'objeto-boton objeto-boton--mini' });
        caja.innerHTML = objetoSVG(tema);
        return caja;
      }));
  }

  function pintarComparar(ronda, progreso) {
    const pregunta = ronda.pregunta === 'mas' ? '¿Dónde hay más?' : '¿Dónde hay menos?';
    const claveVoz = ronda.pregunta === 'mas' ? 'donde-hay-mas' : 'donde-hay-menos';

    const izquierda = h(doc, 'button', {
      type: 'button', class: 'opcion-comparar', 'aria-label': 'Grupo de la izquierda',
      onclick: () => elegirOpcionComparar(ronda, progreso, 'izquierda')
    }, grupoObjetos(ronda.a, ronda.tema, ronda.ladoEspaciado === 'izquierda'));

    const derecha = h(doc, 'button', {
      type: 'button', class: 'opcion-comparar', 'aria-label': 'Grupo de la derecha',
      onclick: () => elegirOpcionComparar(ronda, progreso, 'derecha')
    }, grupoObjetos(ronda.b, ronda.tema, ronda.ladoEspaciado === 'derecha'));

    const balanza = h(doc, 'button', {
      type: 'button', class: 'opcion-comparar opcion-comparar--balanza', 'aria-label': 'Son iguales',
      onclick: () => elegirOpcionComparar(ronda, progreso, 'balanza')
    });
    balanza.innerHTML = balanzaSVG();

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      gato('normal', 'saludo-gato'),
      barraDeVoz(() => decir(pregunta, { clave: claveVoz })),
      h(doc, 'div', { class: 'fila-comparar' }, izquierda, derecha),
      balanza,
      h(doc, 'p', { class: 'progreso', texto: `Ronda ${ronda.numero} de ${config.totalRondas}` })));

    decir(pregunta, { clave: claveVoz });
  }

  function elegirOpcionComparar(ronda, progreso, elegido) {
    const correcto = elegido === ronda.correctoLado;
    if (correcto) {
      const primeraVez = progreso.intentos === 0;
      decir('¡Muy bien!', { clave: 'muy-bien' });
      estado.resultados.push({
        numero: ronda.numero, variante: `comparar-${ronda.pregunta}`, nivel: ronda.nivel,
        correcto: primeraVez, usoApoyo: progreso.apoyoMostrado,
        tipoError: primeraVez ? null : progreso.primerError
      });
      ajustarNivel(primeraVez);
      siguienteRondaOFin();
      return;
    }

    progreso.intentos += 1;
    let tipo;
    if (elegido === 'balanza' || ronda.correctoLado === 'balanza') tipo = 'no_distingue_cantidad';
    else if (ronda.ladoEspaciado && elegido === ronda.ladoEspaciado) tipo = 'juzga_por_espacio';
    else tipo = 'confunde_mas_menos';
    if (!progreso.primerError) progreso.primerError = tipo;

    decir('¡Casi! Inténtalo de nuevo', { clave: 'casi-de-nuevo' });

    if (progreso.intentos >= 2 && !progreso.apoyoMostrado) {
      mostrarApoyoComparar(ronda, progreso);
    } else {
      pintarComparar(ronda, progreso);
    }
  }

  function mostrarApoyoComparar(ronda, progreso) {
    progreso.apoyoMostrado = true;
    const filas = Math.max(ronda.a, ronda.b);
    const pares = Array.from({ length: filas }, (_, i) => {
      const izq = i < ronda.a ? h(doc, 'span', { class: 'objeto-boton objeto-boton--mini' }) : h(doc, 'span', { class: 'objeto-hueco' });
      if (i < ronda.a) izq.innerHTML = objetoSVG(ronda.tema);
      const der = i < ronda.b ? h(doc, 'span', { class: 'objeto-boton objeto-boton--mini' }) : h(doc, 'span', { class: 'objeto-hueco' });
      if (i < ronda.b) der.innerHTML = objetoSVG(ronda.tema);
      return h(doc, 'div', { class: 'par-apoyo' }, izq, der);
    });

    const texto = ronda.a === ronda.b
      ? 'No sobra ninguno: son iguales'
      : ronda.a > ronda.b ? `Sobran ${ronda.a - ronda.b} del lado izquierdo` : `Sobran ${ronda.b - ronda.a} del lado derecho`;

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      gato('normal', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: 'Contemos juntos', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'div', { class: 'pares-apoyo' }, pares),
      barraDeVoz(() => decir(texto, { token: obtenerToken() })),
      h(doc, 'button', { class: 'boton', type: 'button', texto: 'Intentar de nuevo', onclick: () => pintarComparar(ronda, progreso) })));

    decir(texto, { token: obtenerToken() });
  }

  /* -------------------------------- comun ------------------------------- */

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

  function siguienteRondaOFin() {
    estado.indice += 1;
    if (estado.indice >= config.totalRondas) {
      terminarPartida();
    } else {
      jugarRonda();
    }
  }

  async function terminarPartida() {
    const correctos = estado.resultados.filter((r) => r.correcto).length;
    const duracionMs = Date.now() - estado.inicioMs;

    mostrar(h(doc, 'section', { class: 'pantalla-juego pantalla-juego--cierre' },
      gato('feliz', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: '¡Llenamos el cielo de estrellas!', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto texto--grande', texto: `Guarida jugó ${config.totalRondas} rondas contigo.` }),
      h(doc, 'p', { class: 'texto', texto: `Acertaste ${correctos} de ${config.totalRondas} a la primera.` }),
      barraDeVoz(() => decir('¡Llenamos el cielo de estrellas!', { clave: 'cierre-estrellas' })),
      h(doc, 'a', { class: 'boton', href: '/entrada/', texto: 'Volver' })));

    decir('¡Llenamos el cielo de estrellas!', { clave: 'cierre-estrellas' });

    const token = obtenerToken();
    if (!token) return;

    try {
      await enviar('/api/intentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, juegoId: 'guarida-cuenta-sus-estrellas', duracionMs, dispositivo: 'tablet',
          rondas: estado.resultados
        })
      });
    } catch {
      // Sin internet: se pierde este resultado, igual que en los otros 3
      // juegos. El cierre ya se mostro, no se bloquea al nino.
    }
  }

  if (!obtenerToken()) {
    pantallaSinSesion();
    return { estado };
  }

  jugarRonda();
  return { estado };
}

if (typeof document !== 'undefined') {
  const raiz = document.getElementById('mg-juego-raiz');
  if (raiz) iniciarJuego(raiz);
}
