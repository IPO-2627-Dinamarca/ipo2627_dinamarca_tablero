export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => [...document.querySelectorAll(selector)];

/** Asigna las clases BEM de la ficha: ficha ficha--<forma> ficha--<color>. */
export function aplicarAspecto(elemento, { forma, color }, ...otrasClases) {
  elemento.className = ["ficha", `ficha--${forma}`, `ficha--${color}`, ...otrasClases].join(" ");
}
