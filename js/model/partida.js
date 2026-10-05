// estado del tablero: array plano de N×N, cada celda guarda un tipo (0, 1 o 2)
export const TIPOS = 3;

export class Partida {
  #n;
  #celdas;
  #movimientos = 0;

  constructor(n) {
    // Hace falta al menos una fila por tipo (con menos, el tablero no se puede generar).
    if (!Number.isInteger(n) || n < TIPOS) throw new RangeError(`Dimensión no válida: ${n}`);
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

  mismoTipo(a, b) {
    return this.#esCelda(a) && this.#esCelda(b) && this.#celdas[a] === this.#celdas[b];
  }

  intercambiar(a, b) {
    if (a === b || this.terminada || !this.#esCelda(a) || !this.#esCelda(b) || this.mismoTipo(a, b)) return false;
    [this.#celdas[a], this.#celdas[b]] = [this.#celdas[b], this.#celdas[a]];
    this.#movimientos++;
    return true;
  }

  filasCompletas() {
    return filasDe(this.#celdas, this.#n).map((fila) => fila.every((tipo) => tipo === fila[0]));
  }

  // devuelve [a, b] o null si ya está resuelto
  // busca primero un intercambio que coloque 2 fichas a la vez; si no hay, uno que coloque 1
  pista() {
    if (this.terminada) return null;

    const objetivo = this.#objetivoPorFila();
    const fueraDeSitio = [...this.#celdas.keys()].filter((indice) => this.#celdas[indice] !== objetivo[this.posicion(indice).fila]);

    let sencilla = null;
    for (const a of fueraDeSitio) {
      const tipoA = this.#celdas[a];
      const filaA = this.posicion(a).fila;
      for (const b of fueraDeSitio) {
        if (objetivo[this.posicion(b).fila] !== tipoA) continue;
        // intercambio doble: a y b quedan los dos en su fila correcta
        if (this.#celdas[b] === objetivo[filaA]) return [a, b];
        // intercambio simple: al menos a queda en su fila
        if (sencilla === null) sencilla = [a, b];
      }
    }
    return sencilla;
  }

  // asigna a cada fila el tipo que tiene más fichas en ella (respetando los cupos)
  #objetivoPorFila() {
    const filas = filasDe(this.#celdas, this.#n);
    const cupos = contarTipos(this.#celdas).map((c) => c / this.#n);
    return filas.map((fila) => {
      const cuenta = contarTipos(fila);
      let mejor = 0;
      for (let t = 1; t < TIPOS; t++) {
        if (cupos[t] > 0 && (cupos[mejor] === 0 || cuenta[t] > cuenta[mejor])) mejor = t;
      }
      cupos[mejor]--;
      return mejor;
    });
  }

  #esCelda(indice) {
    return Number.isInteger(indice) && indice >= 0 && indice < this.#celdas.length;
  }
}

// genera un tablero siempre resoluble: reparte las N filas entre los 3 tipos lo más
// igualadamente posible y mezcla hasta que ninguna fila empiece ya completa
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
