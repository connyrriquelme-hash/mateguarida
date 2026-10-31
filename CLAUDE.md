# Mateguarida

Plataforma de Matemática para NT1, NT2 y 1º a 4º Básico. Hermana de
Lectoguarida (`../lectoguarida`), con el enfoque todo en uno de Innovamat:
juegos para los estudiantes, clase guiada para el docente y seguimiento del
avance por OA.

Dominio: **mateguarida.com** (comprado, en la cuenta de Cloudflare de Conny).

## Reglas de contenido (obligatorias, no negociables)

- El corpus del RAG solo puede contener **documentos públicos del Mineduc**
  (Bases Curriculares de Educación Parvularia, Bases Curriculares de 1º a 6º
  básico, Programas de Estudio de Matemática) y **materiales propios** que
  Conny entregue.
- **Prohibido** descargar, copiar o indexar textos escolares de editoriales y
  el contenido de **Sumo Primero**. Sumo Primero se usa solo como
  **referencia bibliográfica** (nivel, tomo, capítulo) para vincular cada
  juego con el libro que el curso ya tiene.
- Toda actividad y juego es **original** y declara **nivel, eje y OA**.

## Arquitectura (Cloudflare, mismo stack que Lectoguarida)

- **Worker** para la app (`main` apunta al worker; `assets` sirve `public/`).
- **D1** para cursos, estudiantes, juegos, asignaciones, intentos y avance por OA.
- **R2** para el corpus curricular.
- **AutoRAG** (Vectorize + Workers AI) para consultar el corpus.
- La IA se usa **solo en el panel docente**, para generar **borradores** que
  Conny revisa y aprueba. **Los niños nunca interactúan con IA en vivo.**
- **Entrada de estudiantes sin PIN, sin excepción**: tocar el nombre basta.
  Se decidió así en la etapa 3 (no "desactivado por defecto": no existe en el
  código). El código de curso se guarda en el dispositivo (lo escribe la
  profesora una vez por tablet) y es lo que mantiene los nombres fuera de
  internet abierto.
- **Dato mínimo del estudiante**: nombre e inicial del apellido. Nunca RUT,
  fecha de nacimiento ni otro dato personal — ni en D1 ni en ningún juego.
- **Panel docente (`/panel`, `/api/docente/*`) protegido con Cloudflare
  Access** (verificación por correo a connyrriquelme@gmail.com), no con PIN
  propio. `cloudflare/acceso.mjs` valida el JWT de Access de verdad (firma
  RS256 contra `https://<ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs`, `iss`,
  `aud` contra `ACCESS_AUD_TAG`, `exp` y el correo) como defensa en
  profundidad — no se conforma con leer una cabecera sin verificar.
  `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD_TAG` son los dos datos de la aplicación
  de Access (Zero Trust → Access → Applications → la app → Overview) y van
  en `wrangler.jsonc` → `vars` (no son secretos: ambos viajan dentro del
  propio JWT).
- **Estudiantes se agrupan por mesa**: número de mesa (1..`curso.cantidad_mesas`,
  por defecto 8), selector en el panel, no texto libre. El avance se puede
  ver por estudiante, por mesa y por OA.
- **Carga de curso por lista pegada**: un nombre por línea; la inicial del
  apellido se escribe al final de la línea ("Ana R."), se detecta sola;
  funciona también con nombres compuestos ("María José R." → nombre "María
  José" + inicial "R").
- **Código de curso generado solo** (`cloudflare/codigos.mjs`): formato
  PALABRA-NNL (ej. VERDE-47K), nunca corto ni de una lista de códigos
  comunes/débiles, incluso si la profesora lo edita a mano. Protegido además
  por límite de intentos por IP en `/api/entrada`
  (`cloudflare/limitador.mjs`): 5 códigos incorrectos seguidos desde la
  misma IP bloquean esa IP 5 minutos.

## Dominio y despliegue

Se publica como dominio personalizado del Worker:

```jsonc
"routes": [
  { "pattern": "mateguarida.com",     "custom_domain": true },
  { "pattern": "www.mateguarida.com", "custom_domain": true }
]
```

**Antes de cada despliegue que toque el dominio**: recordarle a Conny que
revise en el panel de Cloudflare (DNS de mateguarida.com) que **no existan
registros A ni CNAME** para `mateguarida.com` ni `www.mateguarida.com`. Si
existen, bloquean el deploy del custom domain.

## Entorno de trabajo

- Windows 11 con **PowerShell 5.1**: **nunca encadenar con `&&`**. Usar
  `comando; if ($?) { siguiente }` o un comando por línea.
- `npx.cmd wrangler ...` para los comandos de Cloudflare.
- **No modificar nada en `../lectoguarida`.** Es solo referencia de lectura.

## Etapas (una por commit; detenerse al final de cada una y esperar aprobación)

1. **Mapa curricular** — descargar los documentos públicos a `/corpus` y crear
   `/data/oa.json` con cada OA (código, nivel, eje, texto, indicadores) desde
   NT1 a 4º Básico. Entregar resumen por nivel y eje.
2. **Base del proyecto** — estructura, `wrangler.toml`, esquema D1 (cursos,
   estudiantes, juegos, asignaciones, intentos, avance por OA) y la pantalla de
   entrada adaptada de Lectoguarida. Desplegar una portada «Próximamente» en
   mateguarida.com para probar el dominio.
3. **Panel docente** ✅ — crear curso (código generado solo, cantidad de
   mesas), ingresar estudiantes (uno por uno o pegando la lista), agrupar
   por mesa (selector numérico), asignar juegos, ver avance por
   estudiante/mesa/OA y en qué se equivocan. Cloudflare Access configurado
   y verificado (`ACCESS_TEAM_DOMAIN`/`ACCESS_AUD_TAG` en `wrangler.jsonc`).
4. **Primer minijuego** ✅ — **"El sapito saltarín"**
   (`public/juegos/conteo-saltos-2basico/`), 2º básico: conteo de 2 en 2, 5
   en 5 y 10 en 10 (MA02-OA-01, alcance parcial: no cubre "de 100 en 100").
   9 saltos por partida (3 de cada tipo, mezclados), 4 niveles de
   dificultad que suben/bajan solos según 2 aciertos/errores seguidos
   (nunca tras uno), con conteo hacia adelante y hacia atrás desde el
   nivel 3. Cada opción incorrecta es un error diagnóstico
   (`cuenta_de_uno`, `salto_equivocado`, `confunde_decena`), guardado por
   salto en D1 (`salto.tipo_error`) y mostrado agregado en el panel ("En
   qué se equivocan", por OA). Apoyo con conteo concreto (🧦/✋/🪙) tras 2
   fallos seguidos en el mismo salto. Voz con `speechSynthesis` (es-CL).
   Mascota: **Matecito** (nombre provisional, un solo texto en el código
   si Conny prefiere otro).
   **Sumo Primero**: campo editable desde el panel
   (`juego_sumo_primero`, tomo/capítulo/título/páginas), vacío hasta que
   Conny lo complete ahí mismo — no bloquea el juego.
5. **RAG** — subir `/corpus` a R2, guiar paso a paso la creación de la instancia
   de AutoRAG en el panel de Cloudflare y conectarla al Worker.
   **Pendiente a resolver en esta etapa:** los Programas de Estudio de
   Matemática 1º-3º básico (`corpus/programa-matematica-{1,2,3}-basico.pdf`)
   tienen, en sus páginas 24-25/53-54, un recuadro de ejemplo («Estructura del
   programa de estudio») que reutiliza como ilustración el contenido de **4º
   básico** (con su propio pie de página "Programa de Estudio / 4º básico"
   dentro del PDF de otro nivel; ver `corpus/FUENTES.md`). Si esas páginas se
   indexan tal cual, el RAG puede devolver contenido de 4º básico citado como
   si fuera de 1º-3º. Antes de indexar: (a) cada fragmento subido a R2/AutoRAG
   debe llevar el nivel correcto como metadato explícito (no inferido del
   nombre del archivo), y (b) esas páginas de ejemplo concretas deben
   excluirse del corpus indexado, o quedar etiquetadas con metadato
   `nivel: 4-basico` en vez del nivel del archivo que las contiene.
6. **Generador de clases** — dado un OA, propone una clase (inicio, juego,
   cierre, ticket de salida) basada en el corpus, con referencia a Sumo Primero,
   guardada como borrador editable.
7. **Publicación final** en mateguarida.com y prueba completa en producción.

## Qué se reutiliza de Lectoguarida

La app vive en `../lectoguarida/outputs/Lectoguarida-Windows/`:

| Qué | Dónde en Lectoguarida | Para qué en Mateguarida |
|---|---|---|
| Catálogo de OA | `public/expedicion/solo/game-content/curriculum/oa-oficiales.json` | formato de `data/oa.json` (código, nivel, eje, texto + `fuentes` con documento, url y fecha de consulta) |
| Juego → OA | `.../curriculum/juegos-oa.json` | vincular cada minijuego con sus OA, con `porQue` y `alcance` |
| OA en el servidor | `cloudflare/curriculo.mjs` | el servidor **deduce** los OA del juego y el nivel; nunca confía en los que manda el cliente |
| Esquema D1 | `cloudflare/schema.sql` | migraciones idempotentes (`CREATE ... IF NOT EXISTS`), `curso`, `asignacion`, evidencia por intento + agregados `learning_oa_profile` |
| Entrada sin PIN | `public/app.js`, `cloudflare/worker.mjs` | elegir el nombre de la lista; código de curso persistido en el dispositivo |
| Service worker | `public/sw.js` | red primero para código y contenido; `/api/` nunca pasa por el SW; cola de evidencia offline |
| Config Worker | `wrangler.jsonc` | `assets` + `run_worker_first`, binding D1, custom domains |

## Privacidad (heredada de Lectoguarida)

- La evidencia no guarda nombre, audio, voz, IP ni huella de navegador. El
  vínculo entre `student_id` y el nombre real vive solo en la nómina.
- Ningún archivo publicado contiene nombres de estudiantes, el nombre de la
  profesora ni PIN. Las capturas y los datos de prueba usan nombres inventados.
- Una pérdida de datos de un niño **nunca** es silenciosa: se avisa en el panel.
