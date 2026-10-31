/**
 * voz.js — voz compartida por los 3 minijuegos (antes vivia copiada en cada
 * juego.js). Tres fuentes de audio, en este orden:
 *
 *   1. decir(texto, { clave }) -- frase FIJA (animo, cierres: unas pocas,
 *      identicas siempre). Reproduce public/audio/frases/<clave>.mp3,
 *      grabado por la profesora. Si el archivo no existe o no carga, cae al
 *      paso 3.
 *   2. decir(texto, { token }) -- frase VARIABLE (preguntas/apoyos, cambian
 *      los numeros en cada ronda). Pide el audio a POST /api/voz
 *      (cloudflare/voz.mjs: Azure Speech + cache en R2). Si falla (sin
 *      internet, Azure caido, etc.), cae al paso 3.
 *   3. Voz sintetizada del navegador (speechSynthesis), con prioridad
 *      es-CL > es-419/es-US/es-MX "Natural"/"Online" > cualquier otra es-*.
 *      Ultimo respaldo: el juego sigue siendo jugable aunque todo lo demas
 *      falle.
 *
 * decir(texto) sin opciones va directo al paso 3 (compatibilidad con los
 * pocos lugares que no necesitan audio pregenerado).
 */

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
}

let audioActual = null;

function detenerAudioActual() {
  if (audioActual) {
    try { audioActual.pause(); } catch { /* nada que detener */ }
    audioActual = null;
  }
  try { window.speechSynthesis?.cancel(); } catch { /* sin speechSynthesis */ }
}

function esNaturalOnline(voz) {
  return /natural|online/i.test(voz.name || '');
}

export function elegirVoz() {
  if (!('speechSynthesis' in window)) return null;
  const voces = window.speechSynthesis.getVoices();
  if (!voces.length) return null;

  const esCL = voces.find((v) => (v.lang || '').toLowerCase() === 'es-cl');
  if (esCL) return esCL;

  const preferidos = ['es-419', 'es-us', 'es-mx'];
  const candidatas = voces.filter((v) => preferidos.includes((v.lang || '').toLowerCase()));
  const natural = candidatas.find(esNaturalOnline);
  if (natural) return natural;
  if (candidatas.length) return candidatas[0];

  return voces.find((v) => (v.lang || '').toLowerCase().startsWith('es')) || null;
}

export function hayVozEspanol() {
  try {
    return elegirVoz() !== null;
  } catch {
    return false;
  }
}

/** Ultimo respaldo: sintetiza texto completo (nunca a pedazos, suena mal). */
function hablarSintetizado(texto) {
  try {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(texto);
    const voz = elegirVoz();
    if (voz) u.voice = voz;
    u.lang = voz ? voz.lang : 'es-CL';
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  } catch { /* sin voz disponible: el juego sigue siendo jugable en silencio */ }
}

function reproducirClip(url, texto) {
  try {
    const audio = new Audio(url);
    audioActual = audio;
    audio.addEventListener('error', () => hablarSintetizado(texto));
    audio.play().catch(() => hablarSintetizado(texto));
  } catch {
    hablarSintetizado(texto);
  }
}

async function reproducirClipRemoto(texto, token) {
  try {
    const respuesta = await fetch('/api/voz', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ texto, token })
    });
    if (!respuesta.ok) return hablarSintetizado(texto);
    const blob = await respuesta.blob();
    reproducirClip(URL.createObjectURL(blob), texto);
  } catch {
    hablarSintetizado(texto);
  }
}

export function decir(texto, opciones = {}) {
  detenerAudioActual();
  const { clave, token } = opciones;
  if (clave) return reproducirClip(`/audio/frases/${clave}.mp3`, texto);
  if (token) return reproducirClipRemoto(texto, token);
  hablarSintetizado(texto);
}
