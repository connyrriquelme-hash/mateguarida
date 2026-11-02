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

## Identidad visual: misma familia que Lectoguarida

- **Mascota: Guarida**, el mismo gato de Lectoguarida (no es un personaje
  nuevo). Vive en `public/entrada/mascota.js`, copiado tal cual desde
  `../lectoguarida/outputs/Lectoguarida-Windows/public/entrada/mascota.js`
  (más `public/assets/logo.png`) — nunca se edita `../lectoguarida`. Módulo
  puro: `gatoSVG(animo)` devuelve el SVG como texto; tres ánimos: `normal`,
  `feliz`, `ups`.
- **Paleta**: se adoptó la misma paleta de Lectoguarida completa (naranja,
  rosado, azul, verde, amarillo, morado, tinta, papel y sus tintes — son
  los colores del gato y de apoyo) más **un acento propio para
  Matemática: `--turquesa` (`#0E7C7C`)**, que no existe en Lectoguarida y
  es lo que distingue la plataforma a simple vista. Mismo tratamiento
  "sticker": borde de 3px en tinta, sombra dura sin blur, botones pill
  (999px), tarjetas con radio 20px.
- **Tipografías**: Baloo 2 (títulos) y Nunito Sans (interfaz), iguales a
  Lectoguarida. Se agregó **Andika** (que Lectoguarida ya usa para lectura
  inicial) para los **números grandes dentro de los juegos**
  (`.numero-grande` en `/styles.css`): es la única de las tres pensada
  para que un niño distinga formas parecidas (6/9), comparada visualmente
  antes de elegirla.
- **Convención de nombres de juego: "Guarida + verbo"** (ej. "Guarida
  salta los techos"). El id técnico (slug, tabla `asignacion`, carpeta en
  `public/juegos/`) también sigue esa convención en minúsculas con
  guiones.

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
   **Ícono por estudiante** ✅ — catálogo cerrado de 36 (18 fauna chilena +
   18 animales conocidos, sin fotos, sin marcas): `cloudflare/iconos.mjs`
   (claves + asignación automática sin repetir dentro del curso, valida
   `estudiante.icono`) y `public/entrada/iconos.js` (el dibujo SVG real,
   mismas 36 claves en el mismo orden — si se agrega o quita un ícono hay
   que actualizar los dos archivos). Se asigna solo al crear un estudiante;
   editable desde el panel (selector visual, apaga los que ya usa otro
   estudiante activo del mismo curso). En la entrada, el botón de cada niño
   muestra el ícono grande y el nombre chico debajo (nunca se oculta el
   nombre); en Transición (NT1/NT2) los botones son más grandes y la
   instrucción "Toca tu dibujo" también se dice por voz, porque ahí el niño
   todavía no lee.
4. **Minijuegos** — en curso. Cada juego registra su detalle por ronda en
   la tabla genérica `ronda` (`id, intento_id, numero, variante, oa_code,
   nivel, correcto, uso_apoyo, tipo_error`): `variante` y `tipo_error` son
   texto libre, cada juego define los suyos (no hay un `CHECK` cerrado
   compartido — el primer intento de compartir uno con el segundo juego
   falló por eso, ver `cloudflare/migrations/0004_ronda_generica.sql`).
   El OA se atribuye POR RONDA, no por intento completo: el servidor usa
   el primer tramo de `variante` (antes del primer `-`) para elegir entre
   `oaPorVariante`/`oaPorDefecto` en `data/juegos-oa.json`
   (`oaDeRonda` en `cloudflare/curriculo.mjs`). Un mismo intento puede así
   alimentar más de un OA si mezcla variantes de distinto tipo (ej.
   "Guarida completa su álbum" mezcla OA-09 y OA-07 en la misma partida);
   `avance_oa` se recalcula desde `ronda`, nunca desde el intento completo
   (`cloudflare/migrations/0006_oa_por_ronda.sql` — reemplazó el enfoque
   anterior de la tabla puente `intento_oa`, que repartía el intento
   completo por igual entre todos los OA declarados y por eso duplicaba
   el conteo de partidas jugadas en el panel). El panel distingue
   "partidas jugadas" (`porEstudiante`/`porMesa`, contadas desde `intento`)
   de "avance por OA" (`porOA`, contado desde `avance_oa`). Contrato de
   ingesta: `POST /api/intentos` con
   `{ token, juegoId, duracionMs, dispositivo?, rondas: [...] }`.

   **Orden confirmado** (uno por eje de 2º básico, más dos que profundizan
   Números y Operaciones):
   1. ✅ **Guarida salta los techos** — conteo de 2/5/10 (MA02-OA-01,
      parcial: no cubre "de 100 en 100").
   2. ✅ **Guarida reparte los panes** — multiplicación, tablas del 2, 5
      y 10 (MA02-OA-11, completo).
   3. ✅ **Guarida completa su álbum** — adición/sustracción 0-100 con
      valor posicional (MA02-OA-09 en "juntar"/"regalar"/"dos_pasos"/
      "intercambio", MA02-OA-07 en "arma_numero"). No declara MA02-OA-06
      (estrategias de cálculo mental): la pista de "completar la decena"
      solo aparece en el apoyo, ninguna ronda la pide ni la verifica, así
      que no hay una ronda a la que atribuírselo con el mismo criterio que
      a los demás OA (ver `porQue` en `data/juegos-oa.json`).
   4. Guarida ordena el tendedero — patrones (MA02-OA-12).
   5. Guarida llega a la hora — lectura de hora (MA02-OA-18).
   6. Guarida ordena el taller (+ geoplano) — figuras 2D, incluye
      "construir" (MA02-OA-15).
   7. Guarida lanza los dados — datos y gráficos de barra (MA02-OA-21).

   **Guarida salta los techos** (`public/juegos/guarida-salta-los-techos/`):
   Guarida (el gato) salta de techo en techo por una calle de colores de la
   paleta. 9 saltos por partida (3 de cada tipo: 2/5/10, mezclados), 4
   niveles que suben/bajan solos según 2 aciertos/errores seguidos (nunca
   tras uno), con conteo hacia adelante y hacia atrás desde el nivel 3.
   Distractores diagnósticos: `cuenta_de_uno`, `salto_equivocado`,
   `confunde_decena`.

   **Guarida reparte los panes** (`public/juegos/guarida-reparte-los-panes/`):
   Guarida reparte marraquetas y hallullas (SVG propios en
   `pan.js`, estilo sticker, sin emojis) en bolsas iguales. 9 rondas (3
   de cada tabla), niveles 1 (hasta 5 bolsas) y 2-3 (hasta 10 bolsas,
   tabla completa); nivel 4 es el inverso (dado el total y cuánto trae
   cada bolsa, cuántas bolsas hay) — la variante "bolsa misteriosa"
   (incógnita en cuánto trae cada bolsa) quedó pendiente a propósito, sin
   improvisar. Distractores: `suma_en_vez_de_multiplicar`,
   `tabla_equivocada`, `conteo_parcial`.

   **Guarida completa su álbum** (`public/juegos/guarida-completa-su-album/`):
   un álbum de láminas genérico (sin marcas), sobres de 10 (decenas) y
   láminas sueltas (unidades), dibujados en SVG propio
   (`lamina.js`). 9 rondas: niveles 1-3 son 'juntar' (suma) o 'regalar'
   (resta) de un paso, con rango y mezcla sobres/sueltas creciendo por
   nivel; nivel 4 mezcla tres variantes al azar — `arma_numero` (dado
   un total, cuántos sobres o sueltas tiene; cubre MA02-OA-07 directo),
   `dos_pasos` (consigue y después regala, en la misma ronda) e
   `intercambio` (láminas repetidas). La variante "¿cuántas faltan para
   100?" del diseño original se reemplazó por estas dos últimas, a
   pedido. Distractores: `opera_al_reves`, `no_completa_decena`,
   `confunde_sobres_y_sueltas`.

   **Apoyo** en los tres: conteo concreto tras 2 fallos seguidos en la
   misma ronda. **Voz** (`public/entrada/voz.js`, compartido por los 4
   juegos — antes vivía copiado en cada uno): tres niveles, en orden de
   preferencia.
   1. Frases FIJAS (ánimo "¡Muy bien!"/"¡Casi! Inténtalo de nuevo" y los 3
      cierres — compartidas entre juegos donde el texto es idéntico):
      grabadas por Conny, archivo estático en `public/audio/frases/<clave>.mp3`.
   2. Frases VARIABLES (preguntas y apoyos, cambian los números cada
      ronda): `POST /api/voz` (`cloudflare/voz.mjs`) sintetiza con Azure
      Speech (voz `es-CL-CatalinaNeural`, ver `AZURE_SPEECH_VOZ` en
      `wrangler.jsonc`) y cachea el resultado en R2 (`env.AUDIO`, bucket
      `mateguarida-audio`) con una clave que depende solo del texto —
      nunca del estudiante. Requiere sesión de estudiante válida (mismo
      token que `/api/intentos`): cuesta dinero real por llamada a Azure,
      no puede quedar abierto a cualquiera.
   3. Respaldo final: `speechSynthesis` del navegador, con prioridad
      es-CL > es-419/es-US/es-MX "Natural"/"Online" > cualquier otra
      es-*, velocidad 0.92. Si falla cualquiera de los dos niveles
      anteriores (sin internet, Azure caído, archivo no grabado todavía),
      cae aquí sin romper el juego — nunca se concatenan clips a medias
      (sonaría robótico), siempre se dice la frase completa con una sola
      fuente de voz. `AZURE_SPEECH_KEY` es secreto del Worker
      (`wrangler secret put`), nunca vive en `wrangler.jsonc`.

   **Extensión a otros niveles** (en curso, más allá de 2º básico): los
   rangos/pasos/tablas de cada juego ya no están escritos en el código,
   viven en un `niveles.json` propio por juego (una fila por nivel
   curricular) — ver `cloudflare/curso.mjs` (`manejarMiSesion`, el
   servidor decide el nivel según el curso de la sesión, el dispositivo
   es solo respaldo). Primer juego nuevo construido con este mecanismo:

   **Guarida cuenta sus estrellas** (`public/juegos/guarida-cuenta-sus-estrellas/`,
   NT1/NT2 — Transición, sin texto en pantalla, todo por voz e imagen):
   objetos (estrella/conchita/manzana, `objetos.js`) que el niño TOCA uno a
   uno para contarlos (cada toque dice el número en voz; Guarida no cuenta
   en voz alta durante la ronda, solo en el apoyo) y luego responde
   "¿Cuántas hay?" entre 4 números (NT1 muestra puntos bajo cada numeral,
   NT2 solo el numeral); y rondas de comparar dos grupos — "¿Dónde hay
   más?"/"¿Dónde hay menos?", con una balanza como tercera opción cuando
   son iguales (al azar, pero garantizado al menos una vez por partida).
   Algunas rondas de comparar esparcen a propósito el grupo con MENOS
   objetos, para detectar si el niño juzga por el espacio que ocupa y no
   por la cantidad (`juzga_por_espacio`). NT1: 6 rondas (4 contar + 2
   comparar); NT2: 9 (6 + 3). Distractores de contar: `cuenta_de_mas`,
   `cuenta_de_menos`, `invierte_cifras` (N de dos cifras) o
   `numero_al_azar`, y los de proceso `se_salto_alguno`/`toco_de_mas`
   (tienen prioridad si ocurrieron: explican mejor el fallo que cuál
   número se eligió). OA: `contar` → NT-PM-OA-06, `comparar` →
   NT-PM-OA-04; NT-PM-OA-07 queda parcial, sin ronda propia (ver `porQue`
   en `data/juegos-oa.json`).

   **1º básico** ✅ — mismos dos juegos de 2º básico, nueva fila en sus
   `niveles.json`. **Techos**: suma el paso "1" (`pasos` pasa a
   `["1","2","5","10"]`), icono nuevo "bolitas"; `techoPorDificultad`
   `[20, 50, 100, 100]` (sube gradual, no salta directo a 100 como en
   2º básico) — MA01-OA-01, completo (el OA solo pide hasta 100 y los 4
   pasos, los 4 estan). Los iconos del apoyo (antes emoji: 🔴🧦✋🪙) pasan
   a SVG propio (`contexto.js`, `iconoPasoSVG`), para 1º y 2º básico por
   igual. **Álbum**: `techo` 20, rangos de dificultad siguiendo la propia
   gradación del OA9 ("de 0 a 5, de 6 a 10, de 11 a 20"); `arma_numero`
   exige total 10-20 (si no, nunca hay sobre que armar) y pasa a
   **MA01-OA-08** (no MA01-OA-07, que es de estrategias de calculo
   mental — mismo criterio de no declarar el que no tiene ronda propia).
   `juntar`/`regalar`/`dos_pasos`/`intercambio` → MA01-OA-09, parcial
   (no cubre "creando problemas"). Verificado con 2,7 millones de rondas
   generadas: ningun resultado correcto negativo ni mayor a 20, en
   ninguna dificultad ni variante.

   Pendientes del plan de extensión, sin empezar: 3º básico (panes con
   tablas 1-10 + modo repartición, techos con pasos de 100 y desde
   cualquier numero), 4º básico (álbum 0-1000 con una tercera
   agrupación de cajas de 100).

   **Sumo Primero**: campo editable desde el panel por juego y nivel
   (`juego_sumo_primero`, tomo/capítulo/título/páginas), vacío hasta que
   Conny lo complete ahí mismo — no bloquea ningún juego.
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
