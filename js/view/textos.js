export const NOMBRES_FORMA = {
  circulo: "círculo",
  cuadrado: "cuadrado",
  triangulo: "triángulo",
  rombo: "rombo",
  hexagono: "hexágono",
  estrella: "estrella",
};

// Corresponden a los matices de --hexa-1…6 en css/tokens.css.
export const NOMBRES_COLOR = {
  "tono-1": "rojo",
  "tono-2": "ámbar",
  "tono-3": "verde",
  "tono-4": "turquesa",
  "tono-5": "azul",
  "tono-6": "violeta",
};

/** Nombre legible de una ficha, p. ej. "triángulo azul" o "estrella roja". */
export function nombreFicha({ forma, color }) {
  const nombreColor = forma === "estrella" && color === "tono-1" ? "roja" : NOMBRES_COLOR[color];
  return `${NOMBRES_FORMA[forma]} ${nombreColor}`;
}

export function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
