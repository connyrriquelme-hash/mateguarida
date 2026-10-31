/**
 * acceso.mjs
 * Guardia de /panel y /api/docente/*. Valida de verdad el JWT que pone
 * Cloudflare Access en la cabecera Cf-Access-Jwt-Assertion -- no confia en
 * que Access ya filtro la peticion antes de llegar aqui (defensa en
 * profundidad real, no solo leer un correo sin verificar).
 *
 * Se valida, en este orden:
 *   1. exp (no vencido)
 *   2. iss  (https://<ACCESS_TEAM_DOMAIN>)
 *   3. aud  (incluye ACCESS_AUD_TAG)
 *   4. firma RS256 contra las claves publicas de Access
 *      (https://<ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs)
 *   5. email == DOCENTE_EMAIL
 *
 * ACCESS_TEAM_DOMAIN y ACCESS_AUD_TAG son datos publicos de la aplicacion de
 * Access (no son secretos: van en el propio JWT, cualquiera que lo intercepte
 * los ve), por eso viven como "vars" en wrangler.jsonc, no como secretos.
 *
 * Para probar en local (wrangler dev, sin Access real delante): definir
 * PERMITIR_DOCENTE_LOCAL=true en .dev.vars (gitignored, wrangler nunca lo
 * sube con `wrangler deploy`).
 */

const CABECERA_JWT = "Cf-Access-Jwt-Assertion";
const TTL_JWKS_MS = 60 * 60 * 1000; // 1 hora: las claves de Access rotan, pero no a cada minuto.

// Cache a nivel de modulo: vive mientras el isolate del Worker este caliente,
// se pierde y se vuelve a pedir en un isolate nuevo. No es un secreto, es
// solo para no pedir las claves en cada peticion.
let jwksCache = null;
let jwksCacheEn = 0;

function base64UrlABytes(valor) {
  const normalizado = valor.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = normalizado + "=".repeat((4 - (normalizado.length % 4)) % 4);
  const binario = atob(relleno);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

function decodificarSegmentoJson(segmentoB64) {
  const texto = new TextDecoder().decode(base64UrlABytes(segmentoB64));
  return JSON.parse(texto);
}

async function obtenerJWKS(env) {
  const ahora = Date.now();
  if (jwksCache && ahora - jwksCacheEn < TTL_JWKS_MS) return jwksCache;

  const dominio = String(env.ACCESS_TEAM_DOMAIN || "").trim();
  if (!dominio) throw new Error("ACCESS_TEAM_DOMAIN no configurado.");

  const respuesta = await fetch(`https://${dominio}/cdn-cgi/access/certs`);
  if (!respuesta.ok) throw new Error(`No se pudo obtener JWKS de Access (${respuesta.status}).`);
  const jwks = await respuesta.json();
  jwksCache = jwks;
  jwksCacheEn = ahora;
  return jwks;
}

async function verificarFirma(token, jwks) {
  const [headerB64, payloadB64, firmaB64] = token.split(".");
  const header = decodificarSegmentoJson(headerB64);

  const jwk = (jwks.keys || []).find((k) => k.kid === header.kid);
  if (!jwk) return false;

  const clave = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const datos = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const firma = base64UrlABytes(firmaB64);
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", clave, firma, datos);
}

/**
 * Verifica el JWT de Access completo. Devuelve el correo si todo es valido,
 * o null si falta algo (sin token, vencido, firma mala, emisor/audiencia que
 * no corresponden, o correo distinto del docente autorizado).
 */
export async function obtenerDocente(request, env) {
  if (env.PERMITIR_DOCENTE_LOCAL === "true") return "dev-local@mateguarida";

  const token = request.headers.get(CABECERA_JWT);
  if (!token || token.split(".").length !== 3) return null;

  let payload;
  try {
    payload = decodificarSegmentoJson(token.split(".")[1]);
  } catch {
    return null;
  }

  const ahoraSegundos = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < ahoraSegundos) return null;

  const dominio = String(env.ACCESS_TEAM_DOMAIN || "").trim();
  const audTag = String(env.ACCESS_AUD_TAG || "").trim();
  if (!dominio || !audTag) return null;

  if (payload.iss !== `https://${dominio}`) return null;

  const audiencias = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiencias.includes(audTag)) return null;

  let jwks;
  try {
    jwks = await obtenerJWKS(env);
  } catch {
    return null;
  }

  const firmaValida = await verificarFirma(token, jwks).catch(() => false);
  if (!firmaValida) return null;

  const correoPermitido = String(env.DOCENTE_EMAIL || "connyrriquelme@gmail.com").toLowerCase();
  const correo = String(payload.email || "").toLowerCase();
  if (correo !== correoPermitido) return null;

  return payload.email;
}

export function respuestaNoAutorizado() {
  return new Response(JSON.stringify({ error: "No autorizado." }), {
    status: 401,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
