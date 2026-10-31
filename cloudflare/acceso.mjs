/**
 * acceso.mjs
 * Guardia de /panel y /api/docente/*. La proteccion real es Cloudflare
 * Access, configurado en el panel de Cloudflare (Zero Trust -> Access ->
 * Applications) sobre mateguarida.com/panel* y mateguarida.com/api/docente*
 * -- Access bloquea la peticion en el borde de Cloudflare, antes de que
 * llegue a este Worker, para quien no sea connyrriquelme@gmail.com.
 *
 * Esta funcion es una SEGUNDA capa (defensa en profundidad), no la primera:
 * valida que Cloudflare ya puso la cabecera Cf-Access-Authenticated-User-Email
 * con el correo correcto. Si Access estuviera mal configurado o desactivado
 * por error, esta funcion igual corta el paso.
 *
 * Para probar en local (wrangler dev, sin Access de verdad delante): definir
 * PERMITIR_DOCENTE_LOCAL=true en .dev.vars (gitignored, nunca en produccion;
 * wrangler no sube .dev.vars con `wrangler deploy`).
 */

const CABECERA_CORREO = "Cf-Access-Authenticated-User-Email";

export function obtenerDocente(request, env) {
  const correoPermitido = String(env.DOCENTE_EMAIL || "connyrriquelme@gmail.com").toLowerCase();
  const correo = request.headers.get(CABECERA_CORREO);
  if (correo && correo.toLowerCase() === correoPermitido) return correo;
  if (env.PERMITIR_DOCENTE_LOCAL === "true") return "dev-local@mateguarida";
  return null;
}

export function respuestaNoAutorizado() {
  return new Response(JSON.stringify({ error: "No autorizado." }), {
    status: 401,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
