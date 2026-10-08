import { COLORES, DIMENSION_MAX, DIMENSION_MIN, FORMAS, TAMANOS, TIPOS } from "./constantes.js";
import { guardar, leer } from "./almacen.js";

const CLAVE = "tablero:configuracion";

const POR_DEFECTO = {
  dimension: 5,
  tamano: "mediana",
  // tríada (tonos a 120°) y formas fáciles de distinguir
  aspecto: [
    { forma: "circulo", color: "tono-1" },
    { forma: "cuadrado", color: "tono-3" },
    { forma: "triangulo", color: "tono-5" },
  ],
};

/** Ajustes del juego, persistidos en localStorage. */
export class Configuracion {
  #datos;

  constructor() {
    this.#datos = validar(leer(CLAVE));
  }

  get dimension() {
    return this.#datos.dimension;
  }

  get tamano() {
    return this.#datos.tamano;
  }

  /** Copia de la forma y el color de cada tipo. */
  get aspecto() {
    return this.#datos.aspecto.map((ficha) => ({ ...ficha }));
  }

  set dimension(valor) {
    const n = normalizarDimension(valor);
    if (n === null) return;
    this.#datos.dimension = n;
    guardar(CLAVE, this.#datos);
  }

  set tamano(valor) {
    if (!TAMANOS.includes(valor)) return;
    this.#datos.tamano = valor;
    guardar(CLAVE, this.#datos);
  }

  /** Cambia la forma de un tipo; si otro la tenía, se intercambian. */
  cambiarForma(tipo, forma) {
    if (FORMAS.includes(forma)) this.#cambiarRasgo(tipo, "forma", forma);
  }

  /** Cambia el color de un tipo; si otro lo tenía, se intercambian. */
  cambiarColor(tipo, color) {
    if (COLORES.includes(color)) this.#cambiarRasgo(tipo, "color", color);
  }

  #cambiarRasgo(tipo, rasgo, valor) {
    if (!Number.isInteger(tipo) || tipo < 0 || tipo >= TIPOS) return;
    const aspecto = this.#datos.aspecto;
    const otro = aspecto.find((ficha) => ficha[rasgo] === valor);
    if (otro) otro[rasgo] = aspecto[tipo][rasgo];
    aspecto[tipo][rasgo] = valor;
    guardar(CLAVE, this.#datos);
  }
}

// Descarta lo guardado que no sea válido.
function validar(guardado) {
  if (typeof guardado !== "object" || guardado === null) guardado = {};
  const aspecto = Array.isArray(guardado.aspecto) ? guardado.aspecto : [];
  const aspectoValido =
    aspecto.length === TIPOS &&
    aspecto.every((ficha) => FORMAS.includes(ficha?.forma) && COLORES.includes(ficha?.color)) &&
    new Set(aspecto.map((ficha) => ficha.forma)).size === TIPOS &&
    new Set(aspecto.map((ficha) => ficha.color)).size === TIPOS;

  return {
    dimension: normalizarDimension(guardado.dimension) ?? POR_DEFECTO.dimension,
    tamano: TAMANOS.includes(guardado.tamano) ? guardado.tamano : POR_DEFECTO.tamano,
    aspecto: (aspectoValido ? aspecto : POR_DEFECTO.aspecto).map(({ forma, color }) => ({ forma, color })),
  };
}

// Entero dentro de [DIMENSION_MIN, DIMENSION_MAX], o null si no es un número.
function normalizarDimension(valor) {
  const n = Number.parseInt(valor, 10);
  return Number.isNaN(n) ? null : Math.min(DIMENSION_MAX, Math.max(DIMENSION_MIN, n));
}
