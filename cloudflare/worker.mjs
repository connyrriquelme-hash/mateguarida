/**
 * worker.mjs
 * Worker principal de Mateguarida. Atiende /api/* y delega todo lo demas a
 * los archivos estaticos de /public (binding ASSETS, ver wrangler.jsonc:
 * run_worker_first hace que este archivo vea CADA request primero).
 *
 * /panel y /api/docente/* estan protegidas por Cloudflare Access (se
 * configura en el panel de Cloudflare, no aqui) + una segunda validacion en
 * este archivo (cloudflare/acceso.mjs), para quien no sea
 * connyrriquelme@gmail.com.
 */

import { manejarEntrada, manejarEntrarEstudiante, manejarMiSesion } from "./curso.mjs";
import { manejarIntento } from "./intentos.mjs";
import { manejarVoz } from "./voz.mjs";
import { obtenerDocente, respuestaNoAutorizado } from "./acceso.mjs";
import {
  listarCursos, crearCurso, obtenerCurso, actualizarCurso, eliminarCurso, regenerarCodigo,
  agregarEstudiantes, actualizarEstudiante, eliminarEstudiante, obtenerAvance,
  listarJuegosDeCurso, asignarJuegos, obtenerSumoPrimero, guardarSumoPrimero
} from "./docente.mjs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

async function manejarDocente(request, env, pathname) {
  if (!(await obtenerDocente(request, env))) return respuestaNoAutorizado();

  const { method } = request;

  if (pathname === "/api/docente/cursos") {
    if (method === "GET") return listarCursos(env);
    if (method === "POST") return crearCurso(request, env);
  }

  const matchCurso = pathname.match(/^\/api\/docente\/cursos\/([^/]+)$/);
  if (matchCurso) {
    const id = decodeURIComponent(matchCurso[1]);
    if (method === "GET") return obtenerCurso(env, id);
    if (method === "PATCH") return actualizarCurso(request, env, id);
    if (method === "DELETE") return eliminarCurso(env, id);
  }

  const matchEstudiantesCurso = pathname.match(/^\/api\/docente\/cursos\/([^/]+)\/estudiantes$/);
  if (matchEstudiantesCurso && method === "POST") {
    return agregarEstudiantes(request, env, decodeURIComponent(matchEstudiantesCurso[1]));
  }

  const matchRegenerarCodigo = pathname.match(/^\/api\/docente\/cursos\/([^/]+)\/regenerar-codigo$/);
  if (matchRegenerarCodigo && method === "POST") {
    return regenerarCodigo(env, decodeURIComponent(matchRegenerarCodigo[1]));
  }

  const matchAvance = pathname.match(/^\/api\/docente\/cursos\/([^/]+)\/avance$/);
  if (matchAvance && method === "GET") {
    return obtenerAvance(env, decodeURIComponent(matchAvance[1]));
  }

  const matchJuegosCurso = pathname.match(/^\/api\/docente\/cursos\/([^/]+)\/juegos$/);
  if (matchJuegosCurso) {
    const id = decodeURIComponent(matchJuegosCurso[1]);
    if (method === "GET") return listarJuegosDeCurso(env, id);
    if (method === "PUT") return asignarJuegos(request, env, id);
  }

  const matchEstudiante = pathname.match(/^\/api\/docente\/estudiantes\/([^/]+)$/);
  if (matchEstudiante) {
    const id = decodeURIComponent(matchEstudiante[1]);
    if (method === "PATCH") return actualizarEstudiante(request, env, id);
    if (method === "DELETE") return eliminarEstudiante(env, id);
  }

  const matchSumoPrimero = pathname.match(/^\/api\/docente\/juegos\/([^/]+)\/sumo-primero$/);
  if (matchSumoPrimero) {
    const juegoId = decodeURIComponent(matchSumoPrimero[1]);
    if (method === "GET") {
      const nivel = new URL(request.url).searchParams.get("nivel") || "";
      return obtenerSumoPrimero(env, juegoId, nivel);
    }
    if (method === "PUT") return guardarSumoPrimero(request, env, juegoId);
  }

  return json({ error: "No encontrado." }, 404);
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

    if (pathname === "/api/mi-sesion" && request.method === "POST") {
      return manejarMiSesion(request, env);
    }

    if (pathname === "/api/intentos" && request.method === "POST") {
      return manejarIntento(request, env);
    }

    if (pathname === "/api/voz" && request.method === "POST") {
      return manejarVoz(request, env);
    }

    if (pathname.startsWith("/api/docente/")) {
      return manejarDocente(request, env, pathname);
    }

    // Segunda capa tambien para los archivos estaticos del panel: si Access
    // fallara, esto igual corta el paso antes de servir /panel/*.
    if (pathname.startsWith("/panel") && !(await obtenerDocente(request, env))) {
      return respuestaNoAutorizado();
    }

    if (pathname.startsWith("/api/")) {
      return json({ error: "No encontrado." }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
