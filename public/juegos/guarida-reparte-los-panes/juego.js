/**
 * juego.js — "Guarida reparte los panes"
 * Multiplicación como suma de sumandos iguales, tablas del 2, 5 y 10
 * (MA02-OA-11, ver data/juegos-oa.json). Alcance completo: el OA solo pide
 * estas tres tablas, y es exactamente lo que trabaja este juego.
 *
 * Guarida trabaja en la panadería repartiendo marraquetas y hallullas (el
 * tipo de pan se elige al azar por ronda, puro contexto visual) en bolsas
 * iguales. Una partida = 9 rondas (3 de cada tabla, mezcladas). 4 niveles:
 *
 *   nivel 1  hasta 5 bolsas (tabla hasta x5)
 *   nivel 2  hasta 10 bolsas (tabla completa), representacion agrupada
 *   nivel 3  hasta 10 bolsas + pista de distributividad en el apoyo
 *   nivel 4  inverso: dado el total y cuanto trae cada bolsa, ¿cuantas
 *            bolsas hay? (puente hacia la division, sin evaluarla como OA
 *            aparte). La variante "bolsa misteriosa" (incognita en cuanto
 *            trae cada bolsa) queda pendiente para una iteracion futura:
 *            se prefirio no improvisarla a ultima hora.
 *
 * Sube de nivel tras 2 rondas acertadas a la primera seguidas; baja tras 2
 * rondas falladas seguidas (nunca tras una sola) -- mismo criterio que
 * "Guarida salta los techos".
 *
 * Distractores diagnosticos (3 tipos, no al azar):
 *   - suma_en_vez_de_multiplicar: bolsas + panes por bolsa, en vez de
 *     multiplicar.
 *   - tabla_equivocada: usa una de las otras dos tablas (2/5/10).
 *   - conteo_parcial: responde como si solo hubiera una bolsa (cuenta una
 *     y se detiene).
 *
 * Apoyo: si el nino falla 2 veces la misma ronda, aparecen todas las
 * bolsas con todos los panes (conteo concreto completo), contados de a
 * "panes por bolsa" en voz alta.
 *
 * Voz: igual que los techos -- speechSynthesis (es-CL), aviso discreto si
 * el aparato no tiene voz en español, y un boton para repetirla.
 */

import { h } from '../../entrada/dom.js';
import { gatoSVG } from '../../entrada/mascota.js';
import { panSVG, TIPOS_PAN } from './pan.js';
import { CLAVE_TOKEN } from '../../entrada/api.js';
import { decir, hayVozEspanol } from '../../entrada/voz.js';

const TOTAL_RONDAS = 9;
const RONDAS_PARA_SUBIR = 2;
const RONDAS_PARA_BAJAR = 2;
const TABLAS = ['2', '5', '10'];
const COLORES_BOLSA = ['naranja', 'rosado', 'verde', 'morado', 'amarillo', 'azul'];

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

function maximoBolsas(nivel) {
  return nivel <= 1 ? 5 : 10;
}

/** { correcto, opciones: [{valor, tipoError|null}], ... } */
function generarRonda(numero, nivel, tabla) {
  const panesPorBolsa = Number(tabla);
  const tipoPan = elegir(TIPOS_PAN);
  const otraTabla = Number(elegir(TABLAS.filter((t) => t !== tabla)));

  const valores = new Set();
  function valorUnico(candidato) {
    let v = Math.max(0, candidato);
    let vueltas = 0;
    while (valores.has(v)) {
      v = Math.max(0, candidato + (vueltas % 2 === 0 ? 1 : -1) * (Math.floor(vueltas / 2) + 1));
      vueltas += 1;
      if (vueltas > 20) break;
    }
    valores.add(v);
    return v;
  }

  if (nivel <= 3) {
    const bolsas = entero(1, maximoBolsas(nivel) + 1);
    const correcto = valorUnico(bolsas * panesPorBolsa);
    const opciones = mezclar([
      { valor: correcto, tipoError: null },
      { valor: valorUnico(bolsas + panesPorBolsa), tipoError: 'suma_en_vez_de_multiplicar' },
      { valor: valorUnico(bolsas * otraTabla), tipoError: 'tabla_equivocada' },
      { valor: valorUnico(panesPorBolsa), tipoError: 'conteo_parcial' }
    ]);
    return { numero, modo: 'directo', tabla, panesPorBolsa, bolsas, tipoPan, nivel, correcto, opciones };
  }

  // Nivel 4: inverso. Dado el total y cuanto trae cada bolsa, ¿cuantas bolsas hay?
  const bolsasReal = entero(1, maximoBolsas(4) + 1);
  const total = bolsasReal * panesPorBolsa;
  const correcto = valorUnico(bolsasReal);
  const vecinoBolsas = bolsasReal > 1 ? bolsasReal - 1 : bolsasReal + 1;
  const opciones = mezclar([
    { valor: correcto, tipoError: null },
    { valor: valorUnico(Math.max(0, total - panesPorBolsa)), tipoError: 'suma_en_vez_de_multiplicar' },
    { valor: valorUnico(Math.max(1, Math.round(total / otraTabla))), tipoError: 'tabla_equivocada' },
    { valor: valorUnico(vecinoBolsas), tipoError: 'conteo_parcial' }
  ]);
  return { numero, modo: 'inverso', tabla, panesPorBolsa, bolsas: bolsasReal, total, tipoPan, nivel, correcto, opciones };
}

function generarSecuenciaDeTablas() {
  // 3 de cada tabla, en orden mezclado, no 3-3-3 seguidas.
  return mezclar([...TABLAS, ...TABLAS, ...TABLAS]);
}


/* --------------------------------- juego ---------------------------------- */

export function iniciarJuego(raiz, deps = {}) {
  const doc = raiz.ownerDocument;
  const almacen = deps.almacen || window.localStorage;
  const enviar = deps.enviar || ((...args) => fetch(...args));

  const estado = {
    nivel: 1,
    aciertosSeguidos: 0,
    erroresSeguidos: 0,
    indice: 0,
    tablasPendientes: generarSecuenciaDeTablas(),
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

  function barraDeVoz(repetir) {
    if (hayVozEspanol()) {
      return h(doc, 'button', { class: 'boton-voz', type: 'button', 'aria-label': 'Repetir la voz', onclick: repetir }, '🔊');
    }
    return h(doc, 'div', { class: 'aviso-sin-voz' },
      h(doc, 'span', { texto: 'Este aparato no tiene voz en español. El juego funciona igual.' }),
      h(doc, 'button', { class: 'boton-voz', type: 'button', 'aria-label': 'Repetir la voz', onclick: repetir }, '🔊'));
  }

  function jugarRonda() {
    const tabla = estado.tablasPendientes[estado.indice];
    const ronda = generarRonda(estado.indice + 1, estado.nivel, tabla);
    pintarRonda(ronda, { intentos: 0, primerError: null, apoyoMostrado: false });
  }

  function nombrePan(tipoPan, plural) {
    if (tipoPan === 'hallulla') return plural ? 'hallullas' : 'hallulla';
    return plural ? 'marraquetas' : 'marraqueta';
  }

  function bolsaVisual(ronda, color) {
    return h(doc, 'div', { class: `bolsa bolsa--${color}` },
      (() => { const c = h(doc, 'span', { class: 'bolsa-pan' }); c.innerHTML = panSVG(ronda.tipoPan); return c; })(),
      h(doc, 'span', { class: 'bolsa-cantidad numero-grande', texto: `×${ronda.panesPorBolsa}` }));
  }

  function textoPregunta(ronda) {
    if (ronda.modo === 'inverso') {
      return `Guarida tiene ${ronda.total} ${nombrePan(ronda.tipoPan, true)} para repartir en bolsas de ${ronda.panesPorBolsa}. ¿Cuántas bolsas necesita?`;
    }
    return `¿Cuántas ${nombrePan(ronda.tipoPan, true)} hay en total?`;
  }

  function pintarRonda(ronda, progreso) {
    const avisoAviso = h(doc, 'p', { class: 'error', role: 'alert', 'data-aviso': '' });

    const panaderia = ronda.modo === 'inverso'
      ? h(doc, 'div', { class: 'panaderia panaderia--inverso' },
          (() => { const c = h(doc, 'span', { class: 'pan-grande' }); c.innerHTML = panSVG(ronda.tipoPan); return c; })(),
          h(doc, 'p', { class: 'numero-grande texto--grande', texto: `${ronda.total} ${nombrePan(ronda.tipoPan, true)}` }),
          h(doc, 'p', { class: 'texto', texto: `en bolsas de ${ronda.panesPorBolsa}` }))
      : h(doc, 'div', { class: 'panaderia' },
          Array.from({ length: ronda.bolsas }, (_, i) => bolsaVisual(ronda, COLORES_BOLSA[i % COLORES_BOLSA.length])));

    const botonesOpciones = ronda.opciones.map((op) =>
      h(doc, 'button', {
        class: 'boton-salto numero-grande', type: 'button', texto: String(op.valor),
        onclick: () => elegirOpcion(ronda, progreso, op)
      })
    );

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      h(doc, 'p', { class: 'escena-etiqueta', texto: `La panadería · tabla del ${ronda.tabla}` }),
      ronda.modo === 'directo' ? h(doc, 'p', { class: 'texto', texto: `${ronda.bolsas} ${ronda.bolsas === 1 ? 'bolsa' : 'bolsas'} de ${nombrePan(ronda.tipoPan, true)}` }) : null,
      panaderia,
      h(doc, 'p', { class: 'texto', texto: textoPregunta(ronda) }),
      barraDeVoz(() => decir(textoPregunta(ronda), { token: obtenerToken() })),
      avisoAviso,
      h(doc, 'div', { class: 'opciones' }, botonesOpciones),
      h(doc, 'p', { class: 'progreso', texto: `Ronda ${ronda.numero} de ${TOTAL_RONDAS}` })));

    decir(textoPregunta(ronda), { token: obtenerToken() });
  }

  function mostrarApoyo(ronda, progreso, despues) {
    const filas = Array.from({ length: ronda.bolsas }, (_, i) =>
      h(doc, 'div', { class: 'grupo-apoyo' },
        Array.from({ length: ronda.panesPorBolsa }, () => {
          const c = h(doc, 'span', { class: 'pan-chico' });
          c.innerHTML = panSVG(ronda.tipoPan);
          return c;
        })));

    const pista = ronda.nivel === 3 && ronda.bolsas > 2
      ? h(doc, 'p', { class: 'texto', texto: `${ronda.bolsas} bolsas de ${ronda.panesPorBolsa} es lo mismo que ${Math.floor(ronda.bolsas / 2)} bolsas más ${ronda.bolsas - Math.floor(ronda.bolsas / 2)} bolsas.` })
      : null;

    const texto = ronda.modo === 'inverso'
      ? `${ronda.bolsas} bolsas de ${ronda.panesPorBolsa} son ${ronda.total} ${nombrePan(ronda.tipoPan, true)}.`
      : `${ronda.bolsas} veces ${ronda.panesPorBolsa} es ${ronda.correcto}.`;

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      gato('normal', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: 'Contemos juntos', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto', texto: `Cada bolsa tiene ${ronda.panesPorBolsa} ${nombrePan(ronda.tipoPan, true)}.` }),
      h(doc, 'div', { class: 'grupos-apoyo' }, filas),
      h(doc, 'p', { class: 'texto texto--grande numero-grande', texto }),
      pista,
      barraDeVoz(() => decir(texto, { token: obtenerToken() })),
      h(doc, 'button', { class: 'boton', type: 'button', texto: 'Intentar de nuevo', onclick: despues })));

    decir(texto, { token: obtenerToken() });
    progreso.apoyoMostrado = true;
  }

  function elegirOpcion(ronda, progreso, opcion) {
    if (opcion.tipoError === null) {
      const primeraVez = progreso.intentos === 0;
      decir('¡Muy bien!', { clave: 'muy-bien' });
      estado.resultados.push({
        numero: ronda.numero, variante: `${ronda.tabla}-${ronda.modo}`, nivel: ronda.nivel,
        correcto: primeraVez, usoApoyo: progreso.apoyoMostrado,
        tipoError: primeraVez ? null : progreso.primerError
      });
      ajustarNivel(primeraVez);
      siguienteRondaOFin();
      return;
    }

    progreso.intentos += 1;
    if (!progreso.primerError) progreso.primerError = opcion.tipoError;
    decir('¡Casi! Inténtalo de nuevo', { clave: 'casi-de-nuevo' });
    const aviso = raiz.querySelector('[data-aviso]');
    if (aviso) aviso.textContent = 'Casi. Cuenta cuántas bolsas hay y qué cantidad trae cada una.';

    if (progreso.intentos >= 2 && !progreso.apoyoMostrado) {
      mostrarApoyo(ronda, progreso, () => pintarRonda(ronda, progreso));
    }
  }

  function ajustarNivel(acerto) {
    if (acerto) {
      estado.aciertosSeguidos += 1;
      estado.erroresSeguidos = 0;
      if (estado.aciertosSeguidos >= RONDAS_PARA_SUBIR && estado.nivel < 4) {
        estado.nivel += 1;
        estado.aciertosSeguidos = 0;
      }
    } else {
      estado.erroresSeguidos += 1;
      estado.aciertosSeguidos = 0;
      if (estado.erroresSeguidos >= RONDAS_PARA_BAJAR && estado.nivel > 1) {
        estado.nivel -= 1;
        estado.erroresSeguidos = 0;
      }
    }
  }

  function siguienteRondaOFin() {
    estado.indice += 1;
    if (estado.indice >= TOTAL_RONDAS) {
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
      h(doc, 'h1', { class: 'titulo', texto: '¡Panadería lista!', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto texto--grande', texto: `Guarida repartió ${TOTAL_RONDAS} bolsas contigo.` }),
      h(doc, 'p', { class: 'texto', texto: `Acertaste ${correctos} de ${TOTAL_RONDAS} a la primera.` }),
      barraDeVoz(() => decir('¡Panadería lista!', { clave: 'cierre-panes' })),
      h(doc, 'a', { class: 'boton', href: '/entrada/', texto: 'Volver' })));

    decir('¡Panadería lista!', { clave: 'cierre-panes' });

    const token = obtenerToken();
    if (!token) return;

    try {
      await enviar('/api/intentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, juegoId: 'guarida-reparte-los-panes', duracionMs, dispositivo: 'tablet',
          rondas: estado.resultados
        })
      });
    } catch {
      // Sin internet: se pierde este resultado, igual que en los techos.
      // El cierre ya se mostro, no se bloquea al nino.
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
