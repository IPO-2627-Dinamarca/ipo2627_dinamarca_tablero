// MODELO: características del tablero y de las fichas (dimensión N, tamaño y aspecto
// de cada uno de los 3 tipos). Se guardan en localStorage para recordarlas entre visitas.
// Los tres tipos siempre tienen formas distintas y colores distintos: si se elige para un
// tipo una forma (o un color) que ya usa otro, ambos se la intercambian.
import { TIPOS } from "./partida.js";

const CLAVE = "tablero:configuracion";

export const DIMENSION_MIN = 3;
export const DIMENSION_MAX = 9;

export const TAMANOS = {
  pequena: "Pequeña",
  mediana: "Mediana",
  grande: "Grande",
};

export const FORMAS = {
  circulo: "Círculo",
  cuadrado: "Cuadrado",
  triangulo: "Triángulo",
  rombo: "Rombo",
  hexagono: "Hexágono",
  estrella: "Estrella",
};

// Seis tonos repartidos cada 60° en el círculo cromático (ver css/tokens.css).
export const COLORES = {
  rojo: "Rojo",
  ambar: "Ámbar",
  verde: "Verde",
  turquesa: "Turquesa",
  azul: "Azul",
  violeta: "Violeta",
};

const POR_DEFECTO = {
  dimension: 5,
  tamano: "mediana",
  // Tríada cromática (rojo, verde, azul: 120° entre sí) y tres formas bien distintas.
  aspecto: [
    { forma: "circulo", color: "rojo" },
    { forma: "cuadrado", color: "verde" },
    { forma: "triangulo", color: "azul" },
  ],
};

export class Configuracion {
  #datos;

  constructor() {
    this.#datos = validar(this.#leer());
  }

  get dimension() {
    return this.#datos.dimension;
  }

  get tamano() {
    return this.#datos.tamano;
  }

  get aspecto() {
    return this.#datos.aspecto.map((ficha) => ({ ...ficha }));
  }

  set dimension(valor) {
    const n = Math.round(Number(valor));
    if (!Number.isFinite(n)) return;
    this.#datos.dimension = Math.min(DIMENSION_MAX, Math.max(DIMENSION_MIN, n));
    this.#guardar();
  }

  set tamano(valor) {
    if (!Object.hasOwn(TAMANOS, valor)) return;
    this.#datos.tamano = valor;
    this.#guardar();
  }

  cambiarForma(tipo, forma) {
    if (Object.hasOwn(FORMAS, forma)) this.#cambiarRasgo(tipo, "forma", forma);
  }

  cambiarColor(tipo, color) {
    if (Object.hasOwn(COLORES, color)) this.#cambiarRasgo(tipo, "color", color);
  }

  // Texto legible para el usuario, p. ej. "triángulo azul".
  describir(tipo) {
    const { forma, color } = this.#datos.aspecto[tipo];
    return `${FORMAS[forma]} ${COLORES[color]}`.toLowerCase();
  }

  #cambiarRasgo(tipo, rasgo, valor) {
    const aspecto = this.#datos.aspecto;
    if (!aspecto[tipo]) return;
    const otro = aspecto.find((ficha) => ficha[rasgo] === valor);
    if (otro) otro[rasgo] = aspecto[tipo][rasgo];
    aspecto[tipo][rasgo] = valor;
    this.#guardar();
  }

  #leer() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE)) ?? {};
    } catch {
      return {};
    }
  }

  #guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.#datos));
    } catch {
      // almacenamiento no disponible: la configuración solo dura la sesión
    }
  }
}

// Descarta lo guardado que no sea válido (versiones antiguas, datos manipulados...).
function validar(guardado) {
  const dimension = Number.isInteger(guardado.dimension) ? guardado.dimension : POR_DEFECTO.dimension;
  const aspecto = Array.isArray(guardado.aspecto) ? guardado.aspecto : [];
  const aspectoValido =
    aspecto.length === TIPOS &&
    aspecto.every((ficha) => Object.hasOwn(FORMAS, ficha?.forma) && Object.hasOwn(COLORES, ficha?.color)) &&
    new Set(aspecto.map((ficha) => ficha.forma)).size === TIPOS &&
    new Set(aspecto.map((ficha) => ficha.color)).size === TIPOS;

  return {
    dimension: Math.min(DIMENSION_MAX, Math.max(DIMENSION_MIN, dimension)),
    tamano: Object.hasOwn(TAMANOS, guardado.tamano) ? guardado.tamano : POR_DEFECTO.tamano,
    aspecto: (aspectoValido ? aspecto : POR_DEFECTO.aspecto).map(({ forma, color }) => ({ forma, color })),
  };
}
