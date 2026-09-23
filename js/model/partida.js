// MODELO: estado y reglas de una partida. No conoce el DOM ni el aspecto de las fichas:
// cada ficha es solo un tipo (0, 1 o 2) guardado en un array plano de N×N celdas,
// recorrido por filas (celda i → fila Math.floor(i / N), columna i % N).
export const TIPOS = 3;

export class Partida {
  #n;
  #celdas;
  #movimientos = 0;

  constructor(n) {
    this.#n = n;
    this.#celdas = generarTablero(n);
  }

  get n() {
    return this.#n;
  }

  get movimientos() {
    return this.#movimientos;
  }

  get celdas() {
    return [...this.#celdas];
  }

  get terminada() {
    return this.filasCompletas().every(Boolean);
  }

  tipoEn(indice) {
    return this.#celdas[indice];
  }

  posicion(indice) {
    return { fila: Math.floor(indice / this.#n), columna: indice % this.#n };
  }

  // Intercambia las fichas de dos celdas. Devuelve false si el movimiento no es válido.
  intercambiar(a, b) {
    if (a === b || this.terminada || !this.#esCelda(a) || !this.#esCelda(b)) return false;
    [this.#celdas[a], this.#celdas[b]] = [this.#celdas[b], this.#celdas[a]];
    this.#movimientos++;
    return true;
  }

  // Array de booleanos: true si todas las fichas de esa fila son del mismo tipo.
  filasCompletas() {
    return filasDe(this.#celdas, this.#n).map((fila) => fila.every((tipo) => tipo === fila[0]));
  }

  // Sugiere un intercambio [a, b] que acerca el tablero a la solución, o null si ya está resuelto.
  // Primero se calcula qué tipo debería acabar en cada fila (el reparto que deja más fichas
  // en su sitio); después se busca un intercambio que coloque dos fichas a la vez y, si no
  // existe, uno que coloque al menos una. Nunca se mueve una ficha que ya está en su fila.
  pista() {
    if (this.terminada) return null;

    const objetivo = this.#objetivoPorFila();
    const fueraDeSitio = this.#celdas
      .map((tipo, indice) => indice)
      .filter((indice) => this.#celdas[indice] !== objetivo[this.posicion(indice).fila]);

    let sencilla = null;
    for (const a of fueraDeSitio) {
      const tipoA = this.#celdas[a];
      const filaA = this.posicion(a).fila;
      for (const b of fueraDeSitio) {
        if (objetivo[this.posicion(b).fila] !== tipoA) continue;
        if (this.#celdas[b] === objetivo[filaA]) return [a, b];
        sencilla ??= [a, b];
      }
    }
    return sencilla;
  }

  // Asignación fila → tipo que maximiza las fichas ya colocadas, respetando cuántas filas
  // corresponden a cada tipo. Programación dinámica sobre (fila, filas restantes por tipo).
  #objetivoPorFila() {
    const n = this.#n;
    const filas = filasDe(this.#celdas, n);
    const aciertos = filas.map((fila) => contarTipos(fila));
    const restantes = contarTipos(this.#celdas).map((cantidad) => cantidad / n);
    const memoria = new Map();

    const mejor = (fila, cupos) => {
      if (fila === n) return { puntos: 0, reparto: [] };
      const clave = `${fila}:${cupos}`;
      if (memoria.has(clave)) return memoria.get(clave);

      let resultado = { puntos: -1, reparto: [] };
      for (let tipo = 0; tipo < TIPOS; tipo++) {
        if (cupos[tipo] === 0) continue;
        const siguientes = cupos.with(tipo, cupos[tipo] - 1);
        const resto = mejor(fila + 1, siguientes);
        const puntos = aciertos[fila][tipo] + resto.puntos;
        if (puntos > resultado.puntos) resultado = { puntos, reparto: [tipo, ...resto.reparto] };
      }
      memoria.set(clave, resultado);
      return resultado;
    };

    return mejor(0, restantes).reparto;
  }

  #esCelda(indice) {
    return Number.isInteger(indice) && indice >= 0 && indice < this.#celdas.length;
  }
}

// Tablero inicial aleatorio y resoluble: cada tipo aparece un número de veces múltiplo de N
// (tantas filas completas como le toquen), así siempre es posible llenar cada fila con un
// único tipo. Las N filas se reparten lo más equilibradamente posible entre los 3 tipos.
function generarTablero(n) {
  const filasPorTipo = Array(TIPOS).fill(Math.floor(n / TIPOS));
  barajar([...filasPorTipo.keys()])
    .slice(0, n % TIPOS)
    .forEach((tipo) => filasPorTipo[tipo]++);

  const fichas = filasPorTipo.flatMap((filas, tipo) => Array(filas * n).fill(tipo));

  let celdas;
  do {
    celdas = barajar(fichas);
  } while (filasDe(celdas, n).some((fila) => fila.every((tipo) => tipo === fila[0])));
  return celdas;
}

function filasDe(celdas, n) {
  return Array.from({ length: n }, (_, fila) => celdas.slice(fila * n, (fila + 1) * n));
}

function contarTipos(fichas) {
  const cuenta = Array(TIPOS).fill(0);
  fichas.forEach((tipo) => cuenta[tipo]++);
  return cuenta;
}

// Fisher-Yates sobre una copia.
function barajar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
