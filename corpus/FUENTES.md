# Fuentes del corpus — Mateguarida

Todos los documentos de esta carpeta son públicos del Mineduc (Chile), descargados
de `curriculumnacional.cl` o del repositorio institucional `bibliotecadigital.mineduc.cl`.
**No hay textos escolares de editoriales ni contenido de Sumo Primero.** Verificación
hecha con `curl -sIL` comparando `content-length` contra el tamaño del archivo
descargado (ver nota de integridad al final).

| Archivo local | Documento | URL | Peso | Consultado |
|---|---|---|---|---|
| `bases-curriculares-1-6-basico.pdf` | Bases Curriculares 1º a 6º Básico (reedición 2024) — Matemática, páginas 215-261 (1º-6º básico) | https://www.curriculumnacional.cl/sites/default/files/newtenberg/614/articles-22394_bases.pdf | 3,73 MB (3 906 460 B) | 2026-10-30 |
| `bases-parvularia-nucleo-pensamiento-matematico-extracto.pdf` | Bases Curriculares de la Educación Parvularia (2018) — extracto: Núcleo Pensamiento Matemático, páginas 93-99 | https://www.curriculumnacional.cl/614/articles-115247_bases.pdf | 43,5 KB (43 554 B) | 2026-10-30 |
| `bases-parvularia-programa-pedagogico-nt1-nt2.pdf` | Programa Pedagógico Primer y Segundo Nivel de Transición (2019), basado en el Decreto Nº481 del 10-02-2018. Vigente (Resolución CNED Nº257/2019). | https://bibliotecadigital.mineduc.cl/bitstream/handle/20.500.12365/17464/Programa-Pedagógico-NT1-y-NT2.pdf | 6,6 MB (6 914 076 B) | 2026-10-30 |
| `programa-matematica-1-basico.pdf` | Programa de Estudio Matemática 1º básico (D.S. 439/2012) | https://www.curriculumnacional.cl/sites/default/files/newtenberg/614/articles-18976_programa.pdf | 5,03 MB (5 274 051 B) | 2026-10-30 |
| `programa-matematica-2-basico.pdf` | Programa de Estudio Matemática 2º básico (D.S. 439/2012) | https://www.curriculumnacional.cl/sites/default/files/newtenberg/614/articles-18977_programa.pdf | 7,95 MB (7 954 483 B) | 2026-10-30 |
| `programa-matematica-3-basico.pdf` | Programa de Estudio Matemática 3º básico (reedición 2024) | https://www.curriculumnacional.cl/sites/default/files/adjuntos/recursos/2024-12/Matemática%203.pdf | 6,9 MB (7 230 979 B) | 2026-10-30 |
| `programa-matematica-4-basico.pdf` | Programa de Estudio Matemática 4º básico (D.S. 439/2012) | https://www.curriculumnacional.cl/sites/default/files/newtenberg/614/articles-18979_programa.pdf | 6,17 MB (6 470 798 B) | 2026-10-30 |

## Candidata descartada (ajuste #4 del usuario)

Para el Programa de 3º básico, `curriculumnacional.cl/614/w3-article-18978.html` (que
en su momento redirigía a `articles-18978_programa.pdf`) resultó ser un enlace viejo
roto: al abrirlo, su propio texto de página decía "Programa de Estudio Matemática
3° básico" pero apuntaba a un PDF vacío/placeholder (441 bytes, texto ASCII, no PDF
real). La página canónica actual de ese mismo artículo entrega en su lugar el PDF
`Matemática 3.pdf` (reedición 2024, 7,95 MB), que es el que se usó. Se descartó
`articles-18978_programa.pdf` como URL.

## Programa Pedagógico NT1-NT2: por qué no tiene `indicadores`

Se confirmó que existe y está vigente (ajuste #2 del usuario). Se agregó al corpus.
Sin embargo, a diferencia de los Programas de Estudio de Básica, este documento
**no trae una columna de "Indicadores de Evaluación Sugeridos" por OA**: el término
"indicador" solo aparece en su capítulo general de evaluación (cómo construir una
lista de cotejo o una escala), no como un listado fijo asociado a cada OA. Lo que sí
trae, por cada OA del núcleo Pensamiento Matemático, es "Trayectoria educativa",
"Conocimientos disciplinarios" y "Experiencias de aprendizaje sugeridas" vinculadas
a Objetivos de Aprendizaje Transversales (OAT) — material valioso para la etapa 6
(generador de clases), pero no indicadores. Por eso `data/oa.json` deja
`indicadores: []` también para NT1/NT2, en vez de inventarlos.

## Indicadores de los Programas de Básica (1º-4º): por qué quedaron vacíos también

Los 4 Programas de Estudio de Matemática (1º-4º básico) sí tienen una columna
"Indicadores de Evaluación Sugeridos" por OA, en una tabla de dos columnas por
unidad. Se intentó extraerla de forma automática (`pdftotext -layout` + un script
en Python) pero se encontraron dos problemas que hacían la extracción poco
confiable para texto que se presentaría como oficial:

1. **Las páginas 24-25 / 53-54 de cada programa repiten un recuadro "Estructura del
   programa de estudio" que usa como ejemplo ilustrativo el contenido de 4º básico**
   (números hasta 10 000, multiplicación de 3 cifras, etc.), con un pie de página que
   literalmente dice "Programa de Estudio / 4º básico" **dentro del archivo de 1º
   básico**. Es un defecto de la plantilla del documento original de Mineduc, no de
   la descarga. `pdftotext` mezclaba esa muestra de ejemplo con el contenido real
   del nivel al reconstruir las columnas.
2. En las tablas reales (las que sí corresponden al nivel), algunas viñetas de
   indicadores aparecen en la misma línea que el "OA N" y no en la línea siguiente,
   y el carácter de viñeta (›) no siempre se extrajo igual (apareció como carácter
   inválido en varios casos). Una extracción ingenua perdía viñetas completas o las
   cortaba a mitad de frase.

Dado que Mineduc mismo califica estos indicadores de "sugeridos" (el docente puede
complementarlos — no son el OA en sí), se decidió dejar `indicadores: []` en
`data/oa.json` para 1º-4º básico también, en vez de arriesgar texto truncado o de
otro nivel presentado como si fuera oficial. Los 4 PDF ya están en este corpus;
completar `indicadores` a mano o revisando el PDF página por página (en vez de el
texto plano) queda pendiente para una etapa futura, si se necesita.

## Verificación de integridad

Cada PDF se descargó con `curl -sL` y se comparó su tamaño final contra el
`content-length` reportado por el servidor en la respuesta HTTP. Un primer intento
de descarga del Programa de 3º básico quedó truncado a 3 057 427 bytes (el servidor
reportaba 7 230 979); se volvió a descargar completo y ahora coincide. El resto
coincidió a la primera.
