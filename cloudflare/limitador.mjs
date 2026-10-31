/**
 * limitador.mjs
 * Limite de intentos fallidos por IP en POST /api/entrada: protege el
 * codigo de curso de que lo adivinen a fuerza bruta. 5 codigos incorrectos
 * seguidos desde la misma IP la bloquean unos minutos; un codigo correcto
 * limpia el contador.
 */

const MAX_FALLOS = 5;
const BLOQUEO_MINUTOS = 5;

export function obtenerIp(request) {
  // Cloudflare pone esta cabecera en el borde; no se puede falsear desde
  // fuera (el Worker ve la IP real del visitante, no una que el cliente mande).
  return request.headers.get("CF-Connecting-IP") || "desconocida";
}

/** { bloqueada: boolean, minutosRestantes? } */
export async function revisarBloqueo(env, ip) {
  const fila = await env.DB.prepare(
    "SELECT bloqueado_hasta FROM intento_login_ip WHERE ip = ?1"
  ).bind(ip).first();

  if (!fila || !fila.bloqueado_hasta) return { bloqueada: false };

  const hasta = new Date(fila.bloqueado_hasta);
  const ahora = new Date();
  if (hasta > ahora) {
    return { bloqueada: true, minutosRestantes: Math.ceil((hasta - ahora) / 60000) };
  }

  // El bloqueo ya vencio: se limpia para que la IP empiece con 5 intentos
  // frescos, no que se vuelva a bloquear con el primer fallo nuevo.
  await limpiarFallos(env, ip);
  return { bloqueada: false };
}

export async function registrarFallo(env, ip) {
  const t = new Date().toISOString();
  const fila = await env.DB.prepare("SELECT fallos FROM intento_login_ip WHERE ip = ?1").bind(ip).first();
  const fallos = (fila ? fila.fallos : 0) + 1;
  const bloqueadoHasta = fallos >= MAX_FALLOS
    ? new Date(Date.now() + BLOQUEO_MINUTOS * 60000).toISOString()
    : null;

  await env.DB.prepare(
    "INSERT INTO intento_login_ip (ip, fallos, bloqueado_hasta, actualizado_en) VALUES (?1, ?2, ?3, ?4) " +
    "ON CONFLICT(ip) DO UPDATE SET fallos = ?2, bloqueado_hasta = ?3, actualizado_en = ?4"
  ).bind(ip, fallos, bloqueadoHasta, t).run();
}

export async function limpiarFallos(env, ip) {
  await env.DB.prepare("DELETE FROM intento_login_ip WHERE ip = ?1").bind(ip).run();
}
