/**
 * codigos.mjs
 * Generador y validador del codigo de entrada de un curso.
 * Formato: PALABRA-NNL (una palabra, dos digitos, una letra), ej. VERDE-47K.
 * Las letras excluyen I y O (se confunden con 1 y 0 al escribirlas a mano en
 * una tablet). No es un secreto fuerte -- lo complementa el limite de
 * intentos por IP (cloudflare/limitador.mjs) -- pero tampoco debe ser facil
 * de adivinar a la primera.
 */

const PALABRAS = [
  "ROJO", "AZUL", "VERDE", "AMARILLO", "NARANJA", "MORADO", "ROSADO",
  "CAFE", "GRIS", "NEGRO", "BLANCO", "CELESTE", "VIOLETA", "DORADO",
  "PLATEADO", "TURQUESA", "CORAL", "OLIVO", "LIMON", "CEREZA"
];

const LETRAS_SEGURAS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin I ni O

const LONGITUD_MINIMA = 8;
const LONGITUD_MAXIMA = 24;

const CODIGOS_PROHIBIDOS = new Set([
  "12345678", "00000000", "11111111", "AAAAAAAA", "ABCDEFGH", "PASSWORD",
  "ADMIN123", "TEST1234", "DEMO1234", "CLASE123", "CURSO123", "COLEGIO1",
  "87654321", "QWERTY12", "CHANGEME", "MATEGUAR"
]);

function numeroAleatorio(maximo) {
  return Math.floor(Math.random() * maximo);
}

/** Genera un codigo nuevo (no verifica que este libre en D1; eso lo hace quien llama). */
export function generarCodigo() {
  const palabra = PALABRAS[numeroAleatorio(PALABRAS.length)];
  const numeros = String(numeroAleatorio(100)).padStart(2, "0");
  const letra = LETRAS_SEGURAS[numeroAleatorio(LETRAS_SEGURAS.length)];
  return `${palabra}-${numeros}${letra}`;
}

/**
 * null si el codigo es aceptable; un mensaje de error en español si no.
 * Se aplica tanto a un codigo escrito a mano (PATCH) como, por si acaso, a
 * uno generado (nunca deberia fallar, pero mejor no confiar ciegamente).
 */
export function validarCodigo(codigoCrudo) {
  const codigo = String(codigoCrudo || "").trim().toUpperCase();
  const sinGuion = codigo.replace(/-/g, "");

  if (codigo.length < LONGITUD_MINIMA) return `El código debe tener al menos ${LONGITUD_MINIMA} caracteres.`;
  if (codigo.length > LONGITUD_MAXIMA) return "El código es demasiado largo.";
  if (CODIGOS_PROHIBIDOS.has(codigo) || CODIGOS_PROHIBIDOS.has(sinGuion)) {
    return "Ese código es muy fácil de adivinar. Elige otro.";
  }
  if (/^(.)\1*$/.test(sinGuion)) return "Ese código es muy fácil de adivinar. Elige otro.";
  if (/^[0-9]+$/.test(sinGuion)) return "El código no puede ser solo números.";
  return null;
}
