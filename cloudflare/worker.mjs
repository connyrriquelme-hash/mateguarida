/**
 * worker.mjs
 * Worker principal de Mateguarida. Atiende /api/* y delega todo lo demas a
 * los archivos estaticos de /public (binding ASSETS, ver wrangler.jsonc:
 * run_worker_first hace que este archivo vea CADA request primero).
 *
 * Etapa 2: solo existe la API de entrada (codigo de curso -> nombres ->
 * elegir nombre). El panel docente (crear curso, ingresar estudiantes,
 * asignar juegos, ver avance) es la etapa 3.
 */

import { manejarEntrada, manejarEntrarEstudiante } from "./curso.mjs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/api/salud") {
      return json({ ok: true, servicio: "mateguarida" });
    }

    if (pathname === "/api/entrada" && request.method === "POST") {
      return manejarEntrada(request, env);
    }

    const matchEntrar = pathname.match(/^\/api\/estudiantes\/([^/]+)\/entrar$/);
    if (matchEntrar && request.method === "POST") {
      return manejarEntrarEstudiante(request, env, decodeURIComponent(matchEntrar[1]));
    }

    if (pathname.startsWith("/api/")) {
      return json({ error: "No encontrado." }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
