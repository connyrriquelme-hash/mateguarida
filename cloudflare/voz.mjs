/**
 * voz.mjs
 * POST /api/voz { token, texto } -> audio/mpeg (o 502 si no se pudo generar,
 * para que el cliente caiga a la voz del navegador -- ver
 * public/entrada/voz.js: decir() nunca rompe el juego si esto falla).
 *
 * Solo sirve las frases VARIABLES (preguntas y apoyos con numeros, distintas
 * en cada ronda): las fijas (animo, cierres) las graba la profesora y viven
 * como archivo estatico en public/audio/frases/, sin pasar por aqui.
 *
 * Cachea en R2 (env.AUDIO) por una clave que depende solo del TEXTO de la
 * frase (nunca del estudiante): "Guarida tiene 47 laminas..." se sintetiza
 * una vez con Azure Speech y se reutiliza para cualquier nino al que le
 * toque esa misma combinacion de numeros, sin volver a llamar a Azure.
 * Nunca se envia a Azure nada que identifique a un estudiante -- el texto
 * de estas frases solo habla de "Guarida" y numeros, igual que en pantalla.
 *
 * Requiere sesion de estudiante valida (mismo token que /api/intentos): este
 * endpoint cuesta dinero real por llamada a Azure, no puede quedar abierto a
 * cualquiera que le pegue con texto arbitrario.
 */

const MAX_LARGO_TEXTO = 220; // margen holgado sobre la frase mas larga de los 3 juegos

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

async function claveParaTexto(texto, voz) {
  const datos = new TextEncoder().encode(`${voz}|${texto}`);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function escaparSSML(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Pide la frase a Azure Speech; null si Azure no respondio bien (el llamador cae a voz del navegador). */
async function sintetizarConAzure(env, texto) {
  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) return null;

  const voz = env.AZURE_SPEECH_VOZ || "es-CL-CatalinaNeural";
  const ssml =
    `<speak version="1.0" xml:lang="es-CL">` +
    `<voice name="${voz}"><prosody rate="-8%">${escaparSSML(texto)}</prosody></voice></speak>`;

  let respuesta;
  try {
    respuesta = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-64kbitrate-mono-mp3",
        "User-Agent": "mateguarida"
      },
      body: ssml
    });
  } catch {
    return null; // Azure no respondio (red, timeout, etc.)
  }

  if (!respuesta.ok) return null;
  return await respuesta.arrayBuffer();
}

/** POST /api/voz */
export async function manejarVoz(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Cuerpo invalido." }, 400);
  }

  const token = String(body.token || "");
  if (!token) return json({ error: "Falta el token de sesion." }, 401);

  const sesion = await env.DB.prepare(
    "SELECT estudiante_id, expires_at FROM sesion_estudiante WHERE token = ?1"
  ).bind(token).first();
  if (!sesion || new Date(sesion.expires_at) < new Date()) {
    return json({ error: "La sesion ya no es valida." }, 401);
  }

  const texto = String(body.texto || "").trim();
  if (!texto || texto.length > MAX_LARGO_TEXTO) {
    return json({ error: "Texto invalido." }, 400);
  }

  const voz = env.AZURE_SPEECH_VOZ || "es-CL-CatalinaNeural";
  const clave = `voz/${await claveParaTexto(texto, voz)}.mp3`;

  if (env.AUDIO) {
    const enCache = await env.AUDIO.get(clave);
    if (enCache) {
      return new Response(enCache.body, {
        headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable" }
      });
    }
  }

  const audio = await sintetizarConAzure(env, texto);
  if (!audio) return json({ error: "No se pudo generar el audio." }, 502);

  if (env.AUDIO) {
    await env.AUDIO.put(clave, audio, { httpMetadata: { contentType: "audio/mpeg" } });
  }

  return new Response(audio, {
    headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable" }
  });
}
