// VISTA (auxiliar): el aspecto de una ficha se expresa con dos modificadores BEM,
// uno de forma y otro de color (p. ej. "ficha ficha--triangulo ficha--azul").
// Toda la geometría y el color están en CSS; aquí solo se eligen las clases.
export function aplicarAspecto(elemento, { forma, color }, ...otrasClases) {
  elemento.className = ["ficha", `ficha--${forma}`, `ficha--${color}`, ...otrasClases].filter(Boolean).join(" ");
}
