# -*- coding: utf-8 -*-
"""
Construye ../data/oa.json a partir de los documentos en /corpus.

Fuente única de codigo/nivel/eje/texto: las Bases Curriculares (Parvularia y
1-6 basico). Los Programas de Estudio de Matematica (1-4 basico) y el Programa
Pedagogico NT1-NT2 quedan en /corpus como fuente futura de "indicadores", pero
no se parsean aqui: ver la nota en NOTA_INDICADORES mas abajo y en FUENTES.md.
"""
import json

NOTA_INDICADORES = (
    "indicadores queda vacio ([]) en esta etapa para TODOS los niveles, a proposito. "
    "Las Bases Curriculares (fuente de codigo/nivel/eje/texto) no incluyen indicadores. "
    "Los Programas de Estudio de Matematica 1-4 basico SI tienen una columna 'Indicadores "
    "de Evaluacion Sugeridos' por OA, pero su extraccion automatica desde el PDF resulto "
    "poco confiable (vinetas con caracteres corruptos, lineas de continuacion sin marca, "
    "y un recuadro de ejemplo en las paginas 24-25/53-54 de cada programa que reutiliza "
    "contenido de 4basico como plantilla ilustrativa, mezclado por pdftotext con el "
    "contenido real del nivel). Mineduc mismo los califica de 'sugeridos' (el docente "
    "puede complementarlos), por lo que se prefirio dejarlos vacios antes que arriesgar "
    "texto truncado o de otro nivel presentado como oficial. Quedan pendientes para una "
    "revision manual futura, pagina por pagina, de los Programas ya descargados en /corpus."
)

FUENTES = {
    "transicion": {
        "documento": "Bases Curriculares de la Educacion Parvularia (2018). Ambito Interaccion y Comprension del Entorno, Nucleo Pensamiento Matematico, Tercer Nivel (Transicion), paginas 96-99.",
        "url": "https://www.curriculumnacional.cl/614/articles-115247_bases.pdf",
        "archivo_local": "corpus/bases-parvularia-nucleo-pensamiento-matematico-extracto.pdf",
        "consultado": "2026-10-30"
    },
    "1-basico": {
        "documento": "Bases Curriculares 1º a 6º Basico (reedicion 2024). Matematica, 1º basico, Objetivos de Aprendizaje, pagina 227-229.",
        "url": "https://www.curriculumnacional.cl/sites/default/files/newtenberg/614/articles-22394_bases.pdf",
        "archivo_local": "corpus/bases-curriculares-1-6-basico.pdf",
        "consultado": "2026-10-30"
    },
    "2-basico": {
        "documento": "Bases Curriculares 1º a 6º Basico (reedicion 2024). Matematica, 2º basico, Objetivos de Aprendizaje, pagina 231-233.",
        "url": "https://www.curriculumnacional.cl/sites/default/files/newtenberg/614/articles-22394_bases.pdf",
        "archivo_local": "corpus/bases-curriculares-1-6-basico.pdf",
        "consultado": "2026-10-30"
    },
    "3-basico": {
        "documento": "Bases Curriculares 1º a 6º Basico (reedicion 2024). Matematica, 3º basico, Objetivos de Aprendizaje, pagina 235-239.",
        "url": "https://www.curriculumnacional.cl/sites/default/files/newtenberg/614/articles-22394_bases.pdf",
        "archivo_local": "corpus/bases-curriculares-1-6-basico.pdf",
        "consultado": "2026-10-30"
    },
    "4-basico": {
        "documento": "Bases Curriculares 1º a 6º Basico (reedicion 2024). Matematica, 4º basico, Objetivos de Aprendizaje, pagina 241-245.",
        "url": "https://www.curriculumnacional.cl/sites/default/files/newtenberg/614/articles-22394_bases.pdf",
        "archivo_local": "corpus/bases-curriculares-1-6-basico.pdf",
        "consultado": "2026-10-30"
    }
}

B = " • "  # separador de vinetas dentro de un mismo OA, igual convencion que Lectoguarida

def oa(codigo, nivel, numero, eje, texto):
    return {"codigo": codigo, "nivel": nivel, "numero": numero, "eje": eje, "texto": texto, "indicadores": []}

oas = []

# ---------------------------------------------------------------------------
# Transicion (NT1 y NT2) - Nucleo Pensamiento Matematico, un solo listado para
# ambos niveles (asi lo definen las Bases de Parvularia). Codigo propio
# NT-PM-OA-nn, igual convencion que NT-LV-OA-nn en Lectoguarida.
# ---------------------------------------------------------------------------
transicion_eje = "Pensamiento Matemático"
transicion_textos = [
    "Crear patrones sonoros, visuales, gestuales, corporales u otros, de dos o tres elementos.",
    "Experimentar con diversos objetos estableciendo relaciones al clasificar por dos o tres atributos a la vez (forma, color, tamaño, función, masa, materialidad, entre otros) y seriar por altura, ancho, longitud o capacidad para contener.",
    "Comunicar la posición de objetos y personas respecto de un punto u objeto de referencia, empleando conceptos de ubicación (dentro/fuera; encima/debajo/entre; al frente de/detrás de); distancia (cerca/lejos) y dirección (adelante/atrás/hacia el lado), en situaciones lúdicas.",
    "Emplear cuantificadores, tales como: “más que”, “menos que”, “igual que”, al comparar cantidades de objetos en situaciones cotidianas.",
    "Orientarse temporalmente en situaciones cotidianas, empleando nociones y relaciones de secuencia (antes/ahora/después/al mismo tiempo, día/noche), frecuencia (siempre/a veces/nunca) y duración (larga/corta).",
    "Emplear los números, para contar, identificar, cuantificar y comparar cantidades hasta el 20 e indicar orden o posición de algunos elementos en situaciones cotidianas o juegos.",
    "Representar números y cantidades hasta el 10, en forma concreta, pictórica y simbólica.",
    "Resolver problemas simples de manera concreta y pictórica agregando o quitando hasta 10 elementos, comunicando las acciones llevadas a cabo.",
    "Representar objetos desde arriba, del lado, abajo, a través de dibujos, fotografías o TICs, formulando conjeturas frente a sus descubrimientos.",
    "Identificar atributos de figuras 2D y 3D, tales como: forma, cantidad de lados, vértices, caras, que observa en forma directa o a través de TICs.",
    "Emplear medidas no estandarizadas, para determinar longitud de objetos, registrando datos, en diversas situaciones lúdicas o actividades cotidianas.",
    "Comunicar el proceso desarrollado en la resolución de problemas concretos, identificando la pregunta, acciones y posibles respuestas."
]
for i, texto in enumerate(transicion_textos, start=1):
    oas.append(oa(f"NT-PM-OA-{i:02d}", "transicion", i, transicion_eje, texto))

# ---------------------------------------------------------------------------
# 1 basico (20 OA)
# ---------------------------------------------------------------------------
n = "1-basico"
E_NUM, E_PAT, E_GEO, E_MED, E_DAT = "Números y Operaciones", "Patrones y Álgebra", "Geometría", "Medición", "Datos y Probabilidades"

items_1b = [
    (1, E_NUM, "Contar números del 0 al 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10, hacia adelante y hacia atrás, empezando por cualquier número menor que 100."),
    (2, E_NUM, "Identificar el orden de los elementos de una serie, utilizando números ordinales del primero (1º) al décimo (10º)."),
    (3, E_NUM, "Leer números del 0 al 20 y representarlos en forma concreta, pictórica y simbólica."),
    (4, E_NUM, "Comparar y ordenar números del 0 al 20 de menor a mayor y/o viceversa, utilizando material concreto y/o usando software educativo."),
    (5, E_NUM, "Estimar cantidades hasta 20 en situaciones concretas, usando un referente."),
    (6, E_NUM, "Componer y descomponer números del 0 a 20 de manera aditiva, en forma concreta, pictórica y simbólica."),
    (7, E_NUM, "Describir y aplicar estrategias de cálculo mental para las adiciones y las sustracciones hasta 20:" + B + "conteo hacia adelante y atrás" + B + "completar 10" + B + "dobles"),
    (8, E_NUM, "Determinar las unidades y decenas en números del 0 al 20, agrupando de a 10, de manera concreta, pictórica y simbólica."),
    (9, E_NUM, "Demostrar que comprenden la adición y la sustracción de números del 0 al 20 progresivamente, de 0 a 5, de 6 a 10, de 11 a 20 con dos sumandos:" + B +
        "usando un lenguaje cotidiano para describir acciones desde su propia experiencia" + B +
        "representando adiciones y sustracciones con material concreto y pictórico, de manera manual y/o usando software educativo" + B +
        "representando el proceso en forma simbólica" + B + "resolviendo problemas en contextos familiares" + B +
        "creando problemas matemáticos y resolviéndolos"),
    (10, E_NUM, "Demostrar que la adición y la sustracción son operaciones inversas, de manera concreta, pictórica y simbólica."),
    (11, E_PAT, "Reconocer, describir, crear y continuar patrones repetitivos (sonidos, figuras, ritmos...) y patrones numéricos hasta el 20, crecientes y decrecientes, usando material concreto, pictórico y simbólico, de manera manual y/o por medio de software educativo."),
    (12, E_PAT, "Describir y registrar la igualdad y la desigualdad como equilibrio y desequilibrio, usando una balanza en forma concreta, pictórica y simbólica del 0 al 20, usando el símbolo igual (=)."),
    (13, E_GEO, "Describir la posición de objetos y personas con relación a sí mismos y a otros objetos y personas, usando un lenguaje común (como derecha e izquierda)."),
    (14, E_GEO, "Identificar en el entorno figuras 3D y figuras 2D y relacionarlas, usando material concreto."),
    (15, E_GEO, "Identificar y dibujar líneas rectas y curvas."),
    (16, E_MED, "Usar unidades no estandarizadas de tiempo para comparar la duración de eventos cotidianos."),
    (17, E_MED, "Usar un lenguaje cotidiano para secuenciar eventos en el tiempo: días de la semana, meses del año y algunas fechas significativas."),
    (18, E_MED, "Identificar y comparar la longitud de objetos, usando palabras como largo y corto."),
    (19, E_DAT, "Recolectar y registrar datos para responder preguntas estadísticas sobre sí mismo y el entorno, usando bloques, tablas de conteo y pictogramas."),
    (20, E_DAT, "Construir, leer e interpretar pictogramas."),
]
for num, eje, texto in items_1b:
    oas.append(oa(f"MA01-OA-{num:02d}", n, num, eje, texto))

# ---------------------------------------------------------------------------
# 2 basico (22 OA)
# ---------------------------------------------------------------------------
n = "2-basico"
E_NUM2 = E_NUM  # normalizado a "Numeros y Operaciones" para consistencia entre niveles (Bases usa may/min distinta en 2basico)
items_2b = [
    (1, E_NUM2, "Contar números del 0 al 1 000 de 2 en 2, de 5 en 5, de 10 en 10 y de 100 en 100, hacia adelante y hacia atrás, empezando por cualquier número menor que 1 000."),
    (2, E_NUM2, "Leer números del 0 al 100 y representarlos en forma concreta, pictórica y simbólica."),
    (3, E_NUM2, "Comparar y ordenar números del 0 al 100 de menor a mayor y viceversa, usando material concreto y monedas nacionales de manera manual y/o por medio de software educativo."),
    (4, E_NUM2, "Estimar cantidades hasta 100 en situaciones concretas, usando un referente."),
    (5, E_NUM2, "Componer y descomponer números del 0 a 100 de manera aditiva, en forma concreta, pictórica y simbólica."),
    (6, E_NUM2, "Describir y aplicar estrategias de cálculo mental para adiciones y sustracciones hasta 20:" + B +
        "completar 10" + B + "usar dobles y mitades" + B + "“uno más uno menos”" + B + "“dos más dos menos”" + B +
        "usar la reversibilidad de las operaciones"),
    (7, E_NUM2, "Identificar las unidades y decenas en números del 0 al 100, representando las cantidades de acuerdo a su valor posicional, con material concreto, pictórico y simbólico."),
    (8, E_NUM2, "Demostrar y explicar de manera concreta, pictórica y simbólica el efecto de sumar y restar 0 a un número."),
    (9, E_NUM2, "Demostrar que comprende la adición y la sustracción en el ámbito del 0 al 100:" + B +
        "usando un lenguaje cotidiano y matemático para describir acciones desde su propia experiencia" + B +
        "resolviendo problemas con una variedad de representaciones concretas y pictóricas, de manera manual y/o usando software educativo" + B +
        "registrando el proceso en forma simbólica" + B +
        "aplicando los resultados de las adiciones y las sustracciones de los números del 0 a 20 sin realizar cálculos" + B +
        "aplicando el algoritmo de la adición y la sustracción sin considerar reserva" + B +
        "creando problemas matemáticos en contextos familiares y resolviéndolos"),
    (10, E_NUM2, "Demostrar que comprende la relación entre la adición y la sustracción al usar la “familia de operaciones” en cálculos aritméticos y la resolución de problemas."),
    (11, E_NUM2, "Demostrar que comprende la multiplicación:" + B +
        "usando representaciones concretas y pictóricas" + B +
        "expresando una multiplicación como una adición de sumandos iguales" + B +
        "usando la distributividad como estrategia para construir las tablas del 2, del 5 y del 10" + B +
        "resolviendo problemas que involucren las tablas del 2, del 5 y del 10."),
    (12, E_PAT, "Crear, representar y continuar una variedad de patrones numéricos y completar los elementos faltantes, de manera manual y/o usando software educativo."),
    (13, E_PAT, "Demostrar, explicar y registrar la igualdad y la desigualdad en forma concreta y pictórica del 0 al 20, usando el símbolo igual (=) y los símbolos no igual (>, <)."),
    (14, E_GEO, "Representar y describir la posición de objetos y personas con relación a sí mismos y a otros objetos y personas, incluyendo derecha e izquierda y usando material concreto y dibujos."),
    (15, E_GEO, "Describir, comparar y construir figuras 2D (triángulos, cuadrados, rectángulos y círculos) con material concreto."),
    (16, E_GEO, "Describir, comparar y construir figuras 3D (cubos, paralelepípedos, esferas y conos) con diversos materiales."),
    (17, E_MED, "Identificar días, semanas, meses y fechas en el calendario."),
    (18, E_MED, "Leer horas y medias horas en relojes digitales, en el contexto de la resolución de problemas."),
    (19, E_MED, "Determinar la longitud de objetos, usando unidades de medidas no estandarizadas y unidades estandarizadas (cm y m), en el contexto de la resolución de problemas."),
    (20, E_DAT, "Recolectar y registrar datos para responder preguntas estadísticas sobre juegos con monedas y dados, usando bloques y tablas de conteo y pictogramas."),
    (21, E_DAT, "Registrar en tablas y gráficos de barra simple, resultados de juegos aleatorios con dados y monedas."),
    (22, E_DAT, "Construir, leer e interpretar pictogramas con escala y gráficos de barra simple."),
]
for num, eje, texto in items_2b:
    oas.append(oa(f"MA02-OA-{num:02d}", n, num, eje, texto))

# ---------------------------------------------------------------------------
# 3 basico (26 OA)
# ---------------------------------------------------------------------------
n = "3-basico"
items_3b = [
    (1, E_NUM, "Contar números del 0 al 1 000 de 5 en 5, de 10 en 10, de 100 en 100:" + B +
        "empezando por cualquier número natural menor que 1.000" + B +
        "de 3 en 3, de 4 en 4..., empezando por cualquier múltiplo del número correspondiente"),
    (2, E_NUM, "Leer números hasta 1.000 y representarlos en forma concreta, pictórica y simbólica."),
    (3, E_NUM, "Comparar y ordenar números naturales hasta 1.000, utilizando la recta numérica o la tabla posicional de manera manual y/o por medio de software educativo."),
    (4, E_NUM, "Describir y aplicar estrategias de cálculo mental para las adiciones y las sustracciones hasta 100:" + B +
        "por descomposición" + B + "completar hasta la decena más cercana" + B + "usar dobles" + B +
        "sumar en vez de restar" + B + "aplicar la asociatividad"),
    (5, E_NUM, "Identificar y describir las unidades, las decenas y las centenas en números del 0 al 1.000, representando las cantidades de acuerdo a su valor posicional, con material concreto, pictórico y simbólico."),
    (6, E_NUM, "Demostrar que comprenden la adición y la sustracción de números del 0 al 1.000:" + B +
        "usando estrategias personales con y sin material concreto" + B +
        "creando y resolviendo problemas de adición y sustracción que involucren operaciones combinadas, en forma concreta, pictórica y simbólica, de manera manual y/o por medio de software educativo" + B +
        "aplicando los algoritmos con y sin reserva, progresivamente, en la adición de hasta cuatro sumandos y en la sustracción de hasta un sustraendo"),
    (7, E_NUM, "Demostrar que comprenden la relación entre la adición y la sustracción, usando la “familia de operaciones” en cálculos aritméticos y en la resolución de problemas."),
    (8, E_NUM, "Demostrar que comprenden las tablas de multiplicar hasta el 10 de manera progresiva:" + B +
        "usando representaciones concretas y pictóricas" + B +
        "expresando una multiplicación como una adición de sumandos iguales" + B +
        "usando la distributividad como estrategia para construir las tablas hasta el 10" + B +
        "aplicando los resultados de las tablas de multiplicación hasta 10 · 10, sin realizar cálculos" + B +
        "resolviendo problemas que involucren las tablas aprendidas hasta el 10"),
    (9, E_NUM, "Demostrar que comprenden la división en el contexto de las tablas de hasta 10 · 10:" + B +
        "representando y explicando la división como repartición y agrupación en partes iguales, con material concreto y pictórico" + B +
        "creando y resolviendo problemas en contextos que incluyan la repartición y la agrupación" + B +
        "expresando la división como una sustracción repetida" + B +
        "describiendo y aplicando la relación inversa entre la división y la multiplicación" + B +
        "aplicando los resultados de las tablas de multiplicación hasta 10 · 10, sin realizar cálculos"),
    (10, E_NUM, "Resolver problemas rutinarios en contextos cotidianos, que incluyan dinero e involucren las cuatro operaciones (no combinadas)."),
    (11, E_NUM, "Demostrar que comprenden las fracciones de uso común: 1/2, 1/3, 1/4, 2/3 y 3/4:" + B +
        "explicando que una fracción representa la parte de un todo, de manera concreta, pictórica, simbólica, de forma manual y/o con software educativo" + B +
        "describiendo situaciones en las cuales se puede usar fracciones" + B +
        "comparando fracciones de un mismo todo, de igual denominador"),
    (12, E_PAT, "Generar, describir y registrar patrones numéricos, usando una variedad de estrategias en tablas del 100, de manera manual y/o con software educativo."),
    (13, E_PAT, "Resolver ecuaciones de un paso que involucren adiciones y sustracciones y un símbolo geométrico que represente un número desconocido, en forma pictórica y simbólica del 0 al 100."),
    (14, E_GEO, "Describir la localización de un objeto en un mapa simple o en una cuadrícula."),
    (15, E_GEO, "Demostrar que comprenden la relación que existe entre figuras 3D y figuras 2D:" + B +
        "construyendo una figura 3D a partir de una red (plantilla)" + B + "desplegando la figura 3D"),
    (16, E_GEO, "Describir cubos, paralelepípedos, esferas, conos, cilindros y pirámides de acuerdo a la forma de sus caras y el número de aristas y vértices."),
    (17, E_GEO, "Reconocer en el entorno figuras 2D que están trasladadas, reflejadas y rotadas."),
    (18, E_GEO, "Demostrar que comprenden el concepto de ángulo:" + B +
        "identificando ejemplos de ángulos en el entorno" + B +
        "estimando la medida de ángulos, usando como referente ángulos de 45º y de 90º"),
    (19, E_MED, "Leer e interpretar líneas de tiempo y calendarios."),
    (20, E_MED, "Leer y registrar el tiempo en horas, medias horas, cuartos de hora y minutos en relojes análogos y digitales."),
    (21, E_MED, "Demostrar que comprenden el perímetro de una figura regular e irregular:" + B +
        "midiendo y registrando el perímetro de figuras del entorno en el contexto de la resolución de problemas" + B +
        "determinando el perímetro de un cuadrado y de un rectángulo"),
    (22, E_MED, "Demostrar que comprende la medición del peso (g y kg):" + B +
        "comparando y ordenando dos o más objetos a partir de su peso de manera informal" + B +
        "usando modelos para explicar la relación que existe entre gramos y kilogramos" + B +
        "estimando el peso de objetos de uso cotidiano, usando referentes" + B +
        "midiendo y registrando el peso de objetos en números y en fracciones de uso común, en el contexto de la resolución de problemas"),
    (23, E_DAT, "Realizar encuestas, clasificar y organizar los datos obtenidos en tablas y visualizarlos en gráficos de barra."),
    (24, E_DAT, "Registrar y ordenar datos obtenidos de juegos aleatorios con dados y monedas, encontrando el menor, el mayor y estimando el punto medio entre ambos."),
    (25, E_DAT, "Construir, leer e interpretar pictogramas y gráficos de barra simple con escala, de acuerdo a información recolectada o dada."),
    (26, E_DAT, "Representar datos usando diagramas de puntos."),
]
for num, eje, texto in items_3b:
    oas.append(oa(f"MA03-OA-{num:02d}", n, num, eje, texto))

# ---------------------------------------------------------------------------
# 4 basico (27 OA)
# ---------------------------------------------------------------------------
n = "4-basico"
items_4b = [
    (1, E_NUM, "Representar y describir números del 0 al 10 000:" + B +
        "contándolos de 10 en 10, de 100 en 100, de 1 000 en 1 000" + B +
        "leyéndolos y escribiéndolos" + B + "representándolos en forma concreta, pictórica y simbólica" + B +
        "comparándolos y ordenándolos en la recta numérica o la tabla posicional" + B +
        "identificando el valor posicional de los dígitos hasta la decena de mil" + B +
        "componiendo y descomponiendo números naturales hasta 10 000 en forma aditiva, de acuerdo a su valor posicional"),
    (2, E_NUM, "Describir y aplicar estrategias de cálculo mental para determinar las multiplicaciones hasta 10 · 10 y sus divisiones correspondientes:" + B +
        "conteo hacia delante y atrás" + B + "doblar y dividir por 2" + B + "por descomposición" + B + "usar el doble del doble"),
    (3, E_NUM, "Demostrar que comprenden la adición y la sustracción de números hasta 1 000:" + B +
        "usando estrategias personales para realizar estas operaciones" + B +
        "descomponiendo los números involucrados" + B + "estimando sumas y diferencias" + B +
        "resolviendo problemas rutinarios y no rutinarios que incluyan adiciones y sustracciones" + B +
        "aplicando los algoritmos en la adición de hasta cuatro sumandos y en la sustracción de hasta un sustraendo"),
    (4, E_NUM, "Fundamentar y aplicar las propiedades del 0 y del 1 para la multiplicación y la propiedad del 1 para la división."),
    (5, E_NUM, "Demostrar que comprenden la multiplicación de números de tres dígitos por números de un dígito:" + B +
        "usando estrategias con o sin material concreto" + B + "utilizando las tablas de multiplicación" + B +
        "estimando productos" + B + "usando la propiedad distributiva de la multiplicación respecto de la suma" + B +
        "aplicando el algoritmo de la multiplicación" + B + "resolviendo problemas rutinarios"),
    (6, E_NUM, "Demostrar que comprenden la división con dividendos de dos dígitos y divisores de un dígito:" + B +
        "usando estrategias para dividir, con o sin material concreto" + B +
        "utilizando la relación que existe entre la división y la multiplicación" + B + "estimando el cociente" + B +
        "aplicando la estrategia por descomposición del dividendo" + B + "aplicando el algoritmo de la división"),
    (7, E_NUM, "Resolver problemas rutinarios y no rutinarios en contextos cotidianos que incluyen dinero, seleccionando y utilizando la operación apropiada."),
    (8, E_NUM, "Demostrar que comprende las fracciones con denominadores 100, 12, 10, 8, 6, 5, 4, 3, 2:" + B +
        "explicando que una fracción representa la parte de un todo o de un grupo de elementos y un lugar en la recta numérica" + B +
        "describiendo situaciones en las cuales se puede usar fracciones" + B +
        "mostrando que una fracción puede tener representaciones diferentes" + B +
        "comparando y ordenando fracciones (por ejemplo: 1/100, 1/8, 1/5, 1/4, 1/2) con material concreto y pictórico"),
    (9, E_NUM, "Resolver adiciones y sustracciones de fracciones con igual denominador (denominadores 100, 12, 10, 8, 6, 5, 4, 3, 2) de manera concreta y pictórica en el contexto de la resolución de problemas."),
    (10, E_NUM, "Identificar, escribir y representar fracciones propias y los números mixtos hasta el 5 de manera concreta, pictórica y simbólica, en el contexto de la resolución de problemas."),
    (11, E_NUM, "Describir y representar decimales (décimos y centésimos):" + B +
        "representándolos en forma concreta, pictórica y simbólica, de manera manual y/o con software educativo" + B +
        "comparándolos y ordenándolos hasta la centésima"),
    (12, E_NUM, "Resolver adiciones y sustracciones de decimales, empleando el valor posicional hasta la centésima en el contexto de la resolución de problemas."),
    (13, E_PAT, "Identificar y describir patrones numéricos en tablas que involucren una operación, de manera manual y/o usando software educativo."),
    (14, E_PAT, "Resolver ecuaciones e inecuaciones de un paso que involucren adiciones y sustracciones, comprobando los resultados en forma pictórica y simbólica del 0 al 100 y aplicando las relaciones inversas entre la adición y la sustracción."),
    (15, E_GEO, "Describir la localización absoluta de un objeto en un mapa simple con coordenadas informales (por ejemplo: con letras y números) y la localización relativa con relación a otros objetos."),
    (16, E_GEO, "Determinar las vistas de figuras 3D desde el frente, desde el lado y desde arriba."),
    (17, E_GEO, "Demostrar que comprenden una línea de simetría:" + B +
        "identificando figuras simétricas 2D" + B + "creando figuras simétricas 2D" + B +
        "dibujando una o más líneas de simetría en figuras 2D" + B + "usando software geométrico"),
    (18, E_GEO, "Trasladar, rotar y reflejar figuras 2D."),
    (19, E_GEO, "Construir ángulos con el transportador y compararlos."),
    (20, E_MED, "Leer y registrar diversas mediciones del tiempo en relojes análogos y digitales, usando los conceptos A.M., P.M. y 24 horas."),
    (21, E_MED, "Realizar conversiones entre unidades de tiempo en el contexto de la resolución de problemas: el número de segundos en un minuto, el número de minutos en una hora, el número de días en un mes y el número de meses en un año."),
    (22, E_MED, "Medir longitudes con unidades estandarizadas (m, cm) y realizar transformaciones entre estas unidades (m a cm y viceversa) en el contexto de la resolución de problemas."),
    (23, E_MED, "Demostrar que comprenden el concepto de área de un rectángulo y de un cuadrado:" + B +
        "reconociendo que el área de una superficie se mide en unidades cuadradas" + B +
        "seleccionando y justificando la elección de la unidad estandarizada (cm2 y m2)" + B +
        "determinando y registrando el área en cm2 y m2 en contextos cercanos" + B +
        "construyendo diferentes rectángulos para un área dada (cm2 y m2), para mostrar que distintos rectángulos pueden tener la misma área" + B +
        "usando software geométrico"),
    (24, E_MED, "Demostrar que comprenden el concepto de volumen de un cuerpo:" + B +
        "seleccionando una unidad no estandarizada para medir el volumen de un cuerpo" + B +
        "reconociendo que el volumen se mide en unidades de cubo" + B +
        "midiendo y registrando el volumen en unidades de cubo" + B + "usando software geométrico"),
    (25, E_DAT, "Realizar encuestas, analizar los datos y comparar con los resultados de muestras aleatorias, usando tablas y gráficos."),
    (26, E_DAT, "Realizar experimentos aleatorios lúdicos y cotidianos, y tabular y representar mediante gráficos de manera manual y/o con software educativo."),
    (27, E_DAT, "Leer e interpretar pictogramas y gráficos de barra simple con escala y comunicar sus conclusiones."),
]
for num, eje, texto in items_4b:
    oas.append(oa(f"MA04-OA-{num:02d}", n, num, eje, texto))

# ---------------------------------------------------------------------------
# Ensamblar y escribir
# ---------------------------------------------------------------------------
data = {
    "version": "1.0.0",
    "generado": "2026-10-30",
    "description": (
        "Catalogo oficial de los Objetivos de Aprendizaje (OA) de Matematica que trabaja "
        "Mateguarida, copiados de los documentos del Mineduc. Es la unica fuente de codigos "
        "OA para el resto del proyecto. Solo incluye OA de CONTENIDO (numerados, asociados a "
        "un eje); las Habilidades y Actitudes transversales de cada nivel (letras a-n, sin eje "
        "propio) quedan fuera de este archivo a proposito y pueden agregarse despues como una "
        "lista aparte si se necesitan. Las vinetas internas de un mismo OA van separadas por "
        "' • ' (igual convencion que oa-oficiales.json de Lectoguarida). " + NOTA_INDICADORES
    ),
    "fuentes": FUENTES,
    "oa": oas
}

with open("../data/oa.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

# Resumen por nivel y eje
from collections import defaultdict
resumen = defaultdict(lambda: defaultdict(int))
for o in oas:
    resumen[o["nivel"]][o["eje"]] += 1

print(f"Total OA: {len(oas)}\n")
orden_niveles = ["transicion", "1-basico", "2-basico", "3-basico", "4-basico"]
for nivel in orden_niveles:
    ejes = resumen[nivel]
    total_nivel = sum(ejes.values())
    print(f"{nivel} ({total_nivel} OA):")
    for eje, c in ejes.items():
        print(f"  - {eje}: {c}")
    print()
