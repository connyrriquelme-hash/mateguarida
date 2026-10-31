/**
 * pin.mjs
 * PIN de estudiante: PBKDF2-SHA256, igual que Lectoguarida (cloudflare/worker.mjs).
 * Un perfil sin pinHash entra solo eligiendo su nombre; la profesora le pone
 * PIN desde el panel a quien lo necesite (eso lo hace la etapa 3, el panel
 * docente). Aqui solo viven las funciones de hash, para poder probarlas solas.
 */

const ITERACIONES = 100000;

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const limpio = String(hex || "");
  const out = new Uint8Array(limpio.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(limpio.substr(i * 2, 2), 16);
  return out;
}

export function generarSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

export async function derivarPinHash(pin, saltHex) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(pin)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations: ITERACIONES },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function crearPin(pin) {
  const saltHex = generarSalt();
  const hash = await derivarPinHash(pin, saltHex);
  return { pinSalt: saltHex, pinHash: hash };
}

export async function pinCoincide(pin, saltHex, hashEsperado) {
  if (!saltHex || !hashEsperado) return false;
  const hash = await derivarPinHash(pin, saltHex);
  return hash === hashEsperado;
}
