// clases BEM de la ficha: "ficha ficha--<forma> ficha--<color>"
export function aplicarAspecto(elemento, { forma, color }, ...otrasClases) {
  elemento.className = ["ficha", `ficha--${forma}`, `ficha--${color}`, ...otrasClases].join(" ");
}
