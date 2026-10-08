import { TIPOS } from "./constantes.js";

/** Estado de la partida: array plano de N×N con el tipo de cada celda. */
export class Partida {
  #n;
  #celdas;
  #historial = []; // pares [a, b] intercambiados, para deshacer

  constructor(n) {
    // Hace falta al menos una fila por tipo para generar el tablero.
    if (!Number.isInteger(n) || n < TIPOS) throw new RangeError(`Dimensión no válida: ${n}`);
    this.#n = n;
    this.#celdas = generarTablero(n);
  }

  get n() {
    return this.#n;
  }

  get movimientos() {
    return this.#historial.length;
  }

  get celdas() {
    return [...this.#celdas];
  }

  get terminada() {
    return this.filasCompletas().every(Boolean);
  }

  get puedeDeshacer() {
    return this.#historial.length > 0 && !this.terminada;
  }

  /** Tipo de la ficha en la celda indicada. */
  tipoEn(indice) {
    return this.#celdas[indice];
  }

  /** Fila y columna (desde 0) de un índice. */
  posicion(indice) {
    return { fila: Math.floor(indice / this.#n), columna: indice % this.#n };
  }

  mismoTipo(a, b) {
    return this.#esCelda(a) && this.#esCelda(b) && this.#celdas[a] === this.#celdas[b];
  }

  /** Intercambia dos fichas de distinto tipo; devuelve false si el movimiento no vale. */
  intercambiar(a, b) {
    if (a === b || this.terminada || !this.#esCelda(a) || !this.#esCelda(b) || this.mismoTipo(a, b)) return false;
    this.#cambiar(a, b);
    this.#historial.push([a, b]);
    return true;
  }

  /** Revierte el último intercambio; devuelve el par [a, b] o null si no hay nada que deshacer. */
  deshacer() {
    if (!this.puedeDeshacer) return null;
    const par = this.#historial.pop();
    this.#cambiar(...par);
    return par;
  }

  /** Para cada fila, true si todas sus fichas son del mismo tipo. */
  filasCompletas() {
    return filasDe(this.#celdas, this.#n).map((fila) => fila.every((tipo) => tipo === fila[0]));
  }

  /**
   * Intercambio útil según el reparto óptimo de tipos por fila; prioriza el que coloca dos fichas.
   * @returns {number[]|null} Índices [a, b], o null si ya está resuelto.
   */
  pista() {
    if (this.terminada) return null;

    const objetivo = repartoOptimo(this.#celdas, this.#n);
    const filaDe = (indice) => this.posicion(indice).fila;
    const fueraDeSitio = [...this.#celdas.keys()].filter((i) => this.#celdas[i] !== objetivo[filaDe(i)]);

    let sencilla = null;
    for (const a of fueraDeSitio) {
      for (const b of fueraDeSitio) {
        if (objetivo[filaDe(b)] !== this.#celdas[a]) continue;
        if (this.#celdas[b] === objetivo[filaDe(a)]) return [a, b];
        sencilla ??= [a, b];
      }
    }
    return sencilla;
  }

  #cambiar(a, b) {
    [this.#celdas[a], this.#celdas[b]] = [this.#celdas[b], this.#celdas[a]];
  }

  #esCelda(indice) {
    return Number.isInteger(indice) && indice >= 0 && indice < this.#celdas.length;
  }
}

/**
 * Tipo que debe acabar en cada fila para dejar el máximo de fichas ya en su sitio.
 * Programación dinámica sobre (fila, filas que le quedan a cada tipo).
 */
export function repartoOptimo(celdas, n) {
  const cuentas = filasDe(celdas, n).map(contarTipos);
  const cupos = contarTipos(celdas).map((total) => total / n);
  const memo = new Map();

  const mejor = (fila, restantes) => {
    if (fila === n) return { colocadas: 0, tipos: [] };
    const clave = `${fila}:${restantes}`;
    if (memo.has(clave)) return memo.get(clave);

    let resultado = null;
    for (let tipo = 0; tipo < TIPOS; tipo++) {
      if (restantes[tipo] === 0) continue;
      const resto = mejor(fila + 1, restantes.with(tipo, restantes[tipo] - 1));
      const colocadas = cuentas[fila][tipo] + resto.colocadas;
      if (!resultado || colocadas > resultado.colocadas) resultado = { colocadas, tipos: [tipo, ...resto.tipos] };
    }
    memo.set(clave, resultado);
    return resultado;
  };

  return mejor(0, cupos).tipos;
}

// Reparte las filas entre los tipos (tablero resoluble) y baraja hasta que ninguna
// fila empiece completa.
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
