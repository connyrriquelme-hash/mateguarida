/**
 * juegos.mjs
 * Registro estatico de los juegos (contenido versionado en el codigo, no en
 * D1 -- mismo patron que Lectoguarida). D1 solo guarda CUAL juego esta
 * asignado a cada curso (tabla asignacion) y el avance que producen.
 */

export const JUEGOS = {
  "conteo-saltos-2basico": {
    id: "conteo-saltos-2basico",
    nombre: "El sapito saltarín",
    nivelPrincipal: "2-basico",
    descripcion: "Cuenta de 2 en 2, de 5 en 5 y de 10 en 10 para ayudar a Matecito a cruzar el sendero.",
    duracionMinutos: "2-4",
    ruta: "/juegos/conteo-saltos-2basico/"
  }
};

export function existeJuego(juegoId) {
  return Boolean(JUEGOS[juegoId]);
}

export function juegosParaNivel(nivel) {
  return Object.values(JUEGOS).filter((j) => j.nivelPrincipal === nivel);
}
