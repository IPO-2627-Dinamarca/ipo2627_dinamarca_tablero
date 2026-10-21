export const NOMBRES_FORMA = {
  circulo: "círculo",
  cuadrado: "cuadrado",
  triangulo: "triángulo",
  rombo: "rombo",
  hexagono: "hexágono",
  estrella: "estrella",
};

// Esmaltes de --triada-1…6 en css/tokens.css. Son sustantivos en aposición: no concuerdan en género.
export const NOMBRES_COLOR = {
  "tono-1": "cobalto",
  "tono-2": "manganeso",
  "tono-3": "almagra",
  "tono-4": "ocre",
  "tono-5": "verde",
  "tono-6": "turquesa",
};

/** Nombre legible de una ficha, p. ej. "triángulo verde" o "estrella cobalto". */
export function nombreFicha({ forma, color }) {
  return `${NOMBRES_FORMA[forma]} ${NOMBRES_COLOR[color]}`;
}

export function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
