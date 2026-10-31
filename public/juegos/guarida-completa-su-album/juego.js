/**
 * juego.js — "Guarida completa su álbum"
 * Adición y sustracción 0-100 con estrategias de cálculo mental
 * (MA02-OA-09, MA02-OA-06) y unidades/decenas (MA02-OA-07), ver
 * data/juegos-oa.json. "Álbum de láminas" es un termino generico, no una
 * marca: sobres de 10 láminas (decenas) y láminas sueltas (unidades).
 *
 * Una partida = 9 rondas. Niveles 1-3: un solo paso, 'juntar' (suma) o
 * 'regalar' (resta), con el rango y la mezcla sobres/sueltas creciendo por
 * nivel. Nivel 4 mezcla tres variantes al azar:
 *   - arma_numero:  dado un total, ¿cuántos sobres completos (o cuántas
 *                   sueltas) tiene? (MA02-OA-07 directo)
 *   - dos_pasos:    consigue B, luego regala C, en la misma ronda.
 *   - intercambio:  tiene R repetidas, intercambia K, ¿cuántas repetidas
 *                   le quedan?
 *
 * Sube de nivel tras 2 rondas acertadas a la primera seguidas; baja tras 2
 * rondas falladas seguidas (nunca tras una sola) -- mismo criterio que los
 * otros dos juegos.
 *
 * Distractores diagnosticos (3 tipos, no al azar):
 *   - opera_al_reves:            suma en vez de restar, o al reves.
 *   - no_completa_decena:        se equivoca en la decena (+/-10, o +/-1
 *                                en arma_numero).
 *   - confunde_sobres_y_sueltas: invierte decenas y unidades del
 *                                resultado (o responde sueltas cuando se
 *                                pedian sobres, y viceversa).
 *
 * Apoyo: si el nino falla 2 veces la misma ronda, aparece el desglose
 * completo en sobres y laminas sueltas, paso a paso, con voz.
 *
 * Voz: igual que los otros dos juegos -- speechSynthesis (es-CL), aviso
 * discreto si el aparato no tiene voz en español, y boton para repetirla.
 */

import { h } from '../../entrada/dom.js';
import { gatoSVG } from '../../entrada/mascota.js';
import { sobreSVG, laminaSVG, laminaRepetidaSVG } from './lamina.js';
import { CLAVE_TOKEN } from '../../entrada/api.js';

const TOTAL_RONDAS = 9;
const RONDAS_PARA_SUBIR = 2;
const RONDAS_PARA_BAJAR = 2;

/* ------------------------------ utilidades -------------------------------- */

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

/** Intercambia la decena y la unidad de un numero (47 -> 74). */
function invertirDigitos(n) {
  const decenas = Math.floor(n / 10);
  const unidades = n % 10;
  return unidades * 10 + decenas;
}

function crearValorUnico() {
  const vistos = new Set();
  return (candidato) => {
    let v = Math.max(0, Math.round(candidato));
    let vueltas = 0;
    while (vistos.has(v)) {
      v = Math.max(0, candidato + (vueltas % 2 === 0 ? 1 : -1) * (Math.floor(vueltas / 2) + 1));
      vueltas += 1;
      if (vueltas > 20) break;
    }
    vistos.add(v);
    return v;
  };
}

/* --------------------------- generar una ronda ---------------------------- */

function generarDirecto(numero, nivel, tipo) {
  let a; let b;
  if (nivel === 1) {
    a = entero(1, 6) * 10; // 10-50
    b = entero(1, 6) * 10; // 10-50
  } else if (nivel === 2) {
    a = entero(1, 20) * 5; // 5-95
    b = entero(1, 20) * 5;
  } else {
    a = entero(5, 96); // 5-95
    b = entero(1, 51); // 1-50
  }

  let correcto;
  if (tipo === 'juntar') {
    // clamp directo, no division: dividir a la mitad puede quedar pegado en
    // b=1 cuando a ya esta muy cerca de 100 (ej. a=100 en nivel 2).
    if (a + b > 100) b = Math.max(1, 100 - a);
    correcto = a + b;
  } else {
    if (b > a) { const t = a; a = b; b = t; }
    if (a === b) a = Math.min(100, a + 5);
    correcto = a - b;
  }

  const valorUnico = crearValorUnico();
  valorUnico(correcto);
  const operaAlReves = tipo === 'juntar' ? Math.abs(a - b) : a + b;
  const opciones = mezclar([
    { valor: correcto, tipoError: null },
    { valor: valorUnico(operaAlReves), tipoError: 'opera_al_reves' },
    { valor: valorUnico(correcto >= 10 ? correcto - 10 : correcto + 10), tipoError: 'no_completa_decena' },
    { valor: valorUnico(invertirDigitos(correcto)), tipoError: 'confunde_sobres_y_sueltas' }
  ]);

  return { numero, modo: tipo, nivel, a, b, correcto, opciones };
}

function generarDosPasos(numero, nivel) {
  const a = entero(5, 41);
  let b = entero(5, 31);
  if (a + b > 100) b = 100 - a;
  const intermedio = a + b;
  const c = entero(1, Math.min(intermedio, 30) + 1);
  const correcto = intermedio - c;

  const valorUnico = crearValorUnico();
  valorUnico(correcto);
  const opciones = mezclar([
    { valor: correcto, tipoError: null },
    { valor: valorUnico(a + b + c), tipoError: 'opera_al_reves' },
    { valor: valorUnico(correcto >= 10 ? correcto - 10 : correcto + 10), tipoError: 'no_completa_decena' },
    { valor: valorUnico(invertirDigitos(correcto)), tipoError: 'confunde_sobres_y_sueltas' }
  ]);

  return { numero, modo: 'dos_pasos', nivel, a, b, c, intermedio, correcto, opciones };
}

function generarIntercambio(numero, nivel) {
  const repetidas = entero(3, 16);
  const intercambia = entero(1, repetidas + 1);
  const correcto = repetidas - intercambia;

  const valorUnico = crearValorUnico();
  valorUnico(correcto);
  const opciones = mezclar([
    { valor: correcto, tipoError: null },
    { valor: valorUnico(repetidas + intercambia), tipoError: 'opera_al_reves' },
    { valor: valorUnico(correcto >= 10 ? correcto - 10 : correcto + 10), tipoError: 'no_completa_decena' },
    { valor: valorUnico(invertirDigitos(correcto)), tipoError: 'confunde_sobres_y_sueltas' }
  ]);

  return { numero, modo: 'intercambio', nivel, repetidas, intercambia, correcto, opciones };
}

function generarArmaNumero(numero, nivel) {
  const total = entero(10, 101);
  const sobresReal = Math.floor(total / 10);
  const sueltasReal = total % 10;
  const pregunta = elegir(['sobres', 'sueltas']);
  const correcto = pregunta === 'sobres' ? sobresReal : sueltasReal;
  const otroValor = pregunta === 'sobres' ? sueltasReal : sobresReal;

  const valorUnico = crearValorUnico();
  valorUnico(correcto);
  const opciones = mezclar([
    { valor: correcto, tipoError: null },
    { valor: valorUnico(otroValor), tipoError: 'confunde_sobres_y_sueltas' },
    { valor: valorUnico(Math.max(0, correcto - 1)), tipoError: 'no_completa_decena' },
    { valor: valorUnico(correcto + 1), tipoError: 'opera_al_reves' }
  ]);

  return { numero, modo: 'arma_numero', nivel, total, sobresReal, sueltasReal, pregunta, correcto, opciones };
}

function generarRonda(numero, nivel, tipoBase) {
  if (nivel < 4) return generarDirecto(numero, nivel, tipoBase);
  const variante4 = elegir(['arma_numero', 'dos_pasos', 'intercambio']);
  if (variante4 === 'arma_numero') return generarArmaNumero(numero, nivel);
  if (variante4 === 'dos_pasos') return generarDosPasos(numero, nivel);
  return generarIntercambio(numero, nivel);
}

function generarSecuenciaDeTipos() {
  // 5 'juntar' y 4 'regalar' (no hay un tercero natural como en los otros
  // juegos), mezclados. Solo se usan en nivel 1-3; en nivel 4 se ignoran.
  return mezclar(['juntar', 'juntar', 'juntar', 'juntar', 'juntar', 'regalar', 'regalar', 'regalar', 'regalar']);
}

/* -------------------------------- audio ---------------------------------- */

function hayVozEspanol() {
  try {
    if (!('speechSynthesis' in window)) return false;
    const voces = window.speechSynthesis.getVoices();
    return voces.some((v) => v.lang && v.lang.toLowerCase().startsWith('es'));
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
}

function decir(texto) {
  try {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-CL';
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* sin voz disponible: el juego sigue siendo jugable en silencio */ }
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
    tiposPendientes: generarSecuenciaDeTipos(),
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

  /** sobres + laminas sueltas de una cantidad, como fila visual. */
  function visualCantidad(cantidad) {
    const sobres = Math.floor(cantidad / 10);
    const sueltas = cantidad % 10;
    const piezas = [];
    for (let i = 0; i < sobres; i += 1) {
      const c = h(doc, 'span', { class: 'pieza-sobre' });
      c.innerHTML = sobreSVG();
      piezas.push(c);
    }
    for (let i = 0; i < sueltas; i += 1) {
      const c = h(doc, 'span', { class: 'pieza-lamina' });
      c.innerHTML = laminaSVG();
      piezas.push(c);
    }
    return h(doc, 'div', { class: 'album-visual' }, piezas);
  }

  function visualRepetidas(cantidad) {
    const piezas = [];
    for (let i = 0; i < cantidad; i += 1) {
      const c = h(doc, 'span', { class: 'pieza-lamina' });
      c.innerHTML = laminaRepetidaSVG();
      piezas.push(c);
    }
    return h(doc, 'div', { class: 'album-visual' }, piezas);
  }

  function jugarRonda() {
    const tipo = estado.tiposPendientes[estado.indice % estado.tiposPendientes.length];
    const ronda = generarRonda(estado.indice + 1, estado.nivel, tipo);
    pintarRonda(ronda, { intentos: 0, primerError: null, apoyoMostrado: false });
  }

  function textoPregunta(ronda) {
    if (ronda.modo === 'juntar') return `Guarida tiene ${ronda.a} láminas y consigue ${ronda.b} más. ¿Cuántas tiene ahora?`;
    if (ronda.modo === 'regalar') return `Guarida tiene ${ronda.a} láminas y regala ${ronda.b}. ¿Cuántas le quedan?`;
    if (ronda.modo === 'dos_pasos') return `Guarida tiene ${ronda.a} láminas, consigue ${ronda.b} más y después regala ${ronda.c}. ¿Cuántas tiene al final?`;
    if (ronda.modo === 'intercambio') return `Guarida tiene ${ronda.repetidas} láminas repetidas e intercambia ${ronda.intercambia}. ¿Cuántas repetidas le quedan?`;
    return ronda.pregunta === 'sobres'
      ? `Guarida tiene ${ronda.total} láminas. ¿Cuántos sobres completos de 10 puede armar?`
      : `Guarida tiene ${ronda.total} láminas. ¿Cuántas quedan sueltas, sin alcanzar para un sobre?`;
  }

  function visualDeRonda(ronda) {
    if (ronda.modo === 'intercambio') return visualRepetidas(ronda.repetidas);
    if (ronda.modo === 'arma_numero') return visualCantidad(ronda.total);
    return visualCantidad(ronda.a); // juntar / regalar / dos_pasos: la cantidad inicial
  }

  function pintarRonda(ronda, progreso) {
    const avisoAviso = h(doc, 'p', { class: 'error', role: 'alert', 'data-aviso': '' });

    const botonesOpciones = ronda.opciones.map((op) =>
      h(doc, 'button', {
        class: 'boton-salto numero-grande', type: 'button', texto: String(op.valor),
        onclick: () => elegirOpcion(ronda, progreso, op)
      })
    );

    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      h(doc, 'p', { class: 'escena-etiqueta', texto: 'El álbum de láminas' }),
      visualDeRonda(ronda),
      h(doc, 'p', { class: 'texto', texto: textoPregunta(ronda) }),
      barraDeVoz(() => decir(textoPregunta(ronda))),
      avisoAviso,
      h(doc, 'div', { class: 'opciones' }, botonesOpciones),
      h(doc, 'p', { class: 'progreso', texto: `Ronda ${ronda.numero} de ${TOTAL_RONDAS}` })));

    decir(textoPregunta(ronda));
  }

  function textoApoyo(ronda) {
    if (ronda.modo === 'juntar') return `${ronda.a} más ${ronda.b} es ${ronda.correcto}.`;
    if (ronda.modo === 'regalar') return `${ronda.a} menos ${ronda.b} es ${ronda.correcto}.`;
    if (ronda.modo === 'dos_pasos') return `${ronda.a} más ${ronda.b} es ${ronda.intermedio}. ${ronda.intermedio} menos ${ronda.c} es ${ronda.correcto}.`;
    if (ronda.modo === 'intercambio') return `${ronda.repetidas} menos ${ronda.intercambia} es ${ronda.correcto}.`;
    return ronda.pregunta === 'sobres'
      ? `${ronda.total} tiene ${ronda.sobresReal} sobres completos y ${ronda.sueltasReal} sueltas.`
      : `${ronda.total} tiene ${ronda.sobresReal} sobres completos y ${ronda.sueltasReal} sueltas.`;
  }

  function pistaDecena(ronda) {
    if (ronda.nivel !== 3 || ronda.modo === 'arma_numero') return null;
    const a = ronda.a ?? ronda.repetidas;
    const b = ronda.b ?? ronda.intercambia;
    if (a === undefined || b === undefined) return null;
    const faltaParaDecena = 10 - (a % 10);
    if (ronda.modo === 'juntar' && faltaParaDecena > 0 && faltaParaDecena <= b) {
      return h(doc, 'p', { class: 'texto', texto: `Atajo: a ${a} le faltan ${faltaParaDecena} para completar la decena.` });
    }
    return null;
  }

  function mostrarApoyo(ronda, progreso, despues) {
    const texto = textoApoyo(ronda);
    mostrar(h(doc, 'section', { class: 'pantalla-juego' },
      gato('normal', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: 'Contemos juntos', tabindex: '-1', 'data-foco': '' }),
      visualDeRonda(ronda),
      h(doc, 'p', { class: 'texto texto--grande numero-grande', texto }),
      pistaDecena(ronda),
      barraDeVoz(() => decir(texto)),
      h(doc, 'button', { class: 'boton', type: 'button', texto: 'Intentar de nuevo', onclick: despues })));

    decir(texto);
    progreso.apoyoMostrado = true;
  }

  function elegirOpcion(ronda, progreso, opcion) {
    if (opcion.tipoError === null) {
      const primeraVez = progreso.intentos === 0;
      decir('¡Muy bien!');
      estado.resultados.push({
        numero: ronda.numero, variante: `${ronda.modo}-nivel${ronda.nivel}`, nivel: ronda.nivel,
        correcto: primeraVez, usoApoyo: progreso.apoyoMostrado,
        tipoError: primeraVez ? null : progreso.primerError
      });
      ajustarNivel(primeraVez);
      siguienteRondaOFin();
      return;
    }

    progreso.intentos += 1;
    if (!progreso.primerError) progreso.primerError = opcion.tipoError;
    decir('Intenta otra vez');
    const aviso = raiz.querySelector('[data-aviso]');
    if (aviso) aviso.textContent = 'Casi. Fíjate en los sobres y en las láminas sueltas.';

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
    const texto = `Guarida avanzó ${TOTAL_RONDAS} páginas del álbum contigo. Acertaste ${correctos} de ${TOTAL_RONDAS} a la primera.`;

    mostrar(h(doc, 'section', { class: 'pantalla-juego pantalla-juego--cierre' },
      gato('feliz', 'saludo-gato'),
      h(doc, 'h1', { class: 'titulo', texto: '¡El álbum avanzó!', tabindex: '-1', 'data-foco': '' }),
      h(doc, 'p', { class: 'texto texto--grande', texto: `Guarida avanzó ${TOTAL_RONDAS} páginas contigo.` }),
      h(doc, 'p', { class: 'texto', texto: `Acertaste ${correctos} de ${TOTAL_RONDAS} a la primera.` }),
      barraDeVoz(() => decir(texto)),
      h(doc, 'a', { class: 'boton', href: '/entrada/', texto: 'Volver' })));

    decir('¡El álbum avanzó!');

    const token = obtenerToken();
    if (!token) return;

    try {
      await enviar('/api/intentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, juegoId: 'guarida-completa-su-album', duracionMs, dispositivo: 'tablet',
          rondas: estado.resultados
        })
      });
    } catch {
      // Sin internet: se pierde este resultado, igual que en los otros 2
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
