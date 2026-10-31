# -*- coding: utf-8 -*-
"""
Construye ../data/habilidades.json a partir de las Bases Curriculares 1-6
basico (misma fuente y mismo documento que data/oa.json, ver corpus/FUENTES.md).

Las Habilidades de Matematica (Resolver problemas, Argumentar y comunicar,
Modelar, Representar) son transversales a los ejes: no tienen un "eje" propio,
por eso viven en un archivo separado y no en data/oa.json. Transicion (NT1/NT2)
no tiene una lista de habilidades con este mismo formato en las Bases de
Parvularia (las habilidades van integradas en el texto de cada OA), asi que
este archivo solo cubre 1-4 basico.
"""
import json

FUENTE = {
    "documento": "Bases Curriculares 1º a 6º Basico (reedicion 2024). Matematica, Objetivos de Aprendizaje de Habilidades, paginas 226, 230, 234, 240.",
    "url": "https://www.curriculumnacional.cl/sites/default/files/newtenberg/614/articles-22394_bases.pdf",
    "archivo_local": "corpus/bases-curriculares-1-6-basico.pdf",
    "consultado": "2026-10-30"
}

B = " • "

def h(codigo, nivel, letra, categoria, texto):
    return {"codigo": codigo, "nivel": nivel, "letra": letra, "categoria": categoria, "texto": texto}

habilidades = []

# ---------------------------------------------------------------------------
# 1 basico (a-j, 10 habilidades)
# ---------------------------------------------------------------------------
n = "1-basico"
items = [
    ("a", "Resolver problemas", "Emplear diversas estrategias para resolver problemas."),
    ("b", "Resolver problemas", "Comprobar enunciados, usando material concreto y gráfico."),
    ("c", "Resolver problemas", "Expresar un problema con sus propias palabras."),
    ("d", "Argumentar y comunicar", "Describir situaciones del entorno con lenguaje matemático."),
    ("e", "Argumentar y comunicar", "Comunicar el resultado de descubrimientos de relaciones, patrones y reglas, entre otros, empleando expresiones matemáticas."),
    ("f", "Argumentar y comunicar", "Explicar las soluciones propias y los procedimientos utilizados."),
    ("g", "Modelar", "Aplicar modelos que involucren sumas, restas y orden de cantidades."),
    ("h", "Modelar", "Expresar, a partir de representaciones pictóricas y explicaciones dadas, acciones y situaciones cotidianas en lenguaje matemático."),
    ("i", "Representar", "Elegir y utilizar representaciones concretas, pictóricas y simbólicas para representar enunciados."),
    ("j", "Representar", "Crear un relato basado en una expresión matemática simple."),
]
for letra, categoria, texto in items:
    habilidades.append(h(f"MA01-OAH-{letra}", n, letra, categoria, texto))

# ---------------------------------------------------------------------------
# 2 basico (a-i, 9 habilidades)
# ---------------------------------------------------------------------------
n = "2-basico"
items = [
    ("a", "Resolver problemas", "Emplear diversas estrategias para resolver problemas:" + B + "por medio de ensayo y error" + B + "aplicando conocimientos adquiridos"),
    ("b", "Resolver problemas", "Comprobar enunciados, usando material concreto y gráfico."),
    ("c", "Argumentar y comunicar", "Describir situaciones de la realidad con lenguaje matemático."),
    ("d", "Argumentar y comunicar", "Comunicar el resultado de descubrimientos de relaciones, patrones y reglas, entre otros, empleando expresiones matemáticas."),
    ("e", "Argumentar y comunicar", "Explicar las soluciones propias y los procedimientos utilizados."),
    ("f", "Modelar", "Aplicar y seleccionar modelos que involucren sumas, restas y orden de cantidades."),
    ("g", "Modelar", "Expresar, a partir de representaciones pictóricas y explicaciones dadas, acciones y situaciones cotidianas en lenguaje matemático."),
    ("h", "Representar", "Elegir y utilizar representaciones concretas, pictóricas y simbólicas para representar enunciados."),
    ("i", "Representar", "Crear un relato basado en una expresión matemática simple."),
]
for letra, categoria, texto in items:
    habilidades.append(h(f"MA02-OAH-{letra}", n, letra, categoria, texto))

# ---------------------------------------------------------------------------
# 3 basico (a-n, 14 habilidades)
# ---------------------------------------------------------------------------
n = "3-basico"
items = [
    ("a", "Resolver problemas", "Resolver problemas dados o creados."),
    ("b", "Resolver problemas", "Emplear diversas estrategias para resolver problemas y alcanzar respuestas adecuadas, como la estrategia de los 4 pasos: entender, planificar, hacer y comprobar."),
    ("c", "Resolver problemas", "Transferir los procedimientos utilizados en situaciones ya resueltas a problemas similares."),
    ("d", "Argumentar y comunicar", "Formular preguntas para profundizar el conocimiento y la comprensión."),
    ("e", "Argumentar y comunicar", "Descubrir regularidades matemáticas –la estructura de las operaciones inversas, el valor posicional en el sistema decimal, patrones como los múltiplos– y comunicarlas a otros."),
    ("f", "Argumentar y comunicar", "Hacer deducciones matemáticas de manera concreta."),
    ("g", "Argumentar y comunicar", "Describir una situación del entorno con una expresión matemática, con una ecuación o con una representación pictórica."),
    ("h", "Argumentar y comunicar", "Escuchar el razonamiento de otros para enriquecerse y para corregir errores."),
    ("i", "Modelar", "Aplicar, seleccionar y evaluar modelos que involucren las cuatro operaciones y la ubicación en la recta numérica y en el plano."),
    ("j", "Modelar", "Expresar, a partir de representaciones pictóricas y explicaciones dadas, acciones y situaciones cotidianas en lenguaje matemático."),
    ("k", "Modelar", "Identificar regularidades en expresiones numéricas y geométricas."),
    ("l", "Representar", "Utilizar formas de representación adecuadas, como esquemas y tablas, con un lenguaje técnico específico y con los símbolos matemáticos correctos."),
    ("m", "Representar", "Crear un problema real a partir de una expresión matemática, una ecuación o una representación."),
    ("n", "Representar", "Transferir una situación de un nivel de representación a otro (por ejemplo: de lo concreto a lo pictórico y de lo pictórico a lo simbólico, y viceversa)."),
]
for letra, categoria, texto in items:
    habilidades.append(h(f"MA03-OAH-{letra}", n, letra, categoria, texto))

# ---------------------------------------------------------------------------
# 4 basico (a-n, 14 habilidades)
# ---------------------------------------------------------------------------
n = "4-basico"
items = [
    ("a", "Resolver problemas", "Resolver problemas dados o creados."),
    ("b", "Resolver problemas", "Emplear diversas estrategias para resolver problemas y alcanzar respuestas adecuadas, como la estrategia de los 4 pasos: entender, planificar, hacer y comprobar."),
    ("c", "Resolver problemas", "Transferir los procedimientos utilizados en situaciones ya resueltas a problemas similares."),
    ("d", "Argumentar y comunicar", "Formular preguntas para profundizar el conocimiento y la comprensión."),
    ("e", "Argumentar y comunicar", "Descubrir regularidades matemáticas –la estructura de las operaciones inversas, el valor posicional en el sistema decimal, patrones como los múltiplos– y comunicarlas a otros."),
    ("f", "Argumentar y comunicar", "Hacer deducciones matemáticas."),
    ("g", "Argumentar y comunicar", "Comprobar una solución y fundamentar su razonamiento."),
    ("h", "Argumentar y comunicar", "Escuchar el razonamiento de otros para enriquecerse y para corregir errores."),
    ("i", "Modelar", "Aplicar, seleccionar, modificar y evaluar modelos que involucren las cuatro operaciones con números naturales y fracciones, la ubicación en la recta numérica y en el plano, y el análisis de datos."),
    ("j", "Modelar", "Expresar, a partir de representaciones pictóricas y explicaciones dadas, acciones y situaciones cotidianas en lenguaje matemático."),
    ("k", "Modelar", "Identificar regularidades en expresiones numéricas y geométricas."),
    ("l", "Representar", "Utilizar formas de representación adecuadas, como esquemas y tablas, con un lenguaje técnico específico y con los símbolos matemáticos correctos."),
    ("m", "Representar", "Crear un problema real a partir de una expresión matemática, una ecuación o una representación."),
    ("n", "Representar", "Transferir una situación de un nivel de representación a otro (por ejemplo: de lo concreto a lo pictórico y de lo pictórico a lo simbólico, y viceversa)."),
]
for letra, categoria, texto in items:
    habilidades.append(h(f"MA04-OAH-{letra}", n, letra, categoria, texto))

data = {
    "version": "1.0.0",
    "generado": "2026-10-30",
    "description": (
        "Habilidades de Matematica (transversales a los ejes: Resolver problemas, "
        "Argumentar y comunicar, Modelar, Representar), copiadas literalmente de las "
        "Bases Curriculares 1-6 basico. Viven separadas de data/oa.json porque no tienen "
        "un eje propio (son transversales a Numeros y Operaciones, Patrones y Algebra, "
        "Geometria, Medicion y Datos y Probabilidades). codigo usa el patron "
        "MAnn-OAH-<letra> (OAH = Objetivo de Aprendizaje de Habilidad), para no "
        "confundirse con los codigos de contenido MAnn-OA-nn de data/oa.json. "
        "Transicion (NT1/NT2) no tiene una lista separada de habilidades en este "
        "formato en las Bases de Parvularia -sus habilidades van integradas en el "
        "texto de cada OA de Pensamiento Matematico-, por eso no aparece aqui. "
        "Las vinetas internas de una misma habilidad van separadas por ' • '."
    ),
    "fuente": FUENTE,
    "habilidades": habilidades
}

with open("../data/habilidades.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

from collections import defaultdict
resumen = defaultdict(lambda: defaultdict(int))
for x in habilidades:
    resumen[x["nivel"]][x["categoria"]] += 1

print(f"Total habilidades: {len(habilidades)}\n")
for nivel in ["1-basico", "2-basico", "3-basico", "4-basico"]:
    cats = resumen[nivel]
    print(f"{nivel} ({sum(cats.values())} habilidades):")
    for cat, c in cats.items():
        print(f"  - {cat}: {c}")
    print()
