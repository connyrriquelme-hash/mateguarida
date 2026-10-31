/**
 * dom.js
 * Ayudante para construir DOM. Todo el texto entra con textContent, nunca con
 * innerHTML: los nombres de los niños son datos de menores y jamas se
 * interpretan como HTML. (Mismo patron que Lectoguarida.)
 */

/**
 * Crea un nodo.
 *   attrs: class, texto, on<evento> (funcion) y cualquier atributo.
 *          true escribe el atributo vacio (disabled); false/null/undefined lo omite.
 *   hijos: nodos o textos; admite arreglos y descarta null/false.
 */
export function h(doc, etiqueta, attrs = {}, ...hijos) {
  const nodo = doc.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(attrs)) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (clave === 'class') nodo.className = valor;
    else if (clave === 'texto') nodo.textContent = valor;
    else if (clave.startsWith('on')) nodo.addEventListener(clave.slice(2), valor);
    else if (valor === true) nodo.setAttribute(clave, '');
    else nodo.setAttribute(clave, String(valor));
  }
  for (const hijo of hijos.flat()) {
    if (hijo === undefined || hijo === null || hijo === false) continue;
    nodo.append(typeof hijo === 'string' ? doc.createTextNode(hijo) : hijo);
  }
  return nodo;
}
