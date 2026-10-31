/**
 * juegos.mjs
 * Registro estatico de los juegos (contenido versionado en el codigo, no en
 * D1 -- mismo patron que Lectoguarida). D1 solo guarda CUAL juego esta
 * asignado a cada curso (tabla asignacion) y el avance que producen.
 *
 * Convencion de nombres: "Guarida + verbo" (el gato de Lectoguarida,
 * mascota de toda Mateguarida tambien).
 */

export const JUEGOS = {
  "guarida-salta-los-techos": {
    id: "guarida-salta-los-techos",
    nombre: "Guarida salta los techos",
    nivelPrincipal: "2-basico",
    descripcion: "Cuenta de 2 en 2, de 5 en 5 y de 10 en 10 para ayudar a Guarida a cruzar la calle saltando techos.",
    duracionMinutos: "2-4",
    ruta: "/juegos/guarida-salta-los-techos/"
  }
};

export function existeJuego(juegoId) {
  return Boolean(JUEGOS[juegoId]);
}

export function juegosParaNivel(nivel) {
  return Object.values(JUEGOS).filter((j) => j.nivelPrincipal === nivel);
}
